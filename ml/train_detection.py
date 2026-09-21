#!/usr/bin/env python3
"""
YOLOv8 Detection Model Training Script
- Automatically selects YOLOv8n/YOLOv8s based on GPU VRAM
- Uses CUDA with FP16 mixed precision
- Cosine LR scheduler with early stopping
- Saves best weights to models/detection/best.pt
"""

import os
import sys
import yaml
import shutil
import torch
from pathlib import Path
from ultralytics import YOLO


def load_config(config_path="ml/config.yaml"):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def select_model_variant():
    """Auto-select YOLOv8 variant based on available GPU VRAM."""
    if torch.cuda.is_available():
        vram_mb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 2)
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"VRAM: {vram_mb:.0f} MB")
        if vram_mb < 4500:
            print("→ Selecting YOLOv8n (nano) for ≤4GB VRAM")
            return "yolov8n.pt"
        else:
            print("→ Selecting YOLOv8s (small) for >4GB VRAM")
            return "yolov8s.pt"
    else:
        print("⚠ No CUDA GPU detected. Training on CPU (will be slow).")
        return "yolov8n.pt"


def train_detection():
    config = load_config()
    
    # Paths
    yolo_dir = os.path.join(config["paths"]["processed_dir"], "detection")
    data_yaml = os.path.join(yolo_dir, "data.yaml")
    model_save_dir = config["paths"]["detection_model_dir"]
    os.makedirs(model_save_dir, exist_ok=True)
    
    # Verify data.yaml exists
    if not os.path.exists(data_yaml):
        print(f"ERROR: data.yaml not found at {data_yaml}")
        print("Run preprocess_dataset.py first to generate the detection dataset.")
        sys.exit(1)
    
    # Print dataset info
    with open(data_yaml, "r") as f:
        data_cfg = yaml.safe_load(f)
    print(f"\nDataset: {data_cfg.get('nc', '?')} classes")
    print(f"Classes: {data_cfg.get('names', {})}")
    
    # Select model variant
    model_variant = select_model_variant()
    
    # Training hyperparameters from config
    det_cfg = config["detection"]
    device = config["hardware"]["device"] if torch.cuda.is_available() else "cpu"
    use_amp = config["hardware"]["mixed_precision"] and torch.cuda.is_available()
    
    print(f"\n{'='*60}")
    print(f"TRAINING CONFIGURATION")
    print(f"{'='*60}")
    print(f"  Model: {model_variant}")
    print(f"  Device: {device}")
    print(f"  Mixed Precision (FP16): {use_amp}")
    print(f"  Image Size: {det_cfg['imgsz']}")
    print(f"  Batch Size: {det_cfg['batch_size']}")
    print(f"  Epochs: {det_cfg['epochs']}")
    print(f"  Patience (Early Stop): {det_cfg['patience']}")
    print(f"  Confidence Threshold: {det_cfg['confidence_threshold']}")
    print(f"  IoU Threshold: {det_cfg['iou_threshold']}")
    print(f"{'='*60}\n")
    
    # Initialize YOLO model
    model = YOLO(model_variant)
    
    # Train
    results = model.train(
        data=data_yaml,
        epochs=det_cfg["epochs"],
        imgsz=det_cfg["imgsz"],
        batch=det_cfg["batch_size"],
        device=device,
        patience=det_cfg["patience"],
        amp=use_amp,
        workers=config["hardware"]["num_workers"],
        project=os.path.join(yolo_dir, "runs"),
        name="train",
        exist_ok=True,
        seed=config["random_seed"],
        # Augmentation
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=10.0,
        translate=0.1,
        scale=0.5,
        fliplr=0.5,
        mosaic=1.0,
        mixup=0.1,
        # Optimizer
        optimizer="AdamW",
        lr0=0.001,
        lrf=0.01,
        cos_lr=True,
        weight_decay=0.0005,
        warmup_epochs=3,
        # Logging
        verbose=True,
        plots=True,
    )
    
    # Copy best weights to models/detection/
    best_pt_src = os.path.join(yolo_dir, "runs", "train", "weights", "best.pt")
    best_pt_dst = os.path.join(model_save_dir, "best.pt")
    
    if os.path.exists(best_pt_src):
        shutil.copy2(best_pt_src, best_pt_dst)
        print(f"\n✓ Best detection model saved to: {best_pt_dst}")
        
        # Print final metrics
        metrics = results.results_dict if hasattr(results, 'results_dict') else {}
        print(f"\n{'='*60}")
        print(f"TRAINING RESULTS")
        print(f"{'='*60}")
        for key, val in metrics.items():
            if isinstance(val, float):
                print(f"  {key}: {val:.4f}")
        print(f"{'='*60}")
    else:
        # Try last.pt as fallback
        last_pt_src = os.path.join(yolo_dir, "runs", "train", "weights", "last.pt")
        if os.path.exists(last_pt_src):
            shutil.copy2(last_pt_src, best_pt_dst)
            print(f"\n✓ Last detection model saved to: {best_pt_dst} (best.pt not found, using last.pt)")
        else:
            print(f"\n✗ ERROR: No trained weights found!")
            sys.exit(1)
    
    print(f"\nDetection training complete!")
    return best_pt_dst


if __name__ == "__main__":
    train_detection()
