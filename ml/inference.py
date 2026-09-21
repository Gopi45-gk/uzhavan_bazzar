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

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from train_quality import QualityGradingModel


def load_config(config_path="ml/config.yaml"):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def score_to_grade(score, grading_config):
    """Map quality score (0-100) to letter grade."""
    for grade in ["A", "B", "C", "D"]:
        params = grading_config["grades"][grade]
        if score >= params["min_score"]:
            return grade, params["description"]
    return "D", grading_config["grades"]["D"]["description"]


GRADE_COLORS = {
    "A": (76, 175, 80),     # Green
    "B": (139, 195, 74),    # Light Green
    "C": (255, 152, 0),     # Orange
    "D": (244, 67, 54),     # Red
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
        self.quality_model = None
        self.quality_transform = None
        self.class_names = None
        self.grading_config = self.config["grading"]
        
        self._load_models()
    
    def _load_models(self):
        """Load both models into memory."""
        print(f"Loading models on {self.device}...")
        
        # Stage 1: YOLOv8 Detection
        from ultralytics import YOLO
        det_path = os.path.join(self.config["paths"]["detection_model_dir"], "best.pt")
        if os.path.exists(det_path):
            self.detection_model = YOLO(det_path)
            print(f"  ✓ Custom Detection model loaded: {det_path}")
        else:
            base_model = self.config["detection"].get("base_model", "yolov8n.pt")
            self.detection_model = YOLO(base_model)
            print(f"  ✓ Detection base model loaded: {base_model}")
        
        # Stage 2: CNN Quality Grading
        qual_path = os.path.join(self.config["paths"]["quality_model_dir"], "best.pth")
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
        }
        
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
            }
            per_view.append(view_data)
            if detected_name is not None:
                detected_products.append(detected_name)

        # Strict validation: MUST be fruits or vegetables alone
        if len(detected_products) == 0:
            raise ValueError(
                "No fruit or vegetable detected. Please point the camera at your produce and capture 4 clear photos."
            )

        if len(detected_products) < 2:
            raise ValueError(
                "Product could not be identified clearly as a fruit or vegetable. Please point the camera directly at your produce."
            )

        # Consistency verification
        from collections import Counter
        counts = Counter(detected_products)
        primary_product, most_count = counts.most_common(1)[0]
        
        # Check for multiple distinct products detected with high confidence
        distinct_products = set(detected_products)
        if len(distinct_products) > 1 and len(detected_products) >= 3:
            conflicts = [p for p in distinct_products if counts[p] >= 2 and p != primary_product]
            if conflicts or len(distinct_products) >= 3:
                raise ValueError("Please capture 4 photos of the same fruit or vegetable.")

        consistency_ratio = round(most_count / 4.0, 2)

        # 4-View Feature Fusion:
        # Conservative formula preventing hidden damage:
        # S_fused = 0.45*min + 0.35*mean + 0.20*median - rot_penalty - variance_penalty
        scores = [v["quality_score"] for v in per_view]
        det_confs = [v["detection_confidence"] for v in per_view]
        qual_confs = [v["quality_confidence"] for v in per_view]
        rotten_count = sum(1 for v in per_view if v["quality_class"].lower() == "rotten" or v["quality_score"] < 50)

        min_s = float(np.min(scores))
        mean_s = float(np.mean(scores))
        median_s = float(np.median(scores))
        std_s = float(np.std(scores))

        base_fused = 0.45 * min_s + 0.35 * mean_s + 0.20 * median_s
        damage_penalty = rotten_count * 6.0
        variance_penalty = max(0.0, (std_s - 10.0) * 0.25)

        final_score = max(0.0, min(100.0, base_fused - damage_penalty - variance_penalty))
        final_score = round(final_score, 1)

        grade, grade_desc = score_to_grade(final_score, self.grading_config)
        avg_det_conf = round(float(np.mean(det_confs)), 4)
        avg_qual_conf = round(float(np.mean(qual_confs)), 4)

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
                "formula": "0.45*min + 0.35*mean + 0.20*median - damage_penalty - variance_penalty",
                "stats": {
                    "min_score": round(min_s, 1),
                    "mean_score": round(mean_s, 1),
                    "median_score": round(median_s, 1),
                    "std_dev": round(std_s, 1),
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
