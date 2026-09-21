#!/usr/bin/env python3
"""
FastAPI Inference & Produce Management Server
- POST /api/products/analyze: 4-image multi-view analysis (YOLOv8 + MobileNetV3 CNN + 4-View Fusion + Mandi Price + Dynamic Pricing)
- POST /api/products: Create & publish farmer produce listing with server-side validation
- GET /api/products: Fetch all published listings
- GET /api/pricing-rules: Configurable grade-based pricing engine rules
- POST /predict: Single-image inference (legacy/debug)
- GET /health: Check GPU status and model readiness
"""

import os
import sys
import io
import json
import time
import tempfile
import yaml
import requests
import torch
import uvicorn
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from PIL import Image
from contextlib import asynccontextmanager

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from inference import InferencePipeline


# Global pipeline reference
pipeline = None
config_cache = None


def load_config(config_path="ml/config.yaml"):
    global config_cache
    with open(config_path, "r") as f:
        config_cache = yaml.safe_load(f)
    return config_cache


# Baseline Mandi Price Catalog (₹/kg) calibrated against Tamil Nadu APMC mandi references
BASELINE_MANDI_PRICES = {
    "tomato": {"price": 55.0, "market": "Chennai Koyambedu Market", "variety": "Hybrid Nadu"},
    "onion": {"price": 34.0, "market": "Chennai APMC Wholesale", "variety": "Bellary Red"},
    "potato": {"price": 25.0, "market": "Chennai Wholesale Mandi", "variety": "Kufri Jyoti"},
    "carrot": {"price": 44.0, "market": "Chennai Koyambedu Market", "variety": "Ooty Orange"},
    "bhindi": {"price": 31.0, "market": "Chennai APMC Market", "variety": "Local Green"},
    "brinjal": {"price": 38.0, "market": "Madurai Mattuthavani Mandi", "variety": "Ujala Purple"},
    "banana": {"price": 35.0, "market": "Chennai APMC Fruit Market", "variety": "Poovan"},
    "apple": {"price": 86.0, "market": "Chennai APMC Market", "variety": "Royal Delicious"},
    "mango": {"price": 60.0, "market": "Salem APMC Mandi", "variety": "Alphonso"},
    "orange": {"price": 45.0, "market": "Coimbatore RS Puram Mandi", "variety": "Nagpur"},
    "pomegranate": {"price": 80.0, "market": "Chennai Fruit Market", "variety": "Khabua"},
    "cucumber": {"price": 26.0, "market": "Oddanchatram Vegetable Market", "variety": "Local Fresh"},
    "cabbage": {"price": 22.0, "market": "Koyambedu Wholesale", "variety": "Green Ball"},
    "cauliflower": {"price": 36.0, "market": "Coimbatore Mandi", "variety": "White Snow"},
    "papaya": {"price": 25.0, "market": "Chennai Fruit Market", "variety": "Red Lady"},
    "capsicum": {"price": 48.0, "market": "Ooty Wholesale", "variety": "Green"},
    "radish": {"price": 20.0, "market": "Madurai Market", "variety": "White Long"},
    "pumpkin": {"price": 18.0, "market": "Tiruppur Uzhavar Sandhai", "variety": "Yellow"},
    "bitter_gourd": {"price": 35.0, "market": "Dindigul Market", "variety": "Green"},
    "bottle_gourd": {"price": 24.0, "market": "Madurai Gate 2", "variety": "Long Green"},
    "grape": {"price": 65.0, "market": "Theni Grape Mandi", "variety": "Paneer"},
    "guava": {"price": 40.0, "market": "Ayakudi Guava Market", "variety": "Lucknow 49"},
    "strawberry": {"price": 140.0, "market": "Ooty Farm Direct", "variety": "Sweet Charlie"},
}

PRODUCTS_DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "products.json")


def get_products_store():
    os.makedirs(os.path.dirname(PRODUCTS_DB_FILE), exist_ok=True)
    if os.path.exists(PRODUCTS_DB_FILE):
        try:
            with open(PRODUCTS_DB_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return []
    return []


def save_products_store(products):
    os.makedirs(os.path.dirname(PRODUCTS_DB_FILE), exist_ok=True)
    with open(PRODUCTS_DB_FILE, "w") as f:
        json.dump(products, f, indent=2)


def fetch_live_mandi_price(commodity_name: str, district: Optional[str] = "Chennai", state: Optional[str] = "Tamil Nadu"):
    """
    Fetch official market reference price from data.gov.in AGMARKNET API.
    Falls back gracefully to the calibrated regional APMC baseline if the external API is unreachable.
    """
    cfg = config_cache or load_config()
    mandi_cfg = cfg.get("mandi_api", {})
    api_key = mandi_cfg.get("api_key", "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b")
    base_url = mandi_cfg.get("base_url", "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070")

    comm_clean = commodity_name.lower().replace(" ", "_")
    baseline = BASELINE_MANDI_PRICES.get(comm_clean, {
        "price": 50.0,
        "market": f"{district or 'Chennai'} APMC Market",
        "variety": "Standard Local"
    })

    try:
        params = {
            "api-key": api_key,
            "format": "json",
            "limit": "20",
            "filters[state.keyword]": state or "Tamil Nadu",
            "filters[commodity.keyword]": commodity_name.upper(),
        }
        if district:
            params["filters[district.keyword]"] = district

        res = requests.get(base_url, params=params, timeout=4.0)
        if res.status_code == 200:
            data = res.json()
            records = data.get("records", [])
            if records and isinstance(records, list):
                # AGMARKNET modal_price is per Quintal (100 kg)
                rec = records[0]
                raw_modal = float(rec.get("modal_price", 0))
                if raw_modal > 0:
                    price_per_kg = round(raw_modal / 100.0, 1)
                    return {
                        "mandi_price": price_per_kg,
                        "unit": "kg",
                        "market_name": rec.get("market", baseline["market"]),
                        "district": rec.get("district", district or "Chennai"),
                        "state": rec.get("state", state or "Tamil Nadu"),
                        "commodity": commodity_name,
                        "variety": rec.get("variety", baseline["variety"]),
                        "source": "api.data.gov.in (AGMARKNET Live API)",
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                        "is_live": True,
                    }
    except Exception as e:
        print(f"Mandi API fetch warning: {e}, using calibrated regional baseline.")

    # Calibrated regional baseline fallback
    return {
        "mandi_price": baseline["price"],
        "unit": "kg",
        "market_name": baseline["market"],
        "district": district or "Chennai",
        "state": state or "Tamil Nadu",
        "commodity": commodity_name,
        "variety": baseline["variety"],
        "source": "data.gov.in (AGMARKNET Baseline Reference)",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "is_live": False,
    }


def calculate_grade_price_range(base_mandi_price: float, grade: str, commodity_key: str):
    """
    Configurable grade-based pricing engine:
    Grade A: base_price + min_offset to base_price + max_offset (e.g., ₹55 -> ₹50–₹55/kg)
    Grade B: base_price + min_offset to base_price + max_offset (e.g., ₹55 -> ₹45–₹52/kg)
    Grade C: < base_price + max_offset (e.g., ₹55 -> < ₹45/kg)
    Grade D: steep discount for salvage/processing (e.g. 30%-50% of base)
    """
    cfg = config_cache or load_config()
    pricing_rules = cfg.get("pricing_rules", {})
    rules_for_comm = pricing_rules.get(commodity_key, pricing_rules.get("default", {}))
    rule = rules_for_comm.get(grade, rules_for_comm.get("A", {}))

    base = float(base_mandi_price)

    if grade == "A":
        min_off = rule.get("min_offset", -5)
        max_off = rule.get("max_offset", 0)
        p_min = max(1.0, round(base + min_off, 1))
        p_max = max(p_min, round(base + max_off, 1))
        display = f"₹{int(p_min) if p_min.is_integer() else p_min}–₹{int(p_max) if p_max.is_integer() else p_max}/kg"
        is_open_ended = False
    elif grade == "B":
        min_off = rule.get("min_offset", -10)
        max_off = rule.get("max_offset", -3)
        p_min = max(1.0, round(base + min_off, 1))
        p_max = max(p_min, round(base + max_off, 1))
        display = f"₹{int(p_min) if p_min.is_integer() else p_min}–₹{int(p_max) if p_max.is_integer() else p_max}/kg"
        is_open_ended = False
    elif grade == "C":
        max_off = rule.get("max_offset", -10)
        min_fac = rule.get("min_factor", 0.60)
        p_max = max(1.0, round(base + max_off, 1))
        p_min = max(1.0, round(base * min_fac, 1))
        display = f"< ₹{int(p_max) if p_max.is_integer() else p_max}/kg"
        is_open_ended = True
    else:  # Grade D
        min_fac = rule.get("min_factor", 0.30)
        max_fac = rule.get("max_factor", 0.50)
        p_min = max(1.0, round(base * min_fac, 1))
        p_max = max(p_min, round(base * max_fac, 1))
        display = f"₹{int(p_min) if p_min.is_integer() else p_min}–₹{int(p_max) if p_max.is_integer() else p_max}/kg"
        is_open_ended = False

    return {
        "min": p_min,
        "max": p_max,
        "unit": "kg",
        "display_text": display,
        "is_open_ended": is_open_ended,
        "explanation": "This price is estimated based on the current market price and AI quality grade.",
    }


class ProductListingModel(BaseModel):
    product_name: str
    commodity_key: Optional[str] = None
    quantity_kg: float = Field(..., gt=0)
    grade: str
    quality_score: float
    detection_confidence: Optional[float] = 0.95
    quality_confidence: Optional[float] = 0.90
    mandi_price: float
    mandi_market: Optional[str] = "Chennai Koyambedu Market"
    mandi_district: Optional[str] = "Chennai"
    recommended_min_price: float
    recommended_max_price: float
    estimated_min_total: Optional[float] = None
    estimated_max_total: Optional[float] = None
    farmer_id: Optional[str] = "FARMER-DEFAULT"
    farmer_name: Optional[str] = "Murugan S."
    farmer_location: Optional[str] = "Madurai Mandi Gate 2"
    images: Optional[List[str]] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup, clean up on shutdown."""
    global pipeline
    load_config()
    print("Loading ML models...")
    try:
        pipeline = InferencePipeline()
        print("✓ Models loaded and ready for inference!")
    except Exception as e:
        print(f"✗ Failed to load models: {e}")
        pipeline = None
    yield
    if pipeline and torch.cuda.is_available():
        torch.cuda.empty_cache()
    print("Server shutting down.")


app = FastAPI(
    title="Uzhavan Bazaar ML API",
    description="Fruit & Vegetable Detection + Quality Grading & Dynamic Mandi Pricing API",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Check GPU status and model readiness."""
    gpu_info = {}
    if torch.cuda.is_available():
        gpu_info = {
            "gpu_available": True,
            "gpu_name": torch.cuda.get_device_name(0),
            "gpu_memory_total_mb": round(torch.cuda.get_device_properties(0).total_memory / (1024**2)),
            "gpu_memory_allocated_mb": round(torch.cuda.memory_allocated(0) / (1024**2), 1),
            "gpu_memory_cached_mb": round(torch.cuda.memory_reserved(0) / (1024**2), 1),
        }
    else:
        gpu_info = {"gpu_available": False, "device": "cpu"}
    
    models_ready = pipeline is not None
    return {
        "status": "healthy" if models_ready else "degraded",
        "models_loaded": models_ready,
        "detection_model": pipeline.detection_model is not None if pipeline else False,
        "quality_model": pipeline.quality_model is not None if pipeline else False,
        "gpu": gpu_info,
    }


@app.get("/api/pricing-rules")
async def get_pricing_rules():
    """Return current grade-based pricing configuration."""
    cfg = config_cache or load_config()
    return {
        "success": True,
        "pricing_rules": cfg.get("pricing_rules", {}),
        "grades": cfg.get("grading", {}).get("grades", {}),
    }


@app.post("/api/products/analyze")
async def analyze_four_views(
    images: List[UploadFile] = File(..., description="Exactly 4 photos of the produce (Front, Side, Opposite, Close-up)"),
    district: Optional[str] = Form("Chennai"),
    state: Optional[str] = Form("Tamil Nadu"),
):
    """
    Complete Multi-View Analysis Workflow:
    1. Validates exactly 4 photos.
    2. Runs YOLOv8 object detection on each view.
    3. Enforces consistency (raises error if different products are detected).
    4. Runs CNN Quality Model on foreground crops.
    5. Applies conservative 4-view feature fusion.
    6. Fetches official Mandi reference price.
    7. Calculates dynamic recommended farmer selling price range.
    """
    if pipeline is None:
        raise HTTPException(status_code=503, detail="ML inference service is starting up. Please try again in a few seconds.")

    if len(images) != 4:
        raise HTTPException(
            status_code=400,
            detail=f"Please capture all 4 photos. Received {len(images)} of 4 required."
        )

    # Validate image types and save to temp files
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/bmp", "application/octet-stream"}
    tmp_paths = []
    
    try:
        for idx, img_file in enumerate(images):
            if img_file.content_type and img_file.content_type not in allowed_types:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported image format in photo {idx + 1}: {img_file.content_type}"
                )
            
            contents = await img_file.read()
            try:
                pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Corrupt or invalid image in photo {idx + 1}: {e}")

            # Resize/compress if image is huge (low bandwidth optimization)
            max_dim = 1280
            if max(pil_img.size) > max_dim:
                pil_img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

            tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
            pil_img.save(tmp.name, "JPEG", quality=90)
            tmp_paths.append(tmp.name)

        # Run 4-view inference pipeline
        try:
            inference_result = pipeline.predict_four_views(tmp_paths)
        except ValueError as ve:
            # Consistency or photo mismatch error
            raise HTTPException(status_code=400, detail=str(ve))

        detected_product = inference_result["product"]["name"]
        commodity_key = inference_result["product"]["commodity_key"]
        grade = inference_result["quality"]["grade"]
        quality_score = inference_result["quality"]["score"]

        # Step 8: Get Mandi Market Price
        mandi_data = fetch_live_mandi_price(detected_product, district=district, state=state)
        base_price = mandi_data["mandi_price"]

        # Step 9: Grade-based price range
        recommended_price = calculate_grade_price_range(base_price, grade, commodity_key)

        return JSONResponse(content={
            "success": True,
            "product": inference_result["product"],
            "quality": inference_result["quality"],
            "market": mandi_data,
            "recommended_price": recommended_price,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        })

    finally:
        # Clean up temp files
        for p in tmp_paths:
            if os.path.exists(p):
                try:
                    os.unlink(p)
                except Exception:
                    pass


@app.post("/api/products")
async def create_product(listing: ProductListingModel):
    """
    Publish a new farmer produce listing.
    Validates price range and calculations server-side to ensure integrity.
    """
    comm_key = listing.commodity_key or listing.product_name.lower().replace(" ", "_")
    
    # Recalculate price range server-side to guarantee integrity
    expected_pricing = calculate_grade_price_range(listing.mandi_price, listing.grade, comm_key)
    
    # Calculate estimated totals
    min_total = round(listing.quantity_kg * expected_pricing["min"], 2)
    max_total = round(listing.quantity_kg * expected_pricing["max"], 2)

    product_id = f"PROD-{int(time.time() * 1000) % 1000000}"
    record = {
        "id": product_id,
        "product_name": listing.product_name,
        "commodity_key": comm_key,
        "quantity_kg": listing.quantity_kg,
        "grade": listing.grade,
        "quality_score": listing.quality_score,
        "detection_confidence": listing.detection_confidence,
        "quality_confidence": listing.quality_confidence,
        "mandi_price": listing.mandi_price,
        "mandi_market": listing.mandi_market,
        "mandi_district": listing.mandi_district,
        "recommended_min_price": expected_pricing["min"],
        "recommended_max_price": expected_pricing["max"],
        "display_price": expected_pricing["display_text"],
        "estimated_min_total": min_total,
        "estimated_max_total": max_total,
        "farmer_id": listing.farmer_id,
        "farmer_name": listing.farmer_name,
        "farmer_location": listing.farmer_location,
        "images": listing.images or [],
        "status": "Active",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "model_version": "YOLOv8n + MobileNetV3-Large-DualHead-v2",
    }

    # Persist
    products = get_products_store()
    products.insert(0, record)
    save_products_store(products)

    return JSONResponse(content={
        "success": True,
        "message": "Product listed successfully on Uzhavan Bazzar!",
        "product": record
    })


@app.get("/api/products")
async def get_products():
    """Retrieve all active farmer product listings."""
    products = get_products_store()
    return JSONResponse(content={
        "success": True,
        "count": len(products),
        "products": products
    })


@app.post("/predict")
async def predict(
    image: UploadFile = File(..., description="Image file (JPEG, PNG, WebP)"),
    confidence: float = 0.35,
    annotate: bool = False,
):
    """Legacy single-image prediction endpoint."""
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Models not loaded. Check /health endpoint.")
    
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
    if image.content_type and image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type: {image.content_type}. Accepted: {allowed_types}"
        )
    
    try:
        contents = await image.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")
    
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp_path = tmp.name
        img.save(tmp_path, "JPEG", quality=95)
    
    try:
        result = pipeline.predict(
            tmp_path,
            conf_threshold=confidence,
            annotate=annotate,
        )
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Inference failed"))
    
    response = {
        "success": True,
        "objects": result["objects"],
        "num_objects": result["num_objects"],
        "image_size": result["image_size"],
        "inference_time_ms": result["inference_time_ms"],
    }
    
    if annotate and "annotated_image" in result and result["annotated_image"]:
        buf = io.BytesIO()
        result["annotated_image"].save(buf, format="JPEG", quality=95)
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="image/jpeg",
            headers={
                "X-Inference-Result": json.dumps(response),
                "Content-Disposition": f"inline; filename=result_{image.filename}"
            }
        )
    
    return JSONResponse(content=response)


if __name__ == "__main__":
    config = load_config()
    print(f"\n{'='*60}")
    print(f"STARTING UZHAVAN BAZAAR ML API SERVER")
    print(f"{'='*60}")
    print(f"  Endpoint: http://0.0.0.0:8000")
    print(f"  Docs: http://0.0.0.0:8000/docs")
    print(f"  Health: http://0.0.0.0:8000/health")
    print(f"  Analyze (4-view): POST http://0.0.0.0:8000/api/products/analyze")
    print(f"{'='*60}\n")
    
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        workers=1,
        log_level="info",
    )
