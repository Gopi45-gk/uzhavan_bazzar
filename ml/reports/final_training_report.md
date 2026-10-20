# Final ML Training & Evaluation Report

**Generated**: Auto-generated after model evaluation

---

## Stage 1: YOLOv8 Object Detection

*Detection evaluation not yet run. Execute `evaluate_detection.py` first.*

## Stage 2: CNN Quality Grading

### Classification Metrics

| Metric | Value |
|--------|-------|
| **Accuracy** | 0.9943 |
| **F1 (Macro)** | 0.9943 |
| **F1 (Weighted)** | 0.9943 |
| **AUC-ROC** | 0.9987 |

### Detailed Classification Report

```
              precision    recall  f1-score   support

       fresh       1.00      0.99      0.99       350
      rotten       0.99      1.00      0.99       350

    accuracy                           0.99       700
   macro avg       0.99      0.99      0.99       700
weighted avg       0.99      0.99      0.99       700
```

### Confusion Matrix

```
    347      3
      1    349
```

### Quality Score Statistics

- **Mean**: 54.44
- **Std Dev**: inf
- **Min**: 12.36
- **Max**: 97.50
- **Median**: 34.88

### Grade Distribution

| Grade | Count | Description |
|-------|-------|-------------|
| **A** | 339 | Grade A |
| **B** | 6 | Grade B |
| **C** | 355 | Grade C |

---

## System Architecture

1. **Input** → Image uploaded via API or CLI
2. **Stage 1** → YOLOv8 detects and localizes produce items with bounding boxes
3. **Stage 2** → Each crop is passed through MobileNetV3 for quality assessment
4. **Output** → JSON with detected items, quality scores (0-100), and grades (A/B/C/D)
