#!/usr/bin/env python3
"""
CNN Quality Grading Model Evaluation Script
- Classification report (Precision, Recall, F1-score per class)
- Confusion matrix visualization
- Quality score distribution analysis
- ROC curve / AUC metrics
- Generates final_training_report.md
"""

import os
import sys
import json
import yaml
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from torch.amp import autocast
from sklearn.metrics import (
    classification_report, confusion_matrix, 
    roc_auc_score, roc_curve, accuracy_score, f1_score
)
from pathlib import Path

# Import model class from train_quality
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from train_quality import QualityGradingModel, get_transforms


def load_config(config_path="ml/config.yaml"):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def score_to_grade(score, grading_config):
    """Map a 0-100 quality score to a letter grade."""
    for grade, params in sorted(grading_config["grades"].items(), key=lambda x: x[1]["min_score"], reverse=True):
        if score >= params["min_score"]:
            return grade
    return "D"


def evaluate_quality():
    config = load_config()
    q_cfg = config["quality"]
    
    # Paths
    data_dir = os.path.join(config["paths"]["processed_dir"], "quality")
    model_path = os.path.join(config["paths"]["quality_model_dir"], "best.pth")
    preprocessing_config_path = config["paths"]["preprocessing_config"]
    reports_dir = config["paths"]["reports_dir"]
    os.makedirs(reports_dir, exist_ok=True)
    
    if not os.path.exists(model_path):
        print(f"ERROR: Quality model not found at {model_path}")
        print("Run train_quality.py first.")
        sys.exit(1)
    
    # Device
    device = torch.device(config["hardware"]["device"] if torch.cuda.is_available() else "cpu")
    use_amp = config["hardware"]["mixed_precision"] and torch.cuda.is_available()
    
    # Load checkpoint
    checkpoint = torch.load(model_path, map_location=device, weights_only=False)
    class_names = checkpoint["class_names"]
    num_classes = checkpoint["num_classes"]
    architecture = checkpoint["architecture"]
    imgsz = checkpoint["imgsz"]
    
    print(f"\n{'='*60}")
    print(f"QUALITY GRADING MODEL EVALUATION")
    print(f"{'='*60}")
    print(f"  Model: {model_path}")
    print(f"  Architecture: {architecture}")
    print(f"  Classes: {class_names}")
    print(f"  Trained epoch: {checkpoint.get('epoch', '?')}")
    print(f"  Trained val_acc: {checkpoint.get('val_acc', '?'):.4f}")
    
    # Load model
    model = QualityGradingModel(architecture=architecture, num_classes=num_classes).to(device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    
    # Evaluate on test set
    test_dir = os.path.join(data_dir, "test")
    if not os.path.exists(test_dir):
        print(f"Test set not found at {test_dir}, using val set")
        test_dir = os.path.join(data_dir, "val")
    
    test_transform = get_transforms(imgsz, is_train=False)
    test_dataset = datasets.ImageFolder(test_dir, transform=test_transform)
    test_loader = DataLoader(
        test_dataset, batch_size=q_cfg["batch_size"],
        shuffle=False, num_workers=config["hardware"]["num_workers"],
        pin_memory=True
    )
    
    print(f"  Test samples: {len(test_dataset)}")
    
    # Inference
    all_labels = []
    all_preds = []
    all_probs = []
    all_quality_scores = []
    
    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device, non_blocking=True)
            
            with autocast('cuda', enabled=use_amp):
                class_logits, quality_scores = model(images)
            
            probs = torch.softmax(class_logits, dim=1)
            _, predicted = torch.max(class_logits, 1)
            
            all_labels.extend(labels.cpu().numpy())
            all_preds.extend(predicted.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())
            all_quality_scores.extend(quality_scores.cpu().numpy())
    
    all_labels = np.array(all_labels)
    all_preds = np.array(all_preds)
    all_probs = np.array(all_probs)
    all_quality_scores = np.array(all_quality_scores)
    
    # Classification metrics
    accuracy = accuracy_score(all_labels, all_preds)
    f1_macro = f1_score(all_labels, all_preds, average='macro')
    f1_weighted = f1_score(all_labels, all_preds, average='weighted')
    
    cls_report = classification_report(
        all_labels, all_preds,
        target_names=class_names,
        output_dict=True
    )
    cls_report_text = classification_report(
        all_labels, all_preds,
        target_names=class_names
    )
    
    # Confusion matrix
    cm = confusion_matrix(all_labels, all_preds)
    
    # ROC AUC (binary case)
    if num_classes == 2:
        auc_score = roc_auc_score(all_labels, all_probs[:, 1])
        fpr, tpr, thresholds = roc_curve(all_labels, all_probs[:, 1])
    else:
        auc_score = roc_auc_score(all_labels, all_probs, multi_class='ovr', average='macro')
        fpr, tpr, thresholds = None, None, None
    
    # Quality score distribution
    quality_stats = {
        "mean": float(np.mean(all_quality_scores)),
        "std": float(np.std(all_quality_scores)),
        "min": float(np.min(all_quality_scores)),
        "max": float(np.max(all_quality_scores)),
        "median": float(np.median(all_quality_scores)),
    }
    
    # Grade distribution
    grade_counts = {"A": 0, "B": 0, "C": 0, "D": 0}
    for score in all_quality_scores:
        grade = score_to_grade(score, config["grading"])
        grade_counts[grade] += 1
    
    # Print results
    print(f"\n{'='*60}")
    print(f"EVALUATION RESULTS")
    print(f"{'='*60}")
    print(f"  Accuracy: {accuracy:.4f}")
    print(f"  F1 (Macro): {f1_macro:.4f}")
    print(f"  F1 (Weighted): {f1_weighted:.4f}")
    print(f"  AUC-ROC: {auc_score:.4f}")
    print(f"\n  Classification Report:")
    print(cls_report_text)
    print(f"\n  Confusion Matrix:")
    print(cm)
    print(f"\n  Quality Score Stats: {quality_stats}")
    print(f"  Grade Distribution: {grade_counts}")
    
    # Save metrics JSON
    metrics = {
        "accuracy": accuracy,
        "f1_macro": f1_macro,
        "f1_weighted": f1_weighted,
        "auc_roc": auc_score,
        "classification_report": cls_report,
        "confusion_matrix": cm.tolist(),
        "quality_score_stats": quality_stats,
        "grade_distribution": grade_counts,
    }
    
    metrics_path = os.path.join(reports_dir, "quality_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2, default=str)
    
    # Generate plots
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        
        fig, axes = plt.subplots(2, 2, figsize=(14, 12))
        
        # Confusion matrix heatmap
        im = axes[0, 0].imshow(cm, interpolation='nearest', cmap='Blues')
        axes[0, 0].set_title("Confusion Matrix", fontsize=14, fontweight='bold')
        axes[0, 0].set_xlabel("Predicted")
        axes[0, 0].set_ylabel("True")
        tick_marks = np.arange(len(class_names))
        axes[0, 0].set_xticks(tick_marks)
        axes[0, 0].set_xticklabels(class_names, rotation=45)
        axes[0, 0].set_yticks(tick_marks)
        axes[0, 0].set_yticklabels(class_names)
        for i in range(cm.shape[0]):
            for j in range(cm.shape[1]):
                axes[0, 0].text(j, i, str(cm[i, j]), ha="center", va="center",
                              color="white" if cm[i, j] > cm.max()/2 else "black")
        fig.colorbar(im, ax=axes[0, 0])
        
        # Quality score distribution
        fresh_scores = all_quality_scores[all_labels == class_names.index("fresh")] if "fresh" in class_names else []
        rotten_scores = all_quality_scores[all_labels == class_names.index("rotten")] if "rotten" in class_names else []
        
        if len(fresh_scores) > 0:
            axes[0, 1].hist(fresh_scores, bins=30, alpha=0.7, color='#4CAF50', label='Fresh', edgecolor='white')
        if len(rotten_scores) > 0:
            axes[0, 1].hist(rotten_scores, bins=30, alpha=0.7, color='#F44336', label='Rotten', edgecolor='white')
        axes[0, 1].set_title("Quality Score Distribution", fontsize=14, fontweight='bold')
        axes[0, 1].set_xlabel("Quality Score (0-100)")
        axes[0, 1].set_ylabel("Count")
        axes[0, 1].legend()
        axes[0, 1].grid(True, alpha=0.3)
        
        # Grade distribution bar chart
        grades = list(grade_counts.keys())
        counts = list(grade_counts.values())
        colors = ['#4CAF50', '#8BC34A', '#FF9800', '#F44336']
        axes[1, 0].bar(grades, counts, color=colors, edgecolor='white', linewidth=1.5)
        axes[1, 0].set_title("Grade Distribution", fontsize=14, fontweight='bold')
        axes[1, 0].set_xlabel("Grade")
        axes[1, 0].set_ylabel("Count")
        for i, (g, c) in enumerate(zip(grades, counts)):
            axes[1, 0].text(i, c + 1, str(c), ha='center', fontweight='bold')
        axes[1, 0].grid(True, alpha=0.3, axis='y')
        
        # ROC curve (if binary)
        if fpr is not None and tpr is not None:
            axes[1, 1].plot(fpr, tpr, color='#2196F3', lw=2, label=f'ROC (AUC = {auc_score:.3f})')
            axes[1, 1].plot([0, 1], [0, 1], color='gray', lw=1, linestyle='--')
            axes[1, 1].set_title("ROC Curve", fontsize=14, fontweight='bold')
            axes[1, 1].set_xlabel("False Positive Rate")
            axes[1, 1].set_ylabel("True Positive Rate")
            axes[1, 1].legend()
            axes[1, 1].grid(True, alpha=0.3)
        else:
            # Per-class F1 bar chart
            per_class_f1 = {cn: cls_report[cn]["f1-score"] for cn in class_names if cn in cls_report}
            axes[1, 1].bar(per_class_f1.keys(), per_class_f1.values(), color='#9C27B0', edgecolor='white')
            axes[1, 1].set_title("Per-Class F1 Score", fontsize=14, fontweight='bold')
            axes[1, 1].set_xlabel("Class")
            axes[1, 1].set_ylabel("F1 Score")
            axes[1, 1].grid(True, alpha=0.3, axis='y')
        
        plt.tight_layout()
        plot_path = os.path.join(reports_dir, "quality_evaluation_plots.png")
        plt.savefig(plot_path, dpi=150, bbox_inches='tight')
        plt.close()
        print(f"\n✓ Evaluation plots saved to: {plot_path}")
    except Exception as e:
        print(f"⚠ Could not generate plots: {e}")
    
    # Generate final training report
    generate_final_report(config, metrics, cls_report_text)
    
    print(f"\n{'='*60}")
    print(f"QUALITY EVALUATION COMPLETE")
    print(f"{'='*60}")
    
    return metrics


def generate_final_report(config, quality_metrics, cls_report_text):
    """Generate comprehensive final_training_report.md"""
    reports_dir = config["paths"]["reports_dir"]
    
    # Load detection metrics if available
    det_metrics_path = os.path.join(reports_dir, "detection_metrics.json")
    det_metrics = {}
    if os.path.exists(det_metrics_path):
        with open(det_metrics_path, "r") as f:
            det_metrics = json.load(f)
    
    report_path = os.path.join(reports_dir, "final_training_report.md")
    
    with open(report_path, "w") as f:
        f.write("# Final ML Training & Evaluation Report\n\n")
        f.write(f"**Generated**: Auto-generated after model evaluation\n\n")
        f.write("---\n\n")
        
        # Stage 1: Detection
        f.write("## Stage 1: YOLOv8 Object Detection\n\n")
        if det_metrics:
            f.write("### Validation Metrics\n\n")
            f.write("| Metric | Value |\n")
            f.write("|--------|-------|\n")
            f.write(f"| **Precision** | {det_metrics.get('precision', 'N/A'):.4f} |\n")
            f.write(f"| **Recall** | {det_metrics.get('recall', 'N/A'):.4f} |\n")
            f.write(f"| **mAP@50** | {det_metrics.get('mAP50', 'N/A'):.4f} |\n")
            f.write(f"| **mAP@50:95** | {det_metrics.get('mAP50_95', 'N/A'):.4f} |\n\n")
            
            if "test_mAP50" in det_metrics:
                f.write("### Test Metrics\n\n")
                f.write("| Metric | Value |\n")
                f.write("|--------|-------|\n")
                f.write(f"| **Precision** | {det_metrics.get('test_precision', 'N/A'):.4f} |\n")
                f.write(f"| **Recall** | {det_metrics.get('test_recall', 'N/A'):.4f} |\n")
                f.write(f"| **mAP@50** | {det_metrics.get('test_mAP50', 'N/A'):.4f} |\n")
                f.write(f"| **mAP@50:95** | {det_metrics.get('test_mAP50_95', 'N/A'):.4f} |\n\n")
            
            if "per_class" in det_metrics:
                f.write("### Per-Class AP@50\n\n")
                f.write("| Class | AP@50 |\n")
                f.write("|-------|-------|\n")
                for cls, vals in sorted(det_metrics["per_class"].items()):
                    f.write(f"| {cls} | {vals.get('AP50', 0):.4f} |\n")
                f.write("\n")
        else:
            f.write("*Detection evaluation not yet run. Execute `evaluate_detection.py` first.*\n\n")
        
        # Stage 2: Quality Grading
        f.write("## Stage 2: CNN Quality Grading\n\n")
        f.write("### Classification Metrics\n\n")
        f.write("| Metric | Value |\n")
        f.write("|--------|-------|\n")
        f.write(f"| **Accuracy** | {quality_metrics['accuracy']:.4f} |\n")
        f.write(f"| **F1 (Macro)** | {quality_metrics['f1_macro']:.4f} |\n")
        f.write(f"| **F1 (Weighted)** | {quality_metrics['f1_weighted']:.4f} |\n")
        f.write(f"| **AUC-ROC** | {quality_metrics['auc_roc']:.4f} |\n\n")
        
        f.write("### Detailed Classification Report\n\n")
        f.write("```\n")
        f.write(cls_report_text)
        f.write("```\n\n")
        
        f.write("### Confusion Matrix\n\n")
        cm = quality_metrics["confusion_matrix"]
        f.write("```\n")
        for row in cm:
            f.write("  " + "  ".join(f"{v:5d}" for v in row) + "\n")
        f.write("```\n\n")
        
        f.write("### Quality Score Statistics\n\n")
        qs = quality_metrics["quality_score_stats"]
        f.write(f"- **Mean**: {qs['mean']:.2f}\n")
        f.write(f"- **Std Dev**: {qs['std']:.2f}\n")
        f.write(f"- **Min**: {qs['min']:.2f}\n")
        f.write(f"- **Max**: {qs['max']:.2f}\n")
        f.write(f"- **Median**: {qs['median']:.2f}\n\n")
        
        f.write("### Grade Distribution\n\n")
        f.write("| Grade | Count | Description |\n")
        f.write("|-------|-------|-------------|\n")
        gd = quality_metrics["grade_distribution"]
        grading = config["grading"]["grades"]
        for grade in ["A", "B", "C", "D"]:
            desc = grading[grade]["description"]
            count = gd.get(grade, 0)
            f.write(f"| **{grade}** | {count} | {desc} |\n")
        f.write("\n")
        
        f.write("---\n\n")
        f.write("## System Architecture\n\n")
        f.write("1. **Input** → Image uploaded via API or CLI\n")
        f.write("2. **Stage 1** → YOLOv8 detects and localizes produce items with bounding boxes\n")
        f.write("3. **Stage 2** → Each crop is passed through MobileNetV3 for quality assessment\n")
        f.write("4. **Output** → JSON with detected items, quality scores (0-100), and grades (A/B/C/D)\n")
    
    print(f"\n✓ Final training report saved to: {report_path}")


if __name__ == "__main__":
    evaluate_quality()
