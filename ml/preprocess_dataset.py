#!/usr/bin/env python3
"""
Preprocess Dataset Script
Prepares:
1. Stratified Train (75%) / Val (15%) / Test (10%) splits for Quality CNN
2. Standard YOLOv8 detection dataset (images + YOLO .txt bounding box annotations)
   Includes single-item bounding boxes and multi-item composite scenes for robust multi-object detection
3. Generates data.yaml for YOLOv8
"""

import os
import sys
import yaml
import json
import random
import shutil
from pathlib import Path
from collections import defaultdict
from PIL import Image, ImageEnhance
import numpy as np

# Set fixed seed for strict reproducibility
RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

def load_config(config_path="ml/config.yaml"):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

ALL_CLASSES = [
    "apple", "banana", "bellpepper", "carrot", "cucumber",
    "grape", "guava", "jujube", "mango", "orange",
    "pomegranate", "potato", "strawberry", "tomato",
    "bean", "bitter_gourd", "bottle_gourd", "brinjal",
    "broccoli", "cabbage", "cauliflower", "papaya",
    "pumpkin", "radish"
]
CLASS_TO_ID = {c: i for i, c in enumerate(ALL_CLASSES)}

# Normalize dataset folder names to canonical class names
CLASS_NAME_MAP = {
    "capsicum": "bellpepper",
    "bell pepper": "bellpepper",
    "bell_pepper": "bellpepper",
    "bitter gourd": "bitter_gourd",
    "bottle gourd": "bottle_gourd",
}

def find_bounding_box(img_path):
    """
    Computes an accurate bounding box around the foreground fruit/vegetable.
    Returns normalized (x_center, y_center, width, height) in YOLO format.
    """
    try:
        with Image.open(img_path) as im:
            im = im.convert("RGB")
            w, h = im.size
            arr = np.array(im)
            
            # Grayscale & luminance
            gray = 0.2989 * arr[:,:,0] + 0.5870 * arr[:,:,1] + 0.1140 * arr[:,:,2]
            
            # Corner background estimation
            corners = [gray[:10, :10], gray[:10, -10:], gray[-10:, :10], gray[-10:, -10:]]
            bg_val = np.median([np.median(c) for c in corners])
            
            # Difference from background
            diff = np.abs(gray - bg_val)
            mask = diff > 25
            
            if np.sum(mask) > 100:
                y_indices, x_indices = np.where(mask)
                x_min, x_max = max(0, int(np.percentile(x_indices, 1))), min(w, int(np.percentile(x_indices, 99)))
                y_min, y_max = max(0, int(np.percentile(y_indices, 1))), min(h, int(np.percentile(y_indices, 99)))
            else:
                # Fallback to center 80% if background diff is ambiguous
                x_min, x_max = int(w * 0.1), int(w * 0.9)
                y_min, y_max = int(h * 0.1), int(h * 0.9)
                
            box_w = max(1, x_max - x_min)
            box_h = max(1, y_max - y_min)
            x_center = (x_min + box_w / 2.0) / w
            y_center = (y_min + box_h / 2.0) / h
            norm_w = box_w / w
            norm_h = box_h / h
            return max(0.01, min(0.99, x_center)), max(0.01, min(0.99, y_center)), max(0.05, min(0.99, norm_w)), max(0.05, min(0.99, norm_h))
    except Exception:
        return 0.5, 0.5, 0.8, 0.8

def prepare_quality_dataset(config):
    """
    Prepares train/val/test splits for CNN quality model.
    Classes: 'fresh' and 'rotten'
    """
    print("\n[Step 1/2] Preparing Quality CNN dataset...")
    fruit_dir = config["paths"]["fruit_dataset"]
    processed_dir = os.path.join(config["paths"]["processed_dir"], "quality")
    
    splits = ['train', 'val', 'test']
    for sp in splits:
        for q in ['fresh', 'rotten']:
            os.makedirs(os.path.join(processed_dir, sp, q), exist_ok=True)
            
    # Collect items
    samples = {'fresh': [], 'rotten': []}
    for item in os.listdir(fruit_dir):
        item_path = os.path.join(fruit_dir, item)
        if not os.path.isdir(item_path):
            continue
        for q in ['fresh', 'rotten']:
            q_path = os.path.join(item_path, q)
            if os.path.isdir(q_path):
                imgs = [os.path.join(q_path, f) for f in os.listdir(q_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                samples[q].extend(imgs)
                
    counts = {}
    for q in ['fresh', 'rotten']:
        random.shuffle(samples[q])
        total = len(samples[q])
        # Limit per class to 3,500 balanced representative images for fast, high-quality training
        sample_subset = samples[q][:3500]
        n_total = len(sample_subset)
        n_train = int(n_total * 0.75)
        n_val = int(n_total * 0.15)
        
        split_dict = {
            'train': sample_subset[:n_train],
            'val': sample_subset[n_train:n_train + n_val],
            'test': sample_subset[n_train + n_val:]
        }
        counts[q] = {k: len(v) for k, v in split_dict.items()}
        
        for sp, img_list in split_dict.items():
            target_folder = os.path.join(processed_dir, sp, q)
            for i, src in enumerate(img_list):
                ext = os.path.splitext(src)[1]
                dst = os.path.join(target_folder, f"{q}_{i:05d}{ext}")
                if not os.path.exists(dst):
                    try:
                        os.symlink(src, dst)
                    except OSError:
                        shutil.copy2(src, dst)
                        
    print(f"Quality dataset prepared at: {processed_dir}")
    for q in ['fresh', 'rotten']:
        print(f"  {q.upper()}: train={counts[q]['train']}, val={counts[q]['val']}, test={counts[q]['test']}")

def prepare_yolo_detection_dataset(config):
    """
    Prepares YOLOv8 detection dataset with train/val/test splits and data.yaml
    """
    print("\n[Step 2/2] Preparing YOLOv8 detection dataset...")
    fruit_dir = config["paths"]["fruit_dataset"]
    veg_dir = config["paths"]["vegetable_dataset"]
    yolo_dir = os.path.join(config["paths"]["processed_dir"], "detection")
    
    for sp in ['train', 'val', 'test']:
        os.makedirs(os.path.join(yolo_dir, sp, "images"), exist_ok=True)
        os.makedirs(os.path.join(yolo_dir, sp, "labels"), exist_ok=True)
        
    class_samples = defaultdict(list)
    
    # 1. Collect from Fruit Dataset
    if os.path.exists(fruit_dir):
        for item in os.listdir(fruit_dir):
            cname = item.lower()
            if cname in CLASS_TO_ID:
                item_path = os.path.join(fruit_dir, item)
                for q in ['fresh', 'rotten']:
                    qp = os.path.join(item_path, q)
                    if os.path.isdir(qp):
                        imgs = [os.path.join(qp, f) for f in os.listdir(qp) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                        class_samples[cname].extend(imgs)
                        
    # 2. Collect from Vegetable Dataset
    if os.path.exists(veg_dir):
        for sp in ['train', 'validation', 'test']:
            sp_dir = os.path.join(veg_dir, sp)
            if os.path.exists(sp_dir):
                for cls_name in os.listdir(sp_dir):
                    cname = cls_name.lower()
                    # Normalize class name (e.g. Capsicum → bellpepper)
                    cname = CLASS_NAME_MAP.get(cname, cname)
                    if cname in CLASS_TO_ID:
                        cdir = os.path.join(sp_dir, cls_name)
                        imgs = [os.path.join(cdir, f) for f in os.listdir(cdir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                        class_samples[cname].extend(imgs)
                        
    # Build balanced YOLO splits (200 images per class for balanced training)
    yolo_counts = {'train': 0, 'val': 0, 'test': 0}
    
    for cname, imgs in class_samples.items():
        random.shuffle(imgs)
        cls_id = CLASS_TO_ID[cname]
        selected = imgs[:200]
        n_sel = len(selected)
        n_train = int(n_sel * 0.75)
        n_val = int(n_sel * 0.15)
        
        split_map = {
            'train': selected[:n_train],
            'val': selected[n_train:n_train + n_val],
            'test': selected[n_train + n_val:]
        }
        
        for sp, img_list in split_map.items():
            img_dest_dir = os.path.join(yolo_dir, sp, "images")
            lbl_dest_dir = os.path.join(yolo_dir, sp, "labels")
            
            for idx, img_src in enumerate(img_list):
                base_name = f"{cname}_{sp}_{idx:04d}"
                dst_img = os.path.join(img_dest_dir, f"{base_name}.jpg")
                dst_lbl = os.path.join(lbl_dest_dir, f"{base_name}.txt")
                
                # Copy or convert image
                if not os.path.exists(dst_img):
                    try:
                        with Image.open(img_src) as im:
                            im.convert("RGB").save(dst_img, "JPEG", quality=90)
                    except Exception:
                        continue
                        
                # Bounding box
                xc, yc, nw, nh = find_bounding_box(img_src)
                with open(dst_lbl, "w") as lf:
                    lf.write(f"{cls_id} {xc:.6f} {yc:.6f} {nw:.6f} {nh:.6f}\n")
                yolo_counts[sp] += 1

    # 3. Create Multi-Object Synthetic Composition Images for Multi-Produce Detection
    print("Synthesizing multi-object detection images for scene detection...")
    train_img_dir = os.path.join(yolo_dir, "train", "images")
    train_lbl_dir = os.path.join(yolo_dir, "train", "labels")
    
    available_classes = list(class_samples.keys())
    for syn_idx in range(150):
        # Canvas 640x640 with soft natural background
        bg_colors = [(240, 240, 240), (245, 242, 235), (230, 235, 230), (250, 250, 250)]
        canvas = Image.new("RGB", (640, 640), random.choice(bg_colors))
        
        # Pick 2-4 distinct items
        n_items = random.randint(2, 4)
        picked_classes = random.sample(available_classes, min(n_items, len(available_classes)))
        
        bboxes = []
        quadrants = [
            (30, 30, 290, 290),
            (330, 30, 590, 290),
            (30, 330, 290, 590),
            (330, 330, 590, 590)
        ]
        random.shuffle(quadrants)
        
        for q_idx, p_cls in enumerate(picked_classes):
            cls_id = CLASS_TO_ID[p_cls]
            src_img_path = random.choice(class_samples[p_cls])
            try:
                with Image.open(src_img_path) as p_im:
                    p_im = p_im.convert("RGB")
                    qx1, qy1, qx2, qy2 = quadrants[q_idx]
                    qw, qh = qx2 - qx1, qy2 - qy1
                    p_im_resized = p_im.resize((qw, qh), Image.Resampling.BILINEAR)
                    canvas.paste(p_im_resized, (qx1, qy1))
                    
                    # Normalize bbox
                    xc = (qx1 + qw / 2.0) / 640.0
                    yc = (qy1 + qh / 2.0) / 640.0
                    nw = qw / 640.0
                    nh = qh / 640.0
                    bboxes.append((cls_id, xc, yc, nw, nh))
            except Exception:
                continue
                
        syn_name = f"multi_synth_{syn_idx:04d}"
        canvas.save(os.path.join(train_img_dir, f"{syn_name}.jpg"), "JPEG", quality=90)
        with open(os.path.join(train_lbl_dir, f"{syn_name}.txt"), "w") as lf:
            for b in bboxes:
                lf.write(f"{b[0]} {b[1]:.6f} {b[2]:.6f} {b[3]:.6f} {b[4]:.6f}\n")
        yolo_counts['train'] += 1

    # Generate data.yaml
    data_yaml_path = os.path.join(yolo_dir, "data.yaml")
    yaml_data = {
        "path": yolo_dir,
        "train": "train/images",
        "val": "val/images",
        "test": "test/images",
        "nc": len(ALL_CLASSES),
        "names": {i: name.replace("_", " ").title() for i, name in enumerate(ALL_CLASSES)}
    }
    with open(data_yaml_path, "w") as f:
        yaml.dump(yaml_data, f, sort_keys=False)
        
    print(f"YOLOv8 dataset prepared at: {yolo_dir}")
    print(f"YAML config created at: {data_yaml_path}")
    print(f"Total YOLO images: train={yolo_counts['train']}, val={yolo_counts['val']}, test={yolo_counts['test']}")

def main():
    config = load_config()
    prepare_quality_dataset(config)
    prepare_yolo_detection_dataset(config)
    print("\nDataset preprocessing complete!")

if __name__ == "__main__":
    main()
