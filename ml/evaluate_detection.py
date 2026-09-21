#!/usr/bin/env python3
"""
YOLOv8 Detection Model Evaluation Script
- Evaluates on validation/test sets
- Computes Precision, Recall, mAP@50, mAP@50:95
- Generates confusion matrix and sample prediction overlays
"""

import os
import sys
import yaml
import json
import torch
import numpy as np
from pathlib import Path
from ultralytics import YOLO


def load_config(config_path="ml/config.yaml"):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def evaluate_detection():
    config = load_config()
    
    # Paths
    yolo_dir = os.path.join(config["paths"]["processed_dir"], "detection")
    data_yaml = os.path.join(yolo_dir, "data.yaml")
    model_path = os.path.join(config["paths"]["detection_model_dir"], "best.pt")
    reports_dir = config["paths"]["reports_dir"]
    os.makedirs(reports_dir, exist_ok=True)
    
    if not os.path.exists(model_path):
        print(f"ERROR: Detection model not found at {model_path}")
        print("Run train_detection.py first.")
        sys.exit(1)
    
    if not os.path.exists(data_yaml):
        print(f"ERROR: data.yaml not found at {data_yaml}")
        sys.exit(1)
    
    print(f"\n{'='*60}")
    print(f"DETECTION MODEL EVALUATION")
    print(f"{'='*60}")
    print(f"  Model: {model_path}")
    print(f"  Dataset: {data_yaml}")
    
    # Load model
    model = YOLO(model_path)
    device = config["hardware"]["device"] if torch.cuda.is_available() else "cpu"
    
    # Validate on val set
    print(f"\n--- Validation Set Evaluation ---")
    val_results = model.val(
        data=data_yaml,
        split="val",
        device=device,
        imgsz=config["detection"]["imgsz"],
        batch=config["detection"]["batch_size"],
        conf=config["detection"]["confidence_threshold"],
        iou=config["detection"]["iou_threshold"],
        plots=True,
        save_json=True,
        project=os.path.join(yolo_dir, "runs"),
        name="val_eval",
        exist_ok=True,
    )
    
    # Extract metrics
    metrics = {}
    if hasattr(val_results, 'box'):
        box = val_results.box
        metrics["precision"] = float(box.mp) if hasattr(box, 'mp') else 0.0
        metrics["recall"] = float(box.mr) if hasattr(box, 'mr') else 0.0
        metrics["mAP50"] = float(box.map50) if hasattr(box, 'map50') else 0.0
        metrics["mAP50_95"] = float(box.map) if hasattr(box, 'map') else 0.0
        
        # Per-class metrics
        if hasattr(box, 'ap_class_index') and hasattr(box, 'ap'):
            with open(data_yaml, "r") as f:
                data_cfg = yaml.safe_load(f)
            class_names = data_cfg.get("names", {})
            
            per_class = {}
            for i, cls_idx in enumerate(box.ap_class_index):
                cls_name = class_names.get(int(cls_idx), f"class_{cls_idx}")
                per_class[cls_name] = {
                    "AP50": float(box.ap50[i]) if hasattr(box, 'ap50') and i < len(box.ap50) else 0.0,
                }
            metrics["per_class"] = per_class
    
    # Test set evaluation
    print(f"\n--- Test Set Evaluation ---")
    test_dir = os.path.join(yolo_dir, "test", "images")
    if os.path.exists(test_dir) and len(os.listdir(test_dir)) > 0:
        test_results = model.val(
            data=data_yaml,
            split="test",
            device=device,
            imgsz=config["detection"]["imgsz"],
            batch=config["detection"]["batch_size"],
            conf=config["detection"]["confidence_threshold"],
            iou=config["detection"]["iou_threshold"],
            plots=True,
            project=os.path.join(yolo_dir, "runs"),
            name="test_eval",
            exist_ok=True,
        )
        
        if hasattr(test_results, 'box'):
            box = test_results.box
            metrics["test_precision"] = float(box.mp) if hasattr(box, 'mp') else 0.0
            metrics["test_recall"] = float(box.mr) if hasattr(box, 'mr') else 0.0
            metrics["test_mAP50"] = float(box.map50) if hasattr(box, 'map50') else 0.0
            metrics["test_mAP50_95"] = float(box.map) if hasattr(box, 'map') else 0.0
    else:
        print("  No test images found, skipping test evaluation.")
    
    # Sample predictions
    print(f"\n--- Generating Sample Predictions ---")
    val_images_dir = os.path.join(yolo_dir, "val", "images")
    sample_images = []
    if os.path.exists(val_images_dir):
        all_val_imgs = [f for f in os.listdir(val_images_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        sample_images = all_val_imgs[:8]
    
    if sample_images:
        sample_paths = [os.path.join(val_images_dir, img) for img in sample_images]
        results = model.predict(
            source=sample_paths,
            device=device,
            conf=config["detection"]["confidence_threshold"],
            iou=config["detection"]["iou_threshold"],
            save=True,
            project=os.path.join(reports_dir, "detection_samples"),
            name="predictions",
            exist_ok=True,
        )
        print(f"  Saved {len(sample_images)} sample predictions.")
    
    # Save metrics JSON
    metrics_path = os.path.join(reports_dir, "detection_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"DETECTION EVALUATION RESULTS")
    print(f"{'='*60}")
    print(f"  Validation Set:")
    print(f"    Precision: {metrics.get('precision', 0):.4f}")
    print(f"    Recall:    {metrics.get('recall', 0):.4f}")
    print(f"    mAP@50:    {metrics.get('mAP50', 0):.4f}")
    print(f"    mAP@50:95: {metrics.get('mAP50_95', 0):.4f}")
    if "test_mAP50" in metrics:
        print(f"  Test Set:")
        print(f"    Precision: {metrics.get('test_precision', 0):.4f}")
        print(f"    Recall:    {metrics.get('test_recall', 0):.4f}")
        print(f"    mAP@50:    {metrics.get('test_mAP50', 0):.4f}")
        print(f"    mAP@50:95: {metrics.get('test_mAP50_95', 0):.4f}")
    print(f"\n  Metrics saved to: {metrics_path}")
    print(f"{'='*60}")
    
    return metrics


if __name__ == "__main__":
    evaluate_detection()
