#!/usr/bin/env bash
# ==============================================================================
# Uzhavan Bazaar — Free SSL / HTTPS Setup via Certbot (Let's Encrypt)
# Domain: uzhavan-bazzar.duckdns.org
# ==============================================================================
set -e

DOMAIN=${1:-"uzhavan-bazzar.duckdns.org"}
EMAIL=${2:-""}

echo "=========================================="
echo "Configuring SSL for: $DOMAIN"
echo "=========================================="

# Check DNS resolution
RESOLVED_IP=$(dig +short "$DOMAIN" | tail -n1)
echo "Domain $DOMAIN currently resolves to: $RESOLVED_IP"

MY_IP=$(curl -s http://checkip.amazonaws.com || curl -s https://ipinfo.io/ip)
echo "Current EC2 Public IP: $MY_IP"

if [ "$RESOLVED_IP" != "$MY_IP" ]; then
  echo ""
  echo "⚠️ WARNING: $DOMAIN does not yet point to this server ($MY_IP)."
  echo "It currently points to $RESOLVED_IP."
  echo "Please update your DuckDNS IP on https://www.duckdns.org to $MY_IP before obtaining the SSL certificate."
  echo ""
fi

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
  echo "Installing certbot..."
  if command -v dnf &> /dev/null; then
    sudo dnf install -y certbot
  elif command -v apt-get &> /dev/null; then
    sudo apt-get update -y && sudo apt-get install -y certbot
  fi
fi

# Stop frontend temporarily to free port 80 for standalone certificate challenge
echo "Stopping frontend container temporarily..."
sudo docker-compose stop frontend || true

# Obtain Certificate
echo "Requesting Let's Encrypt SSL certificate for $DOMAIN..."
if [ -n "$EMAIL" ]; then
  sudo certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"
else
  sudo certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email
fi

if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "✓ Certificate successfully generated at /etc/letsencrypt/live/$DOMAIN/"
  
  # Copy SSL nginx configuration
  cp nginx-ssl.conf nginx.conf
  
  # Update docker-compose to mount certs and expose port 443
  cat << 'EOF' > docker-compose.yml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    image: uzhavan-bazzar-backend:latest
    container_name: uzhavan-ml-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - ./ml/data:/app/ml/data
    environment:
      - PYTHONUNBUFFERED=1
      - PORT=8000
    networks:
      - uzhavan-network
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    image: uzhavan-bazzar-frontend:latest
    container_name: uzhavan-frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - uzhavan-network
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://localhost/ || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

networks:
  uzhavan-network:
    driver: bridge
EOF

  echo "Rebuilding and starting frontend container with SSL..."
  sudo docker-compose up -d --build frontend
  echo ""
  echo "==========================================================="
  echo "🎉 SSL is now active!"
  echo "Access the app securely at: https://$DOMAIN"
  echo "Ensure AWS Security Group allows inbound port 443 (HTTPS)."
  echo "==========================================================="
else
  echo "❌ Certificate generation failed. Restarting frontend..."
  sudo docker-compose start frontend
fi
