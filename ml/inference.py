#!/usr/bin/env python3
"""
Two-Stage Inference Pipeline
Stage 1: YOLOv8 object detection → bounding boxes + class labels
Stage 2: CNN quality grading → quality score (0-100) + grade (A/B/C/D)

Usage:
  python ml/inference.py --image path/to/image.jpg
  python ml/inference.py --image path/to/image.jpg --output result.jpg --json result.json
  python ml/inference.py --dir path/to/images/
"""

import os
import sys
import json
import yaml
import argparse
import time
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import cv2

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from train_quality import QualityGradingModel


def load_config(config_path="ml/config.yaml"):
    if not os.path.exists(config_path):
        for candidate in ["config.yaml", "/app/ml/config.yaml", os.path.join(os.path.dirname(__file__), "config.yaml")]:
            if os.path.exists(candidate):
                config_path = candidate
                break
    with open(config_path, "r") as f:
        return yaml.safe_load(f)



def score_to_grade(score, grading_config):
    """Map quality score (0-100) strictly to letter grade A, B, or C."""
    for grade in ["A", "B", "C"]:
        params = grading_config.get("grades", {}).get(grade, {})
        if score >= params.get("min_score", 0):
            return grade, params.get("description", f"Grade {grade}")
    return "C", grading_config.get("grades", {}).get("C", {}).get("description", "Grade C")


GRADE_COLORS = {
    "A": (76, 175, 80),     # Green
    "B": (139, 195, 74),    # Light Green
    "C": (255, 152, 0),     # Orange / Amber
}


VALID_PRODUCE_MAP = {
    "apple": "Apple",
    "banana": "Banana",
    "bell pepper": "Bellpepper",
    "bellpepper": "Bellpepper",
    "capsicum": "Bellpepper",
    "carrot": "Carrot",
    "cucumber": "Cucumber",
    "grape": "Grape",
    "grapes": "Grape",
    "guava": "Guava",
    "jujube": "Jujube",
    "mango": "Mango",
    "orange": "Orange",
    "pomegranate": "Pomegranate",
    "potato": "Potato",
    "strawberry": "Strawberry",
    "tomato": "Tomato",
    "bean": "Bean",
    "beans": "Bean",
    "bitter gourd": "Bitter Gourd",
    "bitter_gourd": "Bitter Gourd",
    "bottle gourd": "Bottle Gourd",
    "bottle_gourd": "Bottle Gourd",
    "brinjal": "Brinjal",
    "eggplant": "Brinjal",
    "aubergine": "Brinjal",
    "broccoli": "Broccoli",
    "cabbage": "Cabbage",
    "cauliflower": "Cauliflower",
    "papaya": "Papaya",
    "pumpkin": "Pumpkin",
    "radish": "Radish",
    "onion": "Onion",
    "shallot": "Onion",
    "chilli": "Chilli",
    "chili": "Chilli",
    "pepper": "Bellpepper",
    "ladies finger": "Bhindi",
    "okra": "Bhindi",
    "bhindi": "Bhindi",
}

NON_PRODUCE_DISALLOWED = {
    "person", "man", "woman", "human", "face", "chair", "sofa",
    "couch", "bed", "dining table", "tv", "laptop", "mouse",
    "keyboard", "cell phone", "bottle", "cup", "book", "clock"
}


def normalize_commodity_name(name):
    """
    Normalize raw detector class names to canonical agricultural commodities.
    STRICT: Returns None for any non-produce object (e.g. person, chair, laptop).
    """
    clean = str(name).lower().replace("_", " ").strip()
    
    # Explicitly reject non-produce objects
    for dis in NON_PRODUCE_DISALLOWED:
        if dis in clean:
            return None
            
    for k, v in VALID_PRODUCE_MAP.items():
        if k in clean:
            return v
    return None



class InferencePipeline:
    """End-to-end two-stage inference pipeline."""
    
    def __init__(self, config_path="ml/config.yaml"):
        self.config = load_config(config_path)
        self.device = torch.device(
            self.config["hardware"]["device"] if torch.cuda.is_available() else "cpu"
        )
        self.detection_model = None
        self.coco_model = None
        self.face_detector = None
        self.quality_model = None
        self.quality_transform = None
        self.class_names = None
        self.grading_config = self.config["grading"]
        
        self._load_models()
    
    def _load_models(self):
        """Load produce detection, human/context detection, and quality models."""
        print(f"Loading models on {self.device}...")
        
        # Stage 1: Custom YOLOv8 Produce Detection
        from ultralytics import YOLO
        det_path = os.path.join(self.config["paths"].get("detection_model_dir", ""), "best.pt")
        if not os.path.exists(det_path):
            for cand in ["models/detection/best.pt", "/app/models/detection/best.pt", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models", "detection", "best.pt")]:
                if os.path.exists(cand):
                    det_path = cand
                    break
        if os.path.exists(det_path):
            self.detection_model = YOLO(det_path)
            print(f"  ✓ Custom Produce Detection model loaded: {det_path}")
        else:
            base_model = self.config["detection"].get("base_model", "yolov8n.pt")
            self.detection_model = YOLO(base_model)
            print(f"  ✓ Detection base model loaded: {base_model}")

        # Human & Non-Produce Context Detector (COCO Pretrained YOLOv8)
        coco_path = "yolov8n.pt"
        if not os.path.exists(coco_path):
            for cand in ["/app/yolov8n.pt", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "yolov8n.pt")]:
                if os.path.exists(cand):
                    coco_path = cand
                    break
        if os.path.exists(coco_path):
            self.coco_model = YOLO(coco_path)
            print(f"  ✓ Human & Context Detector loaded: {coco_path}")
        else:
            self.coco_model = None

        # Neural Face Detector (OpenCV YuNet)
        face_model_path = os.path.join(self.config["paths"].get("detection_model_dir", ""), "face_detection_yunet.onnx")
        if not os.path.exists(face_model_path):
            for cand in ["models/detection/face_detection_yunet.onnx", "/app/models/detection/face_detection_yunet.onnx", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models", "detection", "face_detection_yunet.onnx")]:
                if os.path.exists(cand):
                    face_model_path = cand
                    break
        if os.path.exists(face_model_path):
            try:
                self.face_detector = cv2.FaceDetectorYN_create(face_model_path, "", (320, 320))
                print(f"  ✓ Neural Face Detector loaded: {face_model_path}")
            except Exception as e:
                print(f"  ⚠ Could not load YuNet: {e}")
                self.face_detector = None
        else:
            self.face_detector = None
        
        # Stage 2: CNN Quality Grading
        qual_path = os.path.join(self.config["paths"].get("quality_model_dir", ""), "best.pth")
        if not os.path.exists(qual_path):
            for cand in ["models/quality/best.pth", "/app/models/quality/best.pth", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models", "quality", "best.pth")]:
                if os.path.exists(cand):
                    qual_path = cand
                    break
        if not os.path.exists(qual_path):
            raise FileNotFoundError(f"Quality model not found: {qual_path}")
        
        checkpoint = torch.load(qual_path, map_location=self.device, weights_only=False)
        self.class_names = checkpoint["class_names"]
        imgsz = checkpoint["imgsz"]
        
        self.quality_model = QualityGradingModel(
            architecture=checkpoint["architecture"],
            num_classes=checkpoint["num_classes"]
        ).to(self.device)
        self.quality_model.load_state_dict(checkpoint["model_state_dict"])
        self.quality_model.eval()
        
        self.quality_transform = transforms.Compose([
            transforms.Resize((imgsz, imgsz)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        
        print(f"  ✓ Quality model loaded: {qual_path}")
        print(f"  ✓ Quality classes: {self.class_names}")
        print(f"Models ready!\n")

    def _detect_humans_and_clutter(self, img_pil):
        """
        Detect humans, faces, and indoor non-produce clutter to prevent hallucinations.
        """
        w, h = img_pil.size
        person_boxes = []
        face_boxes = []
        clutter_items = []

        # 1. COCO detection
        if self.coco_model is not None:
            try:
                res = self.coco_model.predict(img_pil, conf=0.25, verbose=False)
                if res and len(res) > 0 and res[0].boxes is not None:
                    for b in res[0].boxes:
                        cls_id = int(b.cls[0].cpu())
                        conf = float(b.conf[0].cpu())
                        name = res[0].names.get(cls_id, "")
                        coords = b.xyxy[0].cpu().numpy().tolist()
                        if name == "person" and conf >= 0.25:
                            person_boxes.append(coords)
                        elif name in ["cell phone", "laptop", "tv", "remote", "keyboard", "mouse", "chair", "bed", "couch", "scissors", "bottle", "book", "cup"]:
                            clutter_items.append(name)
            except Exception as e:
                print(f"Context detection note: {e}")

        # 2. YuNet face detection
        if self.face_detector is not None:
            try:
                img_cv = cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)
                ih, iw = img_cv.shape[:2]
                self.face_detector.setInputSize((iw, ih))
                _, faces = self.face_detector.detect(img_cv)
                if faces is not None:
                    for f in faces:
                        if float(f[-1]) >= 0.40:
                            fx, fy, fw, fh = f[:4].astype(int)
                            face_boxes.append([max(0, fx), max(0, fy), min(iw, fx + fw), min(ih, fy + fh)])
            except Exception as e:
                print(f"Face detector note: {e}")

        has_human = len(person_boxes) > 0 or len(face_boxes) > 0
        return {
            "has_human": has_human,
            "person_boxes": person_boxes,
            "face_boxes": face_boxes,
            "clutter_items": clutter_items,
        }

    def _is_overlapping_human(self, pbox, person_boxes, face_boxes, img_w=None, img_h=None):
        """
        Check if a produce candidate box overlaps with a human body or face (hallucination).
        """
        def box_overlap(boxA, boxB):
            xA = max(boxA[0], boxB[0])
            yA = max(boxA[1], boxB[1])
            xB = min(boxA[2], boxB[2])
            yB = min(boxA[3], boxB[3])
            inter = max(0, xB - xA) * max(0, yB - yA)
            areaA = max((boxA[2] - boxA[0]) * (boxA[3] - boxA[1]), 1e-6)
            return inter / areaA

        # Face overlap: > 15% overlap means false positive on human face
        for fbox in face_boxes:
            if box_overlap(pbox, fbox) > 0.15:
                return True

        # Person body overlap: > 25% overlap inside person
        for pbox_human in person_boxes:
            if box_overlap(pbox, pbox_human) > 0.25:
                return True

        # Full-frame hallucination (> 75% image) while human is in frame
        if img_w and img_h:
            area_img = img_w * img_h
            area_box = (pbox[2] - pbox[0]) * (pbox[3] - pbox[1])
            if (area_box / area_img) > 0.75 and (person_boxes or face_boxes):
                return True

        return False

    
    def predict(self, image_path, conf_threshold=None, annotate=True):
        """
        Run full two-stage inference on a single image.
        
        Returns:
            dict: {
                "success": bool,
                "image_path": str,
                "objects": [...],
                "inference_time_ms": float,
                "annotated_image": PIL.Image or None
            }
        """
        if conf_threshold is None:
            conf_threshold = self.config["detection"]["confidence_threshold"]
        
        start_time = time.time()
        
        # Load image
        try:
            original_img = Image.open(image_path).convert("RGB")
        except Exception as e:
            return {"success": False, "error": f"Failed to load image: {e}", "objects": []}
        
        img_w, img_h = original_img.size
        
        # Detect human / face context to eliminate false positive produce hallucinations
        human_ctx = self._detect_humans_and_clutter(original_img)
        
        # Stage 1: YOLO Detection
        det_results = self.detection_model.predict(
            source=image_path,
            device=self.device,
            conf=conf_threshold,
            iou=self.config["detection"]["iou_threshold"],
            verbose=False,
        )
        
        objects = []
        annotated_img = original_img.copy() if annotate else None
        draw = ImageDraw.Draw(annotated_img) if annotate else None
        
        # Try to load a font
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
            font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
        except Exception:
            font = ImageFont.load_default()
            font_small = font
        
        if det_results and len(det_results) > 0:
            result = det_results[0]
            
            if result.boxes is not None and len(result.boxes) > 0:
                boxes = result.boxes
                
                for i in range(len(boxes)):
                    # Bounding box coordinates
                    x1, y1, x2, y2 = boxes.xyxy[i].cpu().numpy().astype(int)
                    det_conf = float(boxes.conf[i].cpu())
                    cls_id = int(boxes.cls[i].cpu())
                    cls_name = result.names.get(cls_id, f"class_{cls_id}")
                    comm_name = normalize_commodity_name(cls_name)
                    if comm_name is None:
                        continue

                    # Suppress false positives overlapping human or face
                    if self._is_overlapping_human([x1, y1, x2, y2], human_ctx["person_boxes"], human_ctx["face_boxes"], img_w, img_h):
                        continue
                    
                    # Crop the detected region
                    crop = original_img.crop((
                        max(0, x1), max(0, y1),
                        min(img_w, x2), min(img_h, y2)
                    ))
                    
                    # Stage 2: Quality Grading
                    quality_score, quality_conf, quality_class = self._grade_crop(crop)
                    grade, grade_desc = score_to_grade(quality_score, self.grading_config)
                    
                    obj = {
                        "name": comm_name,
                        "confidence": round(det_conf, 4),
                        "grade": grade,
                        "grade_description": grade_desc,
                        "quality_score": round(quality_score, 1),
                        "quality_confidence": round(quality_conf, 4),
                        "quality_class": quality_class,
                        "bbox": {
                            "x1": int(x1), "y1": int(y1),
                            "x2": int(x2), "y2": int(y2)
                        }
                    }
                    objects.append(obj)
                    
                    # Annotate image
                    if annotate and draw:
                        color = GRADE_COLORS.get(grade, (128, 128, 128))
                        # Draw bounding box
                        draw.rectangle([x1, y1, x2, y2], outline=color, width=3)
                        
                        # Label background
                        label = f"{obj['name']} | Grade {grade} | {quality_score:.0f}/100"
                        bbox_text = draw.textbbox((0, 0), label, font=font)
                        text_w = bbox_text[2] - bbox_text[0]
                        text_h = bbox_text[3] - bbox_text[1]
                        
                        # Draw label background
                        label_y = max(0, y1 - text_h - 8)
                        draw.rectangle(
                            [x1, label_y, x1 + text_w + 10, label_y + text_h + 6],
                            fill=color
                        )
                        draw.text(
                            (x1 + 5, label_y + 2), label,
                            fill=(255, 255, 255), font=font
                        )
                        
                        # Confidence sub-label
                        conf_label = f"Det: {det_conf:.0%} | Qual: {quality_conf:.0%}"
                        draw.text(
                            (x1 + 5, y2 + 3), conf_label,
                            fill=color, font=font_small
                        )
        
        inference_time = (time.time() - start_time) * 1000
        
        result = {
            "success": True,
            "image_path": str(image_path),
            "image_size": {"width": img_w, "height": img_h},
            "objects": objects,
            "num_objects": len(objects),
            "inference_time_ms": round(inference_time, 1),
            "has_human": human_ctx["has_human"],
        }
        
        if len(objects) == 0 and human_ctx["has_human"]:
            result["warning"] = "Human detected! Please place only fresh fruits or vegetables in front of the camera."
        
        if annotate:
            result["annotated_image"] = annotated_img
        
        return result
    
    def _grade_crop(self, crop_img):
        """
        Run quality grading on a cropped image.
        Returns (quality_score, confidence, class_name).
        """
        input_tensor = self.quality_transform(crop_img).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            class_logits, quality_score = self.quality_model(input_tensor)
        
        probs = torch.softmax(class_logits, dim=1)
        confidence, predicted_class = torch.max(probs, dim=1)
        
        quality_score_val = float(quality_score.cpu().item())
        confidence_val = float(confidence.cpu().item())
        class_name = self.class_names[predicted_class.item()]
        
        # Calibrate score based on classification
        if class_name.lower() == "fresh" and quality_score_val < 50:
            quality_score_val = max(quality_score_val, 50 + confidence_val * 40)
        elif class_name.lower() == "rotten" and quality_score_val > 50:
            quality_score_val = min(quality_score_val, 50 - confidence_val * 30)
        
        quality_score_val = max(0, min(100, quality_score_val))
        
        return quality_score_val, confidence_val, class_name
    
    def predict_batch(self, image_paths, conf_threshold=None):
        """Run inference on multiple images."""
        results = []
        for path in image_paths:
            result = self.predict(path, conf_threshold)
            results.append(result)
        return results

    def predict_four_views(self, image_paths, conf_threshold=None):
        """
        Multi-view inference pipeline for exactly 4 photos of a product:
        1. Validates exactly 4 images are provided.
        2. Runs YOLOv8 object detection on each view.
        3. Enforces consistency: ensures all 4 photos are of the same product.
           Raises ValueError("Please capture 4 photos of the same product.") if conflicting.
        4. Crops foreground produce from each image.
        5. Grades visual quality of each crop using CNN (score 0-100, class 'fresh'/'rotten').
        6. Applies conservative 4-view feature fusion (prioritizes worst-side defects).
        7. Returns final product identification, quality score, grade, and per-view diagnostics.
        """
        if len(image_paths) != 4:
            raise ValueError(f"Expected exactly 4 images, got {len(image_paths)}.")

        per_view = []
        detected_products = []
        human_detected_views = []
        clutter_detected_views = []

        if conf_threshold is None:
            conf_threshold = self.config["detection"]["confidence_threshold"]

        VIEW_NAMES = [
            "Photo 1 (Front View)",
            "Photo 2 (Side View)",
            "Photo 3 (Opposite View)",
            "Photo 4 (Close-up View)",
        ]

        for idx, img_path in enumerate(image_paths):
            view_label = VIEW_NAMES[idx]
            try:
                img = Image.open(img_path).convert("RGB")
            except Exception as e:
                raise ValueError(f"Could not open image {idx + 1}: {e}")

            w, h = img.size

            # Check human & non-produce context
            human_ctx = self._detect_humans_and_clutter(img)
            if human_ctx["has_human"]:
                human_detected_views.append(idx + 1)
            if human_ctx["clutter_items"]:
                clutter_detected_views.extend(human_ctx["clutter_items"])

            # Run detection
            det_results = self.detection_model.predict(
                source=img_path,
                device=self.device,
                conf=conf_threshold,
                iou=self.config["detection"]["iou_threshold"],
                verbose=False,
            )

            detected_name = None
            detected_conf = 0.0
            crop_img = None
            bbox_coords = None

            valid_boxes = []
            if det_results and len(det_results) > 0 and det_results[0].boxes is not None and len(det_results[0].boxes) > 0:
                boxes = det_results[0].boxes
                for b_idx in range(len(boxes)):
                    cls_id = int(boxes.cls[b_idx].cpu())
                    raw_name = det_results[0].names.get(cls_id, f"item_{cls_id}")
                    comm_name = normalize_commodity_name(raw_name)
                    if comm_name is not None:
                        conf = float(boxes.conf[b_idx].cpu())
                        x1, y1, x2, y2 = boxes.xyxy[b_idx].cpu().numpy().astype(int)
                        # Suppress false positives overlapping human or face
                        if self._is_overlapping_human([x1, y1, x2, y2], human_ctx["person_boxes"], human_ctx["face_boxes"], w, h):
                            continue
                        valid_boxes.append((conf, b_idx, comm_name))

            if valid_boxes:
                # Select highest confidence fruit or vegetable detection
                valid_boxes.sort(key=lambda x: x[0], reverse=True)
                best_conf, best_box_idx, detected_name = valid_boxes[0]
                x1, y1, x2, y2 = boxes.xyxy[best_box_idx].cpu().numpy().astype(int)
                detected_conf = best_conf
                bbox_coords = [int(x1), int(y1), int(x2), int(y2)]

                crop_img = img.crop((
                    max(0, x1), max(0, y1),
                    min(w, x2), min(h, y2)
                ))
                # Stage 2: Quality grading on cropped produce
                q_score, q_conf, q_class = self._grade_crop(crop_img)
            else:
                detected_name = None
                detected_conf = 0.0
                bbox_coords = None
                crop_img = None
                q_score = 0.0
                q_conf = 0.0
                q_class = "unknown"

            view_data = {
                "view_index": idx + 1,
                "view_name": view_label,
                "product_detected": detected_name or "Not a Fruit/Vegetable",
                "detection_confidence": round(detected_conf, 4),
                "quality_score": round(q_score, 1),
                "quality_confidence": round(q_conf, 4),
                "quality_class": q_class,
                "bbox": bbox_coords,
                "has_human": human_ctx["has_human"],
            }
            per_view.append(view_data)
            if detected_name is not None:
                detected_products.append(detected_name)

        # Strict validation: MUST be fruits or vegetables alone
        if len(detected_products) == 0:
            if human_detected_views:
                raise ValueError("Human detected! Please place only fresh fruits or vegetables in front of the camera.")
            elif clutter_detected_views:
                item_name = clutter_detected_views[0]
                raise ValueError(f"Non-produce item ({item_name}) detected. Please point the camera directly at your fresh produce.")
            else:
                raise ValueError("No fruit or vegetable detected. Please point the camera directly at your produce.")

        # Consistency verification: ensure views agree on primary product
        from collections import Counter
        counts = Counter(detected_products)
        primary_product, most_count = counts.most_common(1)[0]
        distinct_products = set(detected_products)

        # Multiple conflicting products detected with high frequency (e.g. 2 Tomatoes and 2 Apples)
        conflicts = [p for p in distinct_products if counts[p] >= 2 and p != primary_product]
        if conflicts or (len(distinct_products) > 2 and len(detected_products) >= 3):
            raise ValueError("Please capture 4 photos of the same product.")

        if most_count < 2 or len(detected_products) < 2:
            if human_detected_views:
                raise ValueError("Human detected in photo! Please point the camera only at your fresh produce.")
            raise ValueError("Product could not be identified clearly. Please retake the photos.")

        consistency_ratio = round(most_count / 4.0, 2)

        # Reconcile views that missed detection using the primary product consensus
        valid_scores = [v["quality_score"] for v in per_view if v["quality_score"] > 0]
        valid_qual_confs = [v["quality_confidence"] for v in per_view if v["quality_confidence"] > 0]
        valid_det_confs = [v["detection_confidence"] for v in per_view if v["detection_confidence"] > 0]

        if not valid_scores:
            valid_scores = [50.0]
        if not valid_qual_confs:
            valid_qual_confs = [0.85]
        if not valid_det_confs:
            valid_det_confs = [0.85]

        avg_valid_score = round(float(np.mean(valid_scores)), 1)
        avg_valid_qual_conf = round(float(np.mean(valid_qual_confs)), 4)
        avg_valid_det_conf = round(float(np.mean(valid_det_confs)), 4)

        for v in per_view:
            if v["bbox"] is None or v["quality_score"] == 0:
                v["product_detected"] = primary_product
                v["quality_score"] = avg_valid_score
                v["quality_confidence"] = avg_valid_qual_conf
                v["detection_confidence"] = avg_valid_det_conf
                v["quality_class"] = "fresh" if avg_valid_score >= 50 else "rotten"

        scores = [v["quality_score"] for v in per_view]
        det_confs = [v["detection_confidence"] for v in per_view]
        qual_confs = [v["quality_confidence"] for v in per_view]
        rotten_count = sum(1 for v in per_view if v["quality_class"].lower() == "rotten" or v["quality_score"] < 50)

        avg_det_conf = round(float(np.mean(det_confs)), 4)
        avg_qual_conf = round(float(np.mean(qual_confs)), 4)


        fusion_cfg = self.config.get("fusion", {})
        min_det_conf = fusion_cfg.get("min_detection_confidence", 0.35)
        min_qual_conf = fusion_cfg.get("min_quality_confidence", 0.40)

        # Low confidence guardrails (Requirement 22)
        if avg_det_conf < min_det_conf:
            raise ValueError("Product could not be identified clearly. Please retake the photos.")

        if avg_qual_conf < min_qual_conf:
            raise ValueError("Quality could not be assessed confidently. Please capture clearer photos.")

        min_s = float(np.min(scores))
        mean_s = float(np.mean(scores))
        conf_s = avg_qual_conf * 100.0
        consist_s = consistency_ratio * 100.0

        weights = fusion_cfg.get("weights", {
            "mean_score": 0.40,
            "minimum_score": 0.35,
            "confidence_score": 0.15,
            "consistency_score": 0.10,
        })
        w_mean = weights.get("mean_score", 0.40)
        w_min = weights.get("minimum_score", 0.35)
        w_conf = weights.get("confidence_score", 0.15)
        w_consist = weights.get("consistency_score", 0.10)

        # Conservative 4-View Feature Fusion:
        # S_fused = (0.40 * mean_score) + (0.35 * minimum_score) + (0.15 * confidence_score) + (0.10 * consistency_score) - rot_penalty
        fused_raw = (
            (w_mean * mean_s)
            + (w_min * min_s)
            + (w_conf * conf_s)
            + (w_consist * consist_s)
        )
        rot_penalty = rotten_count * fusion_cfg.get("damage_penalty_per_rotten_view", 5.0)
        final_score = max(0.0, min(100.0, fused_raw - rot_penalty))
        final_score = round(final_score, 1)

        grade, grade_desc = score_to_grade(final_score, self.grading_config)

        formula_desc = (
            f"({w_mean:.2f} × mean_score) + ({w_min:.2f} × minimum_score) + "
            f"({w_conf:.2f} × confidence_score) + ({w_consist:.2f} × consistency_score)"
        )
        if rotten_count > 0:
            formula_desc += f" - ({rot_penalty:.1f} visible damage penalty)"

        return {
            "success": True,
            "product": {
                "name": primary_product,
                "commodity_key": primary_product.lower().replace(" ", "_"),
                "confidence": avg_det_conf,
                "consistency": consistency_ratio,
            },
            "quality": {
                "grade": grade,
                "grade_description": grade_desc,
                "score": final_score,
                "confidence": avg_qual_conf,
                "fusion_method": "conservative_multi_view",
                "formula": formula_desc,
                "stats": {
                    "min_score": round(min_s, 1),
                    "mean_score": round(mean_s, 1),
                    "confidence_score": round(conf_s, 1),
                    "consistency_score": round(consist_s, 1),
                    "rotten_sides": rotten_count,
                },
                "per_view": per_view,
            }
        }



def main():
    parser = argparse.ArgumentParser(description="Two-Stage Fruit & Vegetable Detection + Quality Grading")
    parser.add_argument("--image", type=str, help="Path to input image")
    parser.add_argument("--dir", type=str, help="Path to directory of images")
    parser.add_argument("--output", type=str, help="Path to save annotated output image")
    parser.add_argument("--json", type=str, help="Path to save JSON results")
    parser.add_argument("--conf", type=float, default=None, help="Detection confidence threshold")
    parser.add_argument("--no-annotate", action="store_true", help="Skip image annotation")
    args = parser.parse_args()
    
    if not args.image and not args.dir:
        parser.print_help()
        print("\nERROR: Specify --image or --dir")
        sys.exit(1)
    
    # Initialize pipeline
    pipeline = InferencePipeline()
    
    if args.image:
        # Single image inference
        print(f"\nProcessing: {args.image}")
        result = pipeline.predict(args.image, conf_threshold=args.conf, annotate=not args.no_annotate)
        
        if result["success"]:
            print(f"\n{'='*60}")
            print(f"INFERENCE RESULTS")
            print(f"{'='*60}")
            print(f"  Image: {result['image_path']}")
            print(f"  Size: {result['image_size']['width']}x{result['image_size']['height']}")
            print(f"  Objects detected: {result['num_objects']}")
            print(f"  Inference time: {result['inference_time_ms']:.1f} ms")
            
            for i, obj in enumerate(result["objects"]):
                print(f"\n  [{i+1}] {obj['name']}")
                print(f"      Detection confidence: {obj['confidence']:.2%}")
                print(f"      Quality: {obj['quality_class']} → Score: {obj['quality_score']:.0f}/100")
                print(f"      Grade: {obj['grade']} ({obj['grade_description']})")
                print(f"      BBox: ({obj['bbox']['x1']}, {obj['bbox']['y1']}) → ({obj['bbox']['x2']}, {obj['bbox']['y2']})")
            
            # Save annotated image
            if not args.no_annotate and "annotated_image" in result:
                output_path = args.output or args.image.rsplit(".", 1)[0] + "_result.jpg"
                result["annotated_image"].save(output_path, "JPEG", quality=95)
                print(f"\n  ✓ Annotated image saved: {output_path}")
            
            # Save JSON
            if args.json:
                json_result = {k: v for k, v in result.items() if k != "annotated_image"}
                with open(args.json, "w") as f:
                    json.dump(json_result, f, indent=2)
                print(f"  ✓ JSON results saved: {args.json}")
        else:
            print(f"ERROR: {result.get('error', 'Unknown error')}")
    
    elif args.dir:
        # Directory batch inference
        img_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
        image_paths = [
            os.path.join(args.dir, f) for f in sorted(os.listdir(args.dir))
            if os.path.splitext(f)[1].lower() in img_extensions
        ]
        
        if not image_paths:
            print(f"No images found in {args.dir}")
            sys.exit(1)
        
        print(f"\nProcessing {len(image_paths)} images from {args.dir}...")
        
        all_results = []
        for img_path in image_paths:
            result = pipeline.predict(img_path, conf_threshold=args.conf, annotate=not args.no_annotate)
            all_results.append(result)
            
            status = "✓" if result["success"] else "✗"
            n_obj = result.get("num_objects", 0)
            t_ms = result.get("inference_time_ms", 0)
            print(f"  {status} {os.path.basename(img_path)}: {n_obj} objects ({t_ms:.0f}ms)")
        
        # Save batch JSON
        json_path = args.json or os.path.join(args.dir, "batch_results.json")
        json_results = [{k: v for k, v in r.items() if k != "annotated_image"} for r in all_results]
        with open(json_path, "w") as f:
            json.dump(json_results, f, indent=2)
        print(f"\n✓ Batch results saved: {json_path}")


if __name__ == "__main__":
    main()
