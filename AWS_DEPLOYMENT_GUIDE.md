# 🌾 Uzhavan Bazaar — Complete AWS Deployment Guide

This guide walks you through deploying the complete **Uzhavan Bazaar** platform (React Frontend + FastAPI ML Inference Backend) on **Amazon Web Services (AWS)** using Docker Compose and Nginx.

---

## Architecture Overview

```
                      Internet / Farmers / Buyers
                                  │
                                  ▼
                     [ AWS EC2 / Lightsail VM ]
           ┌──────────────────────────────────────────────┐
           │                                              │
           │  Port 80 / 443                               │
           │  ┌────────────────────────────────────────┐  │
           │  │   uzhavan-frontend (Nginx Container)   │  │
           │  │   • Serves React SPA Production Build  │  │
           │  │   • Gzip Compression & Static Cache    │  │
           │  │   • Reverse Proxies /api/ to Backend   │  │
           │  └──────────────────┬─────────────────────┘  │
           │                     │                        │
           │  Internal Network   │ proxy_pass             │
           │  (uzhavan-network)  ▼                        │
           │  ┌────────────────────────────────────────┐  │
           │  │   uzhavan-ml-backend (FastAPI / PyTorch)│ │
           │  │   • YOLOv8 Produce Detection           │  │
           │  │   • CNN Quality Grading Model          │  │
           │  │   • 4-View Fusion & Mandi Engine       │  │
           │  │   • Port 8000                          │  │
           │  └──────────────────┬─────────────────────┘  │
           │                     │                        │
           │  Data Volume        ▼                        │
           │  [ ./ml/data (Persistent Products DB) ]     │
           │                                              │
           └──────────────────────────────────────────────┘
                                  │
                                  ▼
                   Firebase Cloud Firestore & Storage
                 (User Profiles, Cattle Listings, Auth)
```

---

## Step 1: Launch an AWS EC2 Instance

1. Log into your **AWS Management Console** and navigate to **EC2**.
2. Select **Launch Instance**.
3. Choose the instance details:
   - **Name**: `uzhavan-bazzar-production`
   - **Region**: Select `ap-south-1` (Mumbai) for lowest latency in Tamil Nadu and India.
   - **Operating System (AMI)**: **Ubuntu Server 24.04 LTS** or **Ubuntu Server 22.04 LTS** (64-bit x86).
   - **Instance Type**:
     - **CPU-Optimized (Recommended & Cost-Effective)**: `t3.large` (2 vCPU, 8 GB RAM) or `c5.xlarge` (4 vCPU, 8 GB RAM) — runs inference in <0.3s.
     - **GPU-Accelerated (Maximum Inference Speed)**: `g4dn.xlarge` (4 vCPU, 16 GB RAM, 1 NVIDIA T4 GPU 16GB).
   - **Key Pair**: Select or create a new `.pem` key pair (e.g. `uzhavan-key.pem`).
   - **Storage**: Set root volume to **40 GiB** (gp3 SSD).

---

## Step 2: Configure Security Group Inbound Rules

In the **Network settings** step (or under **EC2 > Security Groups**), ensure these inbound ports are open:

| Type | Protocol | Port Range | Source | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **SSH** | TCP | `22` | `My IP` (or `0.0.0.0/0`) | Secure Terminal Access |
| **HTTP** | TCP | `80` | `0.0.0.0/0` | Public Web Traffic |
| **HTTPS** | TCP | `443` | `0.0.0.0/0` | Secure SSL Traffic |
| **Custom TCP** *(Optional)* | TCP | `8000` | `0.0.0.0/0` | Direct FastAPI Swagger Docs |

Click **Launch Instance**.

---

## Step 3: Connect to your EC2 Instance

Open your local terminal and connect via SSH:

```bash
# Set secure permissions on your key
chmod 400 uzhavan-key.pem

# Connect to EC2 (replace with your instance's Public IPv4 address)
ssh -i "uzhavan-key.pem" ubuntu@<YOUR-EC2-PUBLIC-IP>
```

---

## Step 4: Transfer Code to EC2

### Option A: Via Git (Recommended)
```bash
git clone https://github.com/<your-username>/uzhavan-bazzar.git
cd uzhavan-bazzar
```

### Option B: Via `rsync` from your local machine
From your local project folder:
```bash
rsync -avz --exclude 'node_modules' --exclude 'ml_env' --exclude '.git' \
  -e "ssh -i uzhavan-key.pem" ./ ubuntu@<YOUR-EC2-PUBLIC-IP>:~/uzhavan-bazzar
```
Then on the EC2 instance:
```bash
cd ~/uzhavan-bazzar
```

---

## Step 5: Run the 1-Click Automated Deployment Script

Execute the included deployment script:

```bash
chmod +x deploy-aws.sh
./deploy-aws.sh
```

### What `deploy-aws.sh` does automatically:
1. Installs Docker and Docker Compose Plugin.
2. Checks for NVIDIA GPU hardware and configures NVIDIA Container Toolkit if present.
3. Prepares persistent data volumes in `ml/data`.
4. Builds the optimized frontend container (Node.js 20 build $\rightarrow$ Nginx) and backend ML container.
5. Launches all services with `restart: unless-stopped`.
6. Performs self-health checks on `http://localhost:8000/health`.

Once finished, it will print your live URLs:
- **🌐 Web Application**: `http://<YOUR-EC2-PUBLIC-IP>/`
- **🚀 ML API Documentation**: `http://<YOUR-EC2-PUBLIC-IP>:8000/docs`
- **🩺 Healthcheck**: `http://<YOUR-EC2-PUBLIC-IP>/health`

---

## Step 6: (Optional) Set Up Free HTTPS / SSL with Let's Encrypt

If you have mapped a custom domain (e.g., `uzhavanbazzar.com` or `app.uzhavanbazzar.com`) to your EC2 Public IP via AWS Route 53 or your DNS registrar:

```bash
chmod +x setup-ssl.sh
./setup-ssl.sh yourdomain.com your-email@example.com
```

This issues a free SSL certificate from Let's Encrypt and enables HTTPS.

---

## Managing Your Deployed Application

| Action | Command |
| :--- | :--- |
| **Check container status** | `docker compose ps` |
| **View real-time logs** | `docker compose logs -f` |
| **View ML backend logs** | `docker compose logs -f backend` |
| **View Nginx frontend logs** | `docker compose logs -f frontend` |
| **Restart services** | `docker compose restart` |
| **Update code & redeploy** | `git pull && docker compose up -d --build` |
| **Stop application** | `docker compose down` |

---

## Alternative: Deploying on AWS Lightsail (Budget Option)

If you prefer fixed, budget pricing ($10 - $20/month):
1. Go to **AWS Lightsail Console** $\rightarrow$ **Create instance**.
2. Select **OS Only** $\rightarrow$ **Ubuntu 22.04 LTS**.
3. Select the **$10/month (2 GB RAM, 1 vCPU)** or **$20/month (4 GB RAM, 2 vCPU)** plan.
4. Under **Networking**, open ports `80`, `443`, and `8000`.
5. Connect using the browser SSH terminal and run:
   ```bash
   git clone <your-repo> && cd <your-repo>
   chmod +x deploy-aws.sh && ./deploy-aws.sh
   ```
