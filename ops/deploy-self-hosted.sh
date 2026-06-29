#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/orbi/Orbi-Shop-Platform-Infrastructure-V1.0.0.7}"
ENV_FILE="${ENV_FILE:-/etc/orbi/shop.env}"
IMAGE_NAME="${IMAGE_NAME:-orbi-shop}"
CONTAINER_NAME="${CONTAINER_NAME:-orbi-shop}"
HOST_PORT="${HOST_PORT:-3000}"
CONTAINER_PORT="${CONTAINER_PORT:-3000}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:${HOST_PORT}/api/health}"

echo "Deploying ORBI Shop from ${APP_DIR}"

if [ ! -d "${APP_DIR}/.git" ]; then
  echo "Repository not found at ${APP_DIR}."
  echo "Clone it first:"
  echo "  sudo mkdir -p /opt/orbi"
  echo "  sudo git clone https://github.com/adminorbi-gif/Orbi-Shop-Platform-Infrastructure-V1.0.0.7.git ${APP_DIR}"
  exit 1
fi

if [ ! -f "${ENV_FILE}" ]; then
  echo "Missing production env file: ${ENV_FILE}"
  echo "Create it from your secured Orbi-Shop-Platform-Infrastructure.env, then run:"
  echo "  sudo chmod 600 ${ENV_FILE}"
  exit 1
fi

cd "${APP_DIR}"

echo "Pulling latest main..."
git fetch origin main
git pull --ff-only origin main

if sudo docker image inspect "${IMAGE_NAME}:latest" >/dev/null 2>&1; then
  echo "Saving current image as ${IMAGE_NAME}:rollback..."
  sudo docker tag "${IMAGE_NAME}:latest" "${IMAGE_NAME}:rollback"
fi

echo "Building ${IMAGE_NAME}:latest..."
sudo docker build -t "${IMAGE_NAME}:latest" .

echo "Replacing ${CONTAINER_NAME}..."
sudo docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
sudo docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart unless-stopped \
  --env-file "${ENV_FILE}" \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  "${IMAGE_NAME}:latest"

echo "Waiting for health check at ${HEALTH_URL}..."
for attempt in $(seq 1 30); do
  if curl -fsS "${HEALTH_URL}" >/dev/null; then
    echo "ORBI Shop is healthy."
    sudo docker ps --filter "name=${CONTAINER_NAME}"
    exit 0
  fi
  echo "Health check not ready yet (${attempt}/30)."
  sleep 2
done

echo "ORBI Shop did not become healthy. Recent logs:"
sudo docker logs --tail 120 "${CONTAINER_NAME}" || true
exit 1
