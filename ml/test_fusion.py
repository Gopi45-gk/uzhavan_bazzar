#!/usr/bin/env python3
import sys
import os
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from api import calculate_grade_price_range, fetch_live_mandi_price
from inference import normalize_commodity_name

def test_pricing():
    print("Testing Grade-based Pricing Engine...")
    # Tomato at ₹55
    res_a = calculate_grade_price_range(55.0, "A", "tomato")
    print("Tomato Mandi=₹55 Grade A:", res_a["display_text"])
    assert res_a["min"] == 50.0 and res_a["max"] == 55.0, f"Expected 50-55, got {res_a}"

    res_b = calculate_grade_price_range(55.0, "B", "tomato")
    print("Tomato Mandi=₹55 Grade B:", res_b["display_text"])
    assert res_b["min"] == 45.0 and res_b["max"] == 52.0, f"Expected 45-52, got {res_b}"

    res_c = calculate_grade_price_range(55.0, "C", "tomato")
    print("Tomato Mandi=₹55 Grade C:", res_c["display_text"])
    assert res_c["max"] == 45.0, f"Expected < 45, got {res_c}"

    # Mandi at ₹100
    res_100_a = calculate_grade_price_range(100.0, "A", "tomato")
    print("Tomato Mandi=₹100 Grade A:", res_100_a["display_text"])
    assert res_100_a["min"] == 95.0 and res_100_a["max"] == 100.0

    res_100_b = calculate_grade_price_range(100.0, "B", "tomato")
    print("Tomato Mandi=₹100 Grade B:", res_100_b["display_text"])
    assert res_100_b["min"] == 90.0 and res_100_b["max"] == 97.0

    res_100_c = calculate_grade_price_range(100.0, "C", "tomato")
    print("Tomato Mandi=₹100 Grade C:", res_100_c["display_text"])
    assert res_100_c["max"] == 90.0

    # Mandi at ₹40
    res_40_a = calculate_grade_price_range(40.0, "A", "tomato")
    print("Tomato Mandi=₹40 Grade A:", res_40_a["display_text"])
    assert res_40_a["min"] == 35.0 and res_40_a["max"] == 40.0

    res_40_b = calculate_grade_price_range(40.0, "B", "tomato")
    print("Tomato Mandi=₹40 Grade B:", res_40_b["display_text"])
    assert res_40_b["min"] == 30.0 and res_40_b["max"] == 37.0

    res_40_c = calculate_grade_price_range(40.0, "C", "tomato")
    print("Tomato Mandi=₹40 Grade C:", res_40_c["display_text"])
    assert res_40_c["max"] == 30.0

    print("✓ All pricing assertions passed!")

def test_mandi_fetch():
    print("\nTesting Mandi Price Fetcher...")
    m = fetch_live_mandi_price("Tomato", "Chennai")
    print("Mandi Price Result:", m)
    assert m["mandi_price"] > 0
    print("✓ Mandi fetch passed!")

if __name__ == "__main__":
    test_pricing()
    test_mandi_fetch()
