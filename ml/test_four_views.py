#!/usr/bin/env python3
import sys
import os
import glob

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from inference import InferencePipeline

def test_inference_four_views():
    pipeline = InferencePipeline()
    tomato_imgs = sorted(glob.glob("dataset/tomato/fresh/*.*"))[:4]
    print(f"Testing with 4 tomato images: {tomato_imgs}")
    assert len(tomato_imgs) == 4, "Need 4 images"

    res = pipeline.predict_four_views(tomato_imgs)
    print("\n--- 4-VIEW INFERENCE RESULT ---")
    print(f"Product: {res['product']}")
    print(f"Quality: Grade {res['quality']['grade']}, Score {res['quality']['score']}")
    print(f"Stats: {res['quality']['stats']}")
    for v in res['quality']['per_view']:
        print(f"  {v['view_name']}: {v['product_detected']} | Score: {v['quality_score']} | Class: {v['quality_class']}")

    assert res["success"] is True
    assert res["quality"]["score"] > 0
    print("\n✓ 4-view inference test PASSED!")

if __name__ == "__main__":
    test_inference_four_views()
