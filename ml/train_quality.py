#!/usr/bin/env python3
"""
CNN Quality Grading Model Training Script
- Transfer learning with MobileNetV3-Large (pretrained on ImageNet)
- Custom dual-head: classification (fresh/rotten) + quality score regression
- GPU training with FP16 mixed precision
- Early stopping, cosine LR scheduler
- Saves best model to models/quality/best.pth
"""

import os
import sys
import json
import yaml
import time
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from pathlib import Path
try:
    from torch.amp import autocast, GradScaler
except ImportError:
    try:
        from torch.cuda.amp import autocast, GradScaler
    except ImportError:
        autocast = None
        GradScaler = None




def load_config(config_path="ml/config.yaml"):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


class QualityGradingModel(nn.Module):
    """
    Dual-head model for quality assessment:
    - Classification head: fresh vs rotten (2 classes)
    - Quality score head: regression to 0-100 score
    """
    def __init__(self, architecture="mobilenet_v3_large", num_classes=2):
        super().__init__()
        self.num_classes = num_classes
        
        if architecture == "mobilenet_v3_large":
            self.backbone = models.mobilenet_v3_large(weights=models.MobileNet_V3_Large_Weights.DEFAULT)
            feature_dim = self.backbone.classifier[0].in_features
            self.backbone.classifier = nn.Identity()
        elif architecture == "efficientnet_b0":
            self.backbone = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
            feature_dim = self.backbone.classifier[1].in_features
            self.backbone.classifier = nn.Identity()
        else:
            raise ValueError(f"Unsupported architecture: {architecture}")
        
        # Shared feature extraction layers
        self.shared_fc = nn.Sequential(
            nn.Linear(feature_dim, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
        )
        
        # Classification head (fresh/rotten)
        self.classifier = nn.Sequential(
            nn.Linear(512, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(256, num_classes),
        )
        
        # Quality score regression head (0-100)
        self.quality_regressor = nn.Sequential(
            nn.Linear(512, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(256, 1),
            nn.Sigmoid(),  # Output [0, 1], scale to [0, 100]
        )
    
    def forward(self, x):
        features = self.backbone(x)
        shared = self.shared_fc(features)
        class_logits = self.classifier(shared)
        quality_score = self.quality_regressor(shared) * 100.0  # Scale to 0-100
        return class_logits, quality_score.squeeze(-1)


def get_transforms(imgsz=224, is_train=True):
    """Get image transforms for training and validation."""
    if is_train:
        return transforms.Compose([
            transforms.Resize((imgsz + 32, imgsz + 32)),
            transforms.RandomCrop(imgsz),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomVerticalFlip(p=0.1),
            transforms.RandomRotation(15),
            transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.1),
            transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            transforms.RandomErasing(p=0.15),
        ])
    else:
        return transforms.Compose([
            transforms.Resize((imgsz, imgsz)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])


def generate_quality_targets(labels, class_names):
    """
    Generate quality score targets from class labels.
    fresh → high score (85-100), rotten → low score (0-25)
    """
    scores = torch.zeros(len(labels), dtype=torch.float32)
    for i, label in enumerate(labels):
        cls_name = class_names[label].lower()
        if "fresh" in cls_name:
            scores[i] = np.random.uniform(85, 100)
        elif "rotten" in cls_name:
            scores[i] = np.random.uniform(0, 25)
        else:
            scores[i] = 50.0
    return scores


def train_quality():
    config = load_config()
    q_cfg = config["quality"]
    hw_cfg = config["hardware"]
    
    # Paths
    data_dir = os.path.join(config["paths"]["processed_dir"], "quality")
    model_save_dir = config["paths"]["quality_model_dir"]
    preprocessing_config_path = config["paths"]["preprocessing_config"]
    os.makedirs(model_save_dir, exist_ok=True)
    os.makedirs(os.path.dirname(preprocessing_config_path), exist_ok=True)
    
    # Verify dataset exists
    train_dir = os.path.join(data_dir, "train")
    val_dir = os.path.join(data_dir, "val")
    
    if not os.path.exists(train_dir):
        print(f"ERROR: Training data not found at {train_dir}")
        print("Run preprocess_dataset.py first.")
        sys.exit(1)
    
    # Device
    device = torch.device(hw_cfg["device"] if torch.cuda.is_available() else "cpu")
    use_amp = hw_cfg["mixed_precision"] and torch.cuda.is_available()
    
    print(f"\n{'='*60}")
    print(f"QUALITY GRADING MODEL TRAINING")
    print(f"{'='*60}")
    print(f"  Architecture: {q_cfg['architecture']}")
    print(f"  Device: {device}")
    print(f"  Mixed Precision: {use_amp}")
    print(f"  Image Size: {q_cfg['imgsz']}")
    print(f"  Batch Size: {q_cfg['batch_size']}")
    print(f"  Epochs: {q_cfg['epochs']}")
    print(f"  Learning Rate: {q_cfg['learning_rate']}")
    print(f"  Weight Decay: {q_cfg['weight_decay']}")
    print(f"  Patience: {q_cfg['patience']}")
    print(f"{'='*60}\n")
    
    # Data loading
    train_transform = get_transforms(q_cfg["imgsz"], is_train=True)
    val_transform = get_transforms(q_cfg["imgsz"], is_train=False)
    
    train_dataset = datasets.ImageFolder(train_dir, transform=train_transform)
    val_dataset = datasets.ImageFolder(val_dir, transform=val_transform)
    
    class_names = train_dataset.classes
    num_classes = len(class_names)
    
    print(f"Classes: {class_names}")
    print(f"Training samples: {len(train_dataset)}")
    print(f"Validation samples: {len(val_dataset)}")
    
    # Class distribution
    class_counts = {}
    for _, label in train_dataset.samples:
        cls = class_names[label]
        class_counts[cls] = class_counts.get(cls, 0) + 1
    print(f"Class distribution (train): {class_counts}")
    
    # Compute class weights for balanced training
    total_samples = sum(class_counts.values())
    class_weights = torch.tensor(
        [total_samples / (num_classes * class_counts.get(c, 1)) for c in class_names],
        dtype=torch.float32
    ).to(device)
    
    train_loader = DataLoader(
        train_dataset, batch_size=q_cfg["batch_size"],
        shuffle=True, num_workers=hw_cfg["num_workers"],
        pin_memory=True, drop_last=True
    )
    val_loader = DataLoader(
        val_dataset, batch_size=q_cfg["batch_size"],
        shuffle=False, num_workers=hw_cfg["num_workers"],
        pin_memory=True
    )
    
    # Model
    model = QualityGradingModel(
        architecture=q_cfg["architecture"],
        num_classes=num_classes
    ).to(device)
    
    # Count parameters
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"\nTotal parameters: {total_params:,}")
    print(f"Trainable parameters: {trainable_params:,}")
    
    # Loss functions
    cls_criterion = nn.CrossEntropyLoss(weight=class_weights)
    reg_criterion = nn.SmoothL1Loss()
    
    # Optimizer
    optimizer = optim.AdamW(
        model.parameters(),
        lr=q_cfg["learning_rate"],
        weight_decay=q_cfg["weight_decay"]
    )
    
    # Cosine annealing LR scheduler
    scheduler = optim.lr_scheduler.CosineAnnealingLR(
        optimizer,
        T_max=q_cfg["epochs"],
        eta_min=q_cfg["learning_rate"] * 0.01
    )
    
    # Mixed precision scaler
    scaler = GradScaler('cuda', enabled=use_amp)
    
    # Training loop
    best_val_acc = 0.0
    best_val_loss = float('inf')
    patience_counter = 0
    history = {"train_loss": [], "val_loss": [], "train_acc": [], "val_acc": [], "lr": []}
    
    print(f"\n{'='*60}")
    print(f"STARTING TRAINING")
    print(f"{'='*60}\n")
    
    for epoch in range(q_cfg["epochs"]):
        epoch_start = time.time()
        
        # === TRAINING ===
        model.train()
        running_loss = 0.0
        running_cls_loss = 0.0
        running_reg_loss = 0.0
        correct = 0
        total = 0
        
        for batch_idx, (images, labels) in enumerate(train_loader):
            images = images.to(device, non_blocking=True)
            labels = labels.to(device, non_blocking=True)
            
            # Generate quality score targets
            quality_targets = generate_quality_targets(labels, class_names).to(device)
            
            optimizer.zero_grad()
            
            with autocast('cuda', enabled=use_amp):
                class_logits, quality_scores = model(images)
                loss_cls = cls_criterion(class_logits, labels)
                loss_reg = reg_criterion(quality_scores, quality_targets)
                loss = loss_cls + 0.3 * loss_reg  # Weighted combination
            
            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            scaler.step(optimizer)
            scaler.update()
            
            running_loss += loss.item()
            running_cls_loss += loss_cls.item()
            running_reg_loss += loss_reg.item()
            
            _, predicted = torch.max(class_logits, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
            if (batch_idx + 1) % 20 == 0:
                print(f"  Epoch {epoch+1}/{q_cfg['epochs']} | "
                      f"Batch {batch_idx+1}/{len(train_loader)} | "
                      f"Loss: {loss.item():.4f} (cls: {loss_cls.item():.4f}, reg: {loss_reg.item():.4f})")
        
        train_loss = running_loss / len(train_loader)
        train_acc = correct / total
        
        # === VALIDATION ===
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(device, non_blocking=True)
                labels = labels.to(device, non_blocking=True)
                quality_targets = generate_quality_targets(labels, class_names).to(device)
                
                with autocast('cuda', enabled=use_amp):
                    class_logits, quality_scores = model(images)
                    loss_cls = cls_criterion(class_logits, labels)
                    loss_reg = reg_criterion(quality_scores, quality_targets)
                    loss = loss_cls + 0.3 * loss_reg
                
                val_loss += loss.item()
                _, predicted = torch.max(class_logits, 1)
                val_total += labels.size(0)
                val_correct += (predicted == labels).sum().item()
        
        val_loss /= len(val_loader)
        val_acc = val_correct / val_total
        current_lr = optimizer.param_groups[0]['lr']
        
        # Record history
        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)
        history["train_acc"].append(train_acc)
        history["val_acc"].append(val_acc)
        history["lr"].append(current_lr)
        
        epoch_time = time.time() - epoch_start
        
        print(f"\nEpoch {epoch+1}/{q_cfg['epochs']} ({epoch_time:.1f}s)")
        print(f"  Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.4f}")
        print(f"  Val Loss:   {val_loss:.4f} | Val Acc:   {val_acc:.4f}")
        print(f"  LR: {current_lr:.6f}")
        
        # Save best model
        if val_acc > best_val_acc or (val_acc == best_val_acc and val_loss < best_val_loss):
            best_val_acc = val_acc
            best_val_loss = val_loss
            patience_counter = 0
            
            save_path = os.path.join(model_save_dir, "best.pth")
            torch.save({
                "epoch": epoch + 1,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_acc": val_acc,
                "val_loss": val_loss,
                "architecture": q_cfg["architecture"],
                "num_classes": num_classes,
                "class_names": class_names,
                "imgsz": q_cfg["imgsz"],
            }, save_path)
            print(f"  ✓ Best model saved! (Val Acc: {val_acc:.4f})")
        else:
            patience_counter += 1
            print(f"  No improvement ({patience_counter}/{q_cfg['patience']})")
        
        # Early stopping
        if patience_counter >= q_cfg["patience"]:
            print(f"\n⚡ Early stopping triggered at epoch {epoch+1}")
            break
        
        scheduler.step()
    
    # Save preprocessing config
    preprocessing_config = {
        "architecture": q_cfg["architecture"],
        "imgsz": q_cfg["imgsz"],
        "num_classes": num_classes,
        "class_names": class_names,
        "normalization": {
            "mean": [0.485, 0.456, 0.406],
            "std": [0.229, 0.224, 0.225]
        },
        "grading": config["grading"],
        "best_val_accuracy": best_val_acc,
        "best_val_loss": best_val_loss,
        "training_history": history,
    }
    
    with open(preprocessing_config_path, "w") as f:
        json.dump(preprocessing_config, f, indent=2)
    print(f"\n✓ Preprocessing config saved to: {preprocessing_config_path}")
    
    # Save training history plot
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        
        fig, axes = plt.subplots(1, 3, figsize=(18, 5))
        
        # Loss plot
        axes[0].plot(history["train_loss"], label="Train Loss", color="#2196F3")
        axes[0].plot(history["val_loss"], label="Val Loss", color="#FF5722")
        axes[0].set_title("Loss Curves", fontsize=14)
        axes[0].set_xlabel("Epoch")
        axes[0].set_ylabel("Loss")
        axes[0].legend()
        axes[0].grid(True, alpha=0.3)
        
        # Accuracy plot
        axes[1].plot(history["train_acc"], label="Train Acc", color="#4CAF50")
        axes[1].plot(history["val_acc"], label="Val Acc", color="#9C27B0")
        axes[1].set_title("Accuracy Curves", fontsize=14)
        axes[1].set_xlabel("Epoch")
        axes[1].set_ylabel("Accuracy")
        axes[1].legend()
        axes[1].grid(True, alpha=0.3)
        
        # LR plot
        axes[2].plot(history["lr"], label="Learning Rate", color="#FF9800")
        axes[2].set_title("Learning Rate Schedule", fontsize=14)
        axes[2].set_xlabel("Epoch")
        axes[2].set_ylabel("LR")
        axes[2].legend()
        axes[2].grid(True, alpha=0.3)
        
        plt.tight_layout()
        plot_path = os.path.join(config["paths"]["reports_dir"], "quality_training_curves.png")
        os.makedirs(os.path.dirname(plot_path), exist_ok=True)
        plt.savefig(plot_path, dpi=150)
        plt.close()
        print(f"✓ Training curves saved to: {plot_path}")
    except Exception as e:
        print(f"⚠ Could not save training plots: {e}")
    
    print(f"\n{'='*60}")
    print(f"QUALITY TRAINING COMPLETE")
    print(f"{'='*60}")
    print(f"  Best Val Accuracy: {best_val_acc:.4f}")
    print(f"  Best Val Loss: {best_val_loss:.4f}")
    print(f"  Model: {os.path.join(model_save_dir, 'best.pth')}")
    print(f"{'='*60}")


if __name__ == "__main__":
    train_quality()
