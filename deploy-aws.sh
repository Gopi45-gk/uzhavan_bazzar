#!/usr/bin/env bash
# ==============================================================================
# Uzhavan Bazaar — One-Click AWS EC2 / Lightsail Deployment Script
# ==============================================================================
# Usage:
#   chmod +x deploy-aws.sh
#   ./deploy-aws.sh
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${GREEN}🌾 UZHAVAN BAZAAR — AWS DEPLOYMENT INITIALIZER 🌾${NC}"
echo -e "${BLUE}=====================================================${NC}"

# 1. Detect Environment & Privileges
IS_ROOT=false
if [ "$EUID" -eq 0 ]; then
  IS_ROOT=true
  SUDO=""
else
  SUDO="sudo"
fi

# 2. Install Docker & Docker Compose if missing
if ! command -v docker &> /dev/null; then
  echo -e "\n${YELLOW}[1/5] Docker not found. Installing Docker engine...${NC}"
  if command -v apt-get &> /dev/null; then
    $SUDO apt-get update -y
    $SUDO apt-get install -y ca-certificates curl gnupg lsb-release
    $SUDO mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | $SUDO gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | $SUDO tee /etc/apt/sources.list.d/docker.list > /dev/null
    $SUDO apt-get update -y
    $SUDO apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  elif command -v dnf &> /dev/null; then
    # Amazon Linux 2023 or RHEL
    $SUDO dnf install -y docker
    $SUDO systemctl enable --now docker
  elif command -v yum &> /dev/null; then
    # Amazon Linux 2
    $SUDO amazon-linux-extras install docker -y || $SUDO yum install -y docker
    $SUDO systemctl enable --now docker
  fi

  # Start and enable Docker service
  $SUDO systemctl start docker || true
  $SUDO systemctl enable docker || true

  # Add current user to docker group
  if [ "$IS_ROOT" = false ]; then
    $SUDO usermod -aG docker "$USER" || true
    echo -e "${GREEN}✓ Docker installed successfully.${NC}"
  fi
else
  echo -e "\n${GREEN}[1/5] Docker is already installed: $(docker --version)${NC}"
fi

# 3. Detect NVIDIA GPU for Hardware Acceleration
echo -e "\n${BLUE}[2/5] Checking GPU hardware...${NC}"
if command -v nvidia-smi &> /dev/null; then
  echo -e "${GREEN}✓ NVIDIA GPU detected:${NC}"
  nvidia-smi --query-gpu=name,memory.total --format=csv,noheader || true
else
  echo -e "${YELLOW}ℹ No NVIDIA GPU detected. Running in high-performance CPU inference mode.${NC}"
fi

# 4. Prepare Directories and Data Volumes
echo -e "\n${BLUE}[3/5] Setting up persistent directories...${NC}"
mkdir -p ml/data
chmod -R 777 ml/data || true

# 5. Build and Launch Containers via Docker Compose
echo -e "\n${BLUE}[4/5] Building and launching containers...${NC}"

# Detect docker compose syntax
if docker compose version &> /dev/null; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE="docker-compose"
else
  DOCKER_COMPOSE="$SUDO docker compose"
fi

# Pull/Build images and run in background
$DOCKER_COMPOSE up -d --build

# 6. Verify Deployment Health
echo -e "\n${BLUE}[5/5] Verifying application health...${NC}"
echo "Waiting for services to initialize..."

MAX_RETRIES=15
COUNTER=0
HEALTHY=false

while [ $COUNTER -lt $MAX_RETRIES ]; do
  sleep 4
  COUNTER=$((COUNTER+1))
  
  if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    HEALTHY=true
    break
  else
    echo -n "."
  fi
done
echo ""

PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || curl -s https://ifconfig.me || echo "<YOUR-EC2-PUBLIC-IP>")

if [ "$HEALTHY" = true ]; then
  echo -e "\n${GREEN}=====================================================${NC}"
  echo -e "${GREEN}🎉 UZHAVAN BAZAAR DEPLOYED SUCCESSFULLY ON AWS! 🎉${NC}"
  echo -e "${GREEN}=====================================================${NC}"
  echo -e "\nAccess your deployed platform:"
  echo -e "  🌐 Web Application: ${GREEN}http://${PUBLIC_IP}/${NC}"
  echo -e "  🚀 ML Backend API:  ${GREEN}http://${PUBLIC_IP}:8000/docs${NC}"
  echo -e "  🩺 Health Endpoint:  ${GREEN}http://${PUBLIC_IP}/health${NC}"
  echo -e "\nHelpful Docker Commands:"
  echo -e "  View logs:          ${BLUE}$DOCKER_COMPOSE logs -f${NC}"
  echo -e "  Check status:       ${BLUE}$DOCKER_COMPOSE ps${NC}"
  echo -e "  Restart services:   ${BLUE}$DOCKER_COMPOSE restart${NC}"
  echo -e "  Stop application:   ${BLUE}$DOCKER_COMPOSE down${NC}"
else
  echo -e "\n${YELLOW}Services started. Please verify logs using: $DOCKER_COMPOSE logs -f${NC}"
  echo -e "Public URL: http://${PUBLIC_IP}/"
fi
