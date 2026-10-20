# 🌾 Uzhavan Bazzar (உழவன் சந்தை)

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.6%20(CUDA)-EE4C2C.svg?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28.svg?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Accuracy](https://img.shields.io/badge/ML%20Accuracy-99.43%25-brightgreen.svg)]()
[![Live Deployment](https://img.shields.io/badge/Live%20Website-uzhavan--bazzar.duckdns.org-00C853?style=flat&logo=nginx&logoColor=white)](https://uzhavan-bazzar.duckdns.org)

> **Uzhavan Bazzar** is an AI-powered direct-from-farmer agricultural marketplace. It bridges local farmers and buyers in India with automated 4-view computer vision produce grading, real-time APMC Mandi fair pricing recommendations, direct livestock/cattle trading, and seamless regional delivery logistics.

---

## 🌐 Live Production Deployment

| Service | Access Link | Description |
| :--- | :--- | :--- |
| **🌾 Production Web App** | **[https://uzhavan-bazzar.duckdns.org](https://uzhavan-bazzar.duckdns.org)** | Live farmer & buyer platform with SSL (Let's Encrypt) |
| **🚀 Interactive Swagger API** | **[https://uzhavan-bazzar.duckdns.org/docs](https://uzhavan-bazzar.duckdns.org/docs)** | Live FastAPI interactive documentation & testing |
| **🩺 Server Health & GPU Status** | **[https://uzhavan-bazzar.duckdns.org/health](https://uzhavan-bazzar.duckdns.org/health)** | Live telemetry, model loading, and system diagnostics |
| **☁️ AWS Cloud Host** | `http://54.66.139.31` | AWS EC2 / Lightsail direct host IP |

---

## 🚀 Key Features

### 1. 🤖 Two-Stage AI Produce Detection & Quality Grading
- **Stage 1: Custom YOLO Object Detection:** Identifies 14 key Indian agricultural commodities (*Bellpepper, Tomato, Potato, Carrot, Cucumber, Apple, Banana, Orange, Mango, Strawberry, Grape, Guava, Jujube, Pomegranate*).
- **Human & Clutter Filtering:** Employs dual-stage filtering (YOLOv8n person detector + YuNet neural face detector) to prevent hands, faces, and clothing from distorting produce quality scores.
- **Stage 2: Deep Quality Grading (MobileNetV3-Large):** Predicts visual defect severity (0–100 quality score) and binary freshness state (`fresh` vs `rotten`).
- **GPU Accelerated:** Fully optimized for NVIDIA CUDA acceleration with FP16 mixed precision.

### 2. 📸 4-View Multi-Angle Conservative Fusion
- Requires exactly 4 photos (*Front, Side, Opposite, Close-up*) to eliminate single-angle blindspots.
- **Conservative Feature Fusion Formula:**
  $$\text{Score}_{\text{final}} = (0.40 \times \bar{S}) + (0.35 \times S_{\min}) + (0.15 \times C_{\text{qual}}) + (0.10 \times C_{\text{consist}}) - \text{Rot Penalty}$$
- **Anti-Concealment Protection:** If visible mold or rot is detected on even one side, the score is heavily discounted into **Grade C** to protect buyers.

### 3. ⚖️ APMC Mandi Dynamic Pricing Calibration
- Integrated with the **APMC Mandi Price Registry** for live benchmark pricing.
- Recommends fair price ranges strictly calibrated to government agricultural standards:
  - **Grade A (90–100):** Top market benchmark (e.g., Mandi ₹55 $\to$ **₹50–₹55/kg**)
  - **Grade B (75–89):** Standard commercial harvest (e.g., Mandi ₹55 $\to$ **₹45–₹52/kg**)
  - **Grade C (<75):** Clearance/processing grade (e.g., Mandi ₹55 $\to$ **Below ₹45/kg**)
- Farmer total batch revenue is dynamically recalculated when quantities change (e.g. 25 kg, 100 kg).

### 4. 🐄 Cattle & Livestock Marketplace
- Direct farmer-to-farmer and farmer-to-buyer livestock trading.
- Supports **Dairy Cows, Meat/Milk Goats, Country Hens, Fresh Farm Milk, and Organic Country Eggs**.
- Full breed details, lactation count, daily milk yield, age, vaccination history, and transparent farmer contact.

### 5. 🚚 Regional Logistics & Live Tracking
- **Hyperlocal & India Post Logistics:** Automatically routes orders $\le$50 km through direct local transport and orders $>$50 km through India Post Parcel Delivery.
- **Haversine Distance Engine:** Accurately calculates exact road distances between farm GPS and delivery destination.
- **Watermark-Free Live Maps:** Real-time visual transit tracking built with Leaflet and OpenStreetMap.

### 6. 🌐 Multilingual Accessibility
- Full native support for **Tamil (தமிழ்)** and **English**, designed specifically for rural farmers.

---

## 📊 AI Model Benchmarks & Metrics

Evaluated on a balanced test suite across 14 agricultural crops:

| Metric | Result | Description |
| :--- | :--- | :--- |
| **Overall Accuracy** | **`99.43%`** | Overall classification correctness across all produce |
| **Rotten Produce Recall** | **`99.70%`** | 349 / 350 rotten test samples identified (zero missed defects) |
| **Fresh Produce Precision** | **`100.0%`** | No rotten crops falsely graded as fresh |
| **F1-Score (Macro)** | **`0.9943`** | Harmonic mean of precision and recall |
| **AUC-ROC** | **`0.9987`** | Near-perfect separation between fresh and defective produce |
| **Inference Latency** | **`<45 ms`** | Real-time GPU execution per image |

---

## 📁 Repository Structure

```text
├── ml/
│   ├── api.py                    # FastAPI REST backend (Mandi pricing, 4-view inference)
│   ├── inference.py              # Two-stage YOLO + MobileNetV3 grading pipeline
│   ├── train_quality.py          # GPU training script with PyTorch & AMP
│   ├── evaluate_quality.py       # Metrics evaluation, confusion matrix & ROC generation
│   ├── acceptance_test.py        # Automated test suite (grades, pricing, 4-view fusion)
│   ├── test_four_views.py        # Multi-angle produce test suite
│   ├── config.yaml               # Model thresholds, weights, and APMC pricing rules
│   └── reports/                  # Evaluation plots, confusion matrix & Markdown logs
├── models/
│   ├── detection/best.pt         # Custom YOLO produce detector weights
│   ├── detection/face_detection_yunet.onnx  # YuNet neural face detector
│   └── quality/best.pth          # Retrained MobileNetV3-Large quality grading weights
├── src/
│   ├── components/               # React UI components (Camera modal, Cattle, Buyer/Farmer)
│   ├── services/                 # Firebase Auth, Firestore, and Mandi price services
│   ├── translations/             # Tamil & English localization dictionaries
│   ├── types/                    # TypeScript interfaces for produce, grades, cattle
│   └── App.tsx                   # Main application router
├── public/assets/images/         # Localized cattle and product illustrations
├── nginx-ssl.conf                # Production reverse proxy configuration
├── vite.config.ts                # Vite frontend bundler and proxy configuration
└── package.json                  # Frontend dependencies and scripts
```

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js:** v18 or newer
- **Python:** v3.10+ with CUDA toolkit
- **NVIDIA GPU:** RTX / GTX GPU recommended (CPU fallback supported)

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/Gopi45-gk/uzhavan_bazzar.git
cd uzhavan_bazzar

# Install Frontend dependencies
npm install

# Setup Python virtual environment
python3 -m venv ml_env
source ml_env/bin/activate
pip install -r ml/requirements.txt   # or torch torchvision ultralytics fastapi uvicorn opencv-python
```

### 2. Run Frontend Web App (Terminal 1)
```bash
npm run dev
```
👉 Open browser at: **[http://localhost:3000](http://localhost:3000)**

### 3. Run FastAPI ML Backend Server (Terminal 2)
```bash
env -u LD_LIBRARY_PATH PORT=8008 ./ml_env/bin/python -m uvicorn api:app --host 0.0.0.0 --port 8008 --app-dir ml
```
👉 Endpoints:
- **Interactive Swagger Docs:** [http://localhost:8008/docs](http://localhost:8008/docs)
- **Health & GPU Telemetry:** [http://localhost:8008/health](http://localhost:8008/health)

---

## 🧪 Testing & Verification Commands

Execute the built-in testing tools to verify grading accuracy and pricing logic:

```bash
# 1. Run Complete 6-Part Acceptance Suite
./ml_env/bin/python ml/acceptance_test.py

# 2. Test 4-View Produce Fusion Pipeline
./ml_env/bin/python ml/test_four_views.py

# 3. Test Single Image Inference via CLI
./ml_env/bin/python ml/inference.py --image "dataset/tomato/fresh/freshTomato (1).jpg"

# 4. Evaluate Model Metrics & Confusion Matrix
./ml_env/bin/python ml/evaluate_quality.py
```

---

## 📜 Grading Standards Reference

| Grade | Score Range | Visual Criteria | Mandi Price Rule |
| :---: | :---: | :--- | :--- |
| **A** | **90 – 100** | Premium export quality, vibrant color, zero blemishes | Mandi Base Price $-5$ to Base Price |
| **B** | **75 – 89** | Good commercial market harvest, minor surface marks | Mandi Base Price $-10$ to Base Price $-3$ |
| **C** | **0 – 74** | Discolored, overripe, or visible defect/rot | Discounted clearance pricing (**Below Mandi $-10$**) |

---

## 🛡️ License

This project is licensed under the [MIT License](LICENSE).
