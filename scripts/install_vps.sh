#!/usr/bin/env bash

set -euo pipefail

# One-click installer for VitalLog on a fresh VPS (Ubuntu/Debian/CentOS)
# - Installs Docker
# - Clones/updates repo to /root/bp
# - Generates .env (if missing) and respects pre-set env vars
# - Maps web container to host ${BP_PORT:-18080}
# - Configures host Nginx reverse proxy on port 80 to container

# -----------------------------
# Configurable parameters
# -----------------------------
BP_DOMAIN=${BP_DOMAIN:-bp.llmkc.com}
BP_PORT=${BP_PORT:-18080}
REPO_URL=${REPO_URL:-https://github.com/ETpkAI/bp1.git}
APP_DIR=${APP_DIR:-/root/bp}

# Optional: pre-set GOOGLE_API_KEY via env before running this script
GOOGLE_API_KEY=${GOOGLE_API_KEY:-}

echo "[1/7] Installing Docker if missing..."
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  (systemctl enable docker && systemctl start docker) || (service docker start) || true
fi

echo "[2/7] Preparing application directory ${APP_DIR} ..."
mkdir -p "${APP_DIR%/*}"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch --all
  git -C "$APP_DIR" reset --hard origin/main
else
  rm -rf "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

echo "[3/7] Generating .env if missing..."
if [ ! -f .env ]; then
  JWT_SECRET=$(head -c 32 /dev/urandom | base64 | tr -d "\n=")
  JWT_REFRESH_SECRET=$(head -c 32 /dev/urandom | base64 | tr -d "\n=")
  CORS_ORIGIN_DEFAULT="https://${BP_DOMAIN},http://${BP_DOMAIN}"
  cat > .env <<EOF
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
CORS_ORIGIN=${CORS_ORIGIN:-$CORS_ORIGIN_DEFAULT}
GOOGLE_API_KEY=${GOOGLE_API_KEY}
EOF
  echo "Created .env (GOOGLE_API_KEY empty if not pre-set)."
else
  echo ".env exists. Skipping generation."
fi

echo "[4/7] Mapping web container to host ${BP_PORT}:80 (docker-compose.override.yml) ..."
cat > docker-compose.override.yml <<YAML
services:
  web:
    ports:
      - "${BP_PORT}:80"
YAML

echo "[5/7] Building and starting containers..."
docker compose up -d --build
docker compose ps

echo "[6/7] Installing and configuring host Nginx as reverse proxy on :80 -> 127.0.0.1:${BP_PORT} ..."
if ! command -v nginx >/dev/null 2>&1; then
  (apt-get update -y && apt-get install -y nginx) || (yum -y install nginx)
fi
(systemctl enable nginx && systemctl start nginx) || true
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled || true
cat > /etc/nginx/sites-available/vitallog <<NGINX
server {
  listen 80;
  server_name ${BP_DOMAIN};

  location / {
    proxy_pass http://127.0.0.1:${BP_PORT};
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:${BP_PORT};
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
NGINX
ln -sf /etc/nginx/sites-available/vitallog /etc/nginx/sites-enabled/vitallog
nginx -t && systemctl reload nginx

echo "[7/7] Health check..."
set +e
curl -sS http://127.0.0.1:${BP_PORT}/health || true
set -e

echo
echo "Done. Visit: http://${BP_DOMAIN}/ (or http://<YOUR_IP>/ if DNS not ready)"
echo "If AI analysis fails, set GOOGLE_API_KEY in .env and re-run: docker compose up -d --build"

