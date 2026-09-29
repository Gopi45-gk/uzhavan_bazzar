#!/usr/bin/env python3
"""
Comprehensive Acceptance Test Suite for:
1. Strict Grade A / B / C (NO D, E, Poor, etc.)
2. Quality Score 0-100 conversion
3. Dynamic Mandi Pricing Engine (Base = Mandi API)
4. Quantity & Total Estimated Value Calculations (Grade A/B range, Grade C upper bound)
5. Multiple Mandi prices (₹100, ₹80, ₹55, ₹40, ₹25, ₹150)
6. 4-View Fusion & Product Consistency Check (Reject if different products)
7. REST API Endpoints & Server-Side Verification
"""

import sys
import os
import requests
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from inference import InferencePipeline, score_to_grade, load_config
from api import calculate_grade_price_range, fetch_live_mandi_price

def test_quality_score_to_grade():
    print("=" * 60)
    print("TEST 1: Quality Score to Strictly Grade A / B / C")
    print("=" * 60)
    cfg = load_config()

    # Test 92 -> Grade A
    g92, desc92 = score_to_grade(92, cfg["grading"])
    print(f"  Score 92/100 -> Grade {g92} ({desc92})")
    assert g92 == "A", f"Expected A, got {g92}"

    # Test 82 -> Grade B
    g82, desc82 = score_to_grade(82, cfg["grading"])
    print(f"  Score 82/100 -> Grade {g82} ({desc82})")
    assert g82 == "B", f"Expected B, got {g82}"

    # Test 65 -> Grade C
    g65, desc65 = score_to_grade(65, cfg["grading"])
    print(f"  Score 65/100 -> Grade {g65} ({desc65})")
    assert g65 == "C", f"Expected C, got {g65}"

    # Test 40 -> Strictly Grade C (NEVER D)
    g40, desc40 = score_to_grade(40, cfg["grading"])
    print(f"  Score 40/100 -> Grade {g40} ({desc40})")
    assert g40 == "C", f"Expected C, got {g40}"

    # Test boundary 90 -> Grade A
    g90, _ = score_to_grade(90, cfg["grading"])
    assert g90 == "A"

    # Test boundary 89 -> Grade B
    g89, _ = score_to_grade(89, cfg["grading"])
    assert g89 == "B"

    # Test boundary 75 -> Grade B
    g75, _ = score_to_grade(75, cfg["grading"])
    assert g75 == "B"

    # Test boundary 74 -> Grade C
    g74, _ = score_to_grade(74, cfg["grading"])
    assert g74 == "C"

    # Test 0 -> Grade C
    g0, _ = score_to_grade(0, cfg["grading"])
    assert g0 == "C"

    print("  ✓ PASS: Grades are strictly A, B, or C!")


def test_pricing_engine_mandi_55():
    print("\n" + "=" * 60)
    print("TEST 2: Dynamic Pricing for Tomato with Mandi = ₹55/kg")
    print("=" * 60)

    # Grade A: base - 5 to base -> ₹50–₹55/kg
    pa = calculate_grade_price_range(55.0, "A", "tomato")
    print(f"  Grade A: {pa['display_price']}")
    assert pa["grade"] == "A"
    assert pa["min_price"] == 50.0
    assert pa["max_price"] == 55.0
    assert pa["display_price"] == "₹50–₹55/kg"

    # Grade B: base - 10 to base - 3 -> ₹45–₹52/kg
    pb = calculate_grade_price_range(55.0, "B", "tomato")
    print(f"  Grade B: {pb['display_price']}")
    assert pb["grade"] == "B"
    assert pb["min_price"] == 45.0
    assert pb["max_price"] == 52.0
    assert pb["display_price"] == "₹45–₹52/kg"

    # Grade C: Below base - 10 -> Below ₹45/kg (No fake min price)
    pc = calculate_grade_price_range(55.0, "C", "tomato")
    print(f"  Grade C: {pc['display_price']}")
    assert pc["grade"] == "C"
    assert pc["min_price"] is None
    assert pc["max_price"] == 45.0
    assert pc["display_price"] == "Below ₹45/kg"
    assert pc["is_open_ended"] is True

    print("  ✓ PASS: Mandi ₹55/kg price ranges match requirement exactly!")


def test_pricing_engine_variable_mandi():
    print("\n" + "=" * 60)
    print("TEST 3: Dynamic Pricing with Variable Mandi Prices (₹100, ₹80, ₹40, ₹25, ₹150)")
    print("=" * 60)

    test_cases = [
        (100.0, "₹95–₹100/kg", "₹90–₹97/kg", "Below ₹90/kg"),
        (80.0, "₹75–₹80/kg", "₹70–₹77/kg", "Below ₹70/kg"),
        (40.0, "₹35–₹40/kg", "₹30–₹37/kg", "Below ₹30/kg"),
        (25.0, "₹20–₹25/kg", "₹15–₹22/kg", "Below ₹15/kg"),
        (150.0, "₹145–₹150/kg", "₹140–₹147/kg", "Below ₹140/kg"),
    ]

    for mandi_price, exp_a, exp_b, exp_c in test_cases:
        res_a = calculate_grade_price_range(mandi_price, "A", "tomato")
        res_b = calculate_grade_price_range(mandi_price, "B", "tomato")
        res_c = calculate_grade_price_range(mandi_price, "C", "tomato")

        print(f"  Mandi ₹{mandi_price:.0f}/kg -> A: {res_a['display_price']} | B: {res_b['display_price']} | C: {res_c['display_price']}")
        assert res_a["display_price"] == exp_a, f"Expected {exp_a}, got {res_a['display_price']}"
        assert res_b["display_price"] == exp_b, f"Expected {exp_b}, got {res_b['display_price']}"
        assert res_c["display_price"] == exp_c, f"Expected {exp_c}, got {res_c['display_price']}"

    print("  ✓ PASS: Variable Mandi price recalculation verified!")


def test_quantity_and_estimated_value():
    print("\n" + "=" * 60)
    print("TEST 4: Farmer Quantity & Estimated Selling Value (25 kg)")
    print("=" * 60)
    qty = 25.0

    # Grade A @ Mandi ₹55: 25 * 50 = ₹1,250 to 25 * 55 = ₹1,375
    pa = calculate_grade_price_range(55.0, "A", "tomato")
    min_val_a = qty * pa["min_price"]
    max_val_a = qty * pa["max_price"]
    print(f"  Grade A (25 kg): ₹{min_val_a:.0f}–₹{max_val_a:.0f}")
    assert min_val_a == 1250.0 and max_val_a == 1375.0

    # Grade B @ Mandi ₹55: 25 * 45 = ₹1,125 to 25 * 52 = ₹1,300
    pb = calculate_grade_price_range(55.0, "B", "tomato")
    min_val_b = qty * pb["min_price"]
    max_val_b = qty * pb["max_price"]
    print(f"  Grade B (25 kg): ₹{min_val_b:.0f}–₹{max_val_b:.0f}")
    assert min_val_b == 1125.0 and max_val_b == 1300.0

    # Grade C @ Mandi ₹55: Below 25 * 45 = Below ₹1,125 (Upper-bound estimate)
    pc = calculate_grade_price_range(55.0, "C", "tomato")
    max_val_c = qty * pc["max_price"]
    display_c = f"Below ₹{int(max_val_c)} for {int(qty)} kg"
    print(f"  Grade C (25 kg): {display_c} (Upper-bound estimate)")
    assert max_val_c == 1125.0

    print("  ✓ PASS: Quantity & Estimated value calculations match requirement!")


def test_four_view_inference_and_consistency():
    print("\n" + "=" * 60)
    print("TEST 5: 4-View Inference Pipeline & Consistency Check")
    print("=" * 60)
    pipeline = InferencePipeline()

    tomato_images = [
        "dataset/tomato/fresh/freshTomato (148).png",
        "dataset/tomato/fresh/freshTomato (308).png",
        "dataset/tomato/fresh/freshTomato (164).png",
        "dataset/tomato/fresh/freshTomato (259).jpg",
    ]

    # Verify 4 tomato images
    print("  Running 4-view analysis on 4 Tomato images...")
    res = pipeline.predict_four_views(tomato_images)
    print(f"    Product: {res['product']['name']}")
    print(f"    Quality Score: {res['quality']['score']}/100")
    print(f"    Grade: {res['quality']['grade']}")
    print(f"    Fusion Formula: {res['quality']['formula']}")
    assert res["product"]["name"].lower() == "tomato"
    assert res["quality"]["grade"] in ["A", "B", "C"]
    assert 0 <= res["quality"]["score"] <= 100

    # Inconsistency test: 2 Tomatoes + 2 Apples
    print("\n  Testing Inconsistent Produce (2 Tomatoes + 2 Apples)...")
    mixed_images = [
        "dataset/tomato/fresh/freshTomato (148).png",
        "dataset/tomato/fresh/freshTomato (308).png",
        "dataset/apple/fresh/rotated_by_15_Screen Shot 2018-06-08 at 5.09.17 PM.png",
        "dataset/apple/fresh/rotated_by_60_Screen Shot 2018-06-08 at 5.14.48 PM.png",
    ]
    try:
        pipeline.predict_four_views(mixed_images)
        assert False, "Should have raised consistency error"
    except ValueError as e:
        print(f"    Caught expected error: '{e}'")
        assert "Please capture 4 photos of the same product." in str(e)

    print("  ✓ PASS: 4-View fusion and product consistency enforcement verified!")


def test_api_endpoints():
    print("\n" + "=" * 60)
    print("TEST 6: ML REST API Endpoints & Server-Side Validation")
    print("=" * 60)

    # Test /api/pricing-rules
    r = requests.get("http://localhost:8000/api/pricing-rules")
    assert r.status_code == 200
    data = r.json()
    assert "A" in data["grades"] and "B" in data["grades"] and "C" in data["grades"]
    assert "D" not in data["grades"], "Grade D should NOT exist!"
    print("  ✓ /api/pricing-rules strictly returns A, B, C")

    # Test /api/mandi/price
    r_mandi = requests.get("http://localhost:8000/api/mandi/price?commodity=tomato")
    assert r_mandi.status_code == 200
    mandi_json = r_mandi.json()
    assert mandi_json["data"]["mandi_price"] > 0
    print(f"  ✓ /api/mandi/price: Tomato Mandi price is ₹{mandi_json['data']['mandi_price']}/kg")

    # Test POST /api/products (Server-Side Recalculation)
    listing_payload = {
        "product_name": "Tomato",
        "commodity_key": "tomato",
        "quantity_kg": 25.0,
        "grade": "A",
        "quality_score": 92.0,
        "mandi_price": 55.0,
        "recommended_min_price": 999.0, # Intentional untrusted frontend price
        "recommended_max_price": 999.0,
        "farmer_id": "TEST-FARMER-1",
        "farmer_location": "Madurai Mandi Gate 2",
    }
    r_post = requests.post("http://localhost:8000/api/products", json=listing_payload)
    assert r_post.status_code == 200
    saved = r_post.json()["product"]
    print("  Server recalculated values:")
    print(f"    Recommended Range: ₹{saved['recommendedMinPrice']}–₹{saved['recommendedMaxPrice']}/kg")
    print(f"    Estimated Total: ₹{saved['estimatedMinValue']}–₹{saved['estimatedMaxValue']}")
    assert saved["recommendedMinPrice"] == 50.0, "Backend must overwrite untrusted min price!"
    assert saved["recommendedMaxPrice"] == 55.0, "Backend must overwrite untrusted max price!"
    assert saved["estimatedMinValue"] == 1250.0
    assert saved["estimatedMaxValue"] == 1375.0
    assert saved["grade"] == "A"
    print("  ✓ PASS: Server-side validation and recalibration verified!")

    # Test rejecting invalid grade
    invalid_payload = {**listing_payload, "grade": "D"}
    r_inv = requests.post("http://localhost:8000/api/products", json=invalid_payload)
    assert r_inv.status_code == 400
    print("  ✓ PASS: Invalid grade 'D' correctly rejected by server!")


if __name__ == "__main__":
    test_quality_score_to_grade()
    test_pricing_engine_mandi_55()
    test_pricing_engine_variable_mandi()
    test_quantity_and_estimated_value()
    test_four_view_inference_and_consistency()
    test_api_endpoints()
    print("\n" + "=" * 60)
    print("🎉 ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)
