#!/usr/bin/env python3
"""
Comprehensive End-to-End Acceptance Test:
Scenario:
- Farmer captures 4 tomato images.
- System identifies Tomato.
- Quality score and Grade evaluated.
- Mandi reference price retrieved.
- Recommended price range calculated.
- Farmer enters 25 kg.
- Total estimated value computed.
- Product posted and verified in catalog.
"""

import sys
import os
import requests
import glob

API_BASE = "http://localhost:8000"

def run_acceptance_test():
    print("=" * 60)
    print("RUNNING END-TO-END ACCEPTANCE TEST")
    print("=" * 60)

    # 1. Health check
    print("\n[1/4] Checking ML Server Health...")
    res = requests.get(f"{API_BASE}/health", timeout=5)
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    print(f"  ✓ GPU Available: {health_data['gpu'].get('gpu_available')}")
    print(f"  ✓ GPU Name: {health_data['gpu'].get('gpu_name', 'CPU')}")
    print(f"  ✓ Detection Model Ready: {health_data['detection_model']}")
    print(f"  ✓ Quality Model Ready: {health_data['quality_model']}")

    # 2. 4-Photo Analysis
    print("\n[2/4] Testing 4-Photo Analysis (/api/products/analyze)...")
    sample_imgs = sorted(glob.glob("dataset/tomato/fresh/*.*"))[:4]
    assert len(sample_imgs) == 4, "Need 4 sample images"

    files = [
        ("images", (os.path.basename(img), open(img, "rb"), "image/jpeg"))
        for img in sample_imgs
    ]
    data = {
        "district": "Chennai",
        "state": "Tamil Nadu"
    }

    res = requests.post(f"{API_BASE}/api/products/analyze", files=files, data=data, timeout=15)
    assert res.status_code == 200, f"Analysis failed ({res.status_code}): {res.text}"
    analysis = res.json()

    print(f"  ✓ Product Identified: {analysis['product']['name']} (Confidence: {analysis['product']['confidence']:.0%})")
    print(f"  ✓ Quality Grade: {analysis['quality']['grade']} (Score: {analysis['quality']['score']}/100)")
    print(f"  ✓ Mandi Reference Price: ₹{analysis['market']['mandi_price']}/kg ({analysis['market']['market_name']})")
    print(f"  ✓ Recommended Price Range: {analysis['recommended_price']['display_text']}")

    # 3. Post Product with 25 kg
    print("\n[3/4] Publishing Produce Listing with 25 kg (/api/products)...")
    post_payload = {
        "product_name": analysis["product"]["name"],
        "commodity_key": analysis["product"]["commodity_key"],
        "quantity_kg": 25.0,
        "grade": analysis["quality"]["grade"],
        "quality_score": analysis["quality"]["score"],
        "detection_confidence": analysis["product"]["confidence"],
        "quality_confidence": analysis["quality"]["confidence"],
        "mandi_price": analysis["market"]["mandi_price"],
        "mandi_market": analysis["market"]["market_name"],
        "mandi_district": analysis["market"]["district"],
        "recommended_min_price": analysis["recommended_price"]["min"],
        "recommended_max_price": analysis["recommended_price"]["max"],
        "farmer_name": "Murugan S.",
        "farmer_location": "Madurai Mandi Gate 2",
    }

    res = requests.post(f"{API_BASE}/api/products", json=post_payload, timeout=5)
    assert res.status_code == 200, f"Post product failed: {res.text}"
    created = res.json()["product"]

    print(f"  ✓ Listing ID: {created['id']}")
    print(f"  ✓ Listed Produce: {created['product_name']} ({created['quantity_kg']} kg)")
    print(f"  ✓ Display Price: {created['display_price']}")
    print(f"  ✓ Estimated Min Total: ₹{created['estimated_min_total']:,.2f}")
    print(f"  ✓ Estimated Max Total: ₹{created['estimated_max_total']:,.2f}")

    # 4. Verify Catalog
    print("\n[4/4] Verifying Listing in Database (/api/products)...")
    res = requests.get(f"{API_BASE}/api/products", timeout=5)
    assert res.status_code == 200
    catalog = res.json()["products"]
    matching = [p for p in catalog if p["id"] == created["id"]]
    assert len(matching) > 0, "Created product not found in catalog"
    print(f"  ✓ Confirmed in database! Total listings in store: {len(catalog)}")

    print("\n" + "=" * 60)
    print("ALL END-TO-END ACCEPTANCE TESTS PASSED SUCCESSFULLY! ✓")
    print("=" * 60)

if __name__ == "__main__":
    run_acceptance_test()
