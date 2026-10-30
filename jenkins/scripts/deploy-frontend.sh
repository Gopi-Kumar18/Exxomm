#!/bin/bash
# Runs ON the frontend EC2 (via SSM Run Command). Pulls the given image from
# ECR using the instance's own IAM role and (re)starts the container. The
# frontend serves static files only -- /api traffic never reaches it, the
# real reverse-proxy EC2 sends that straight to the backend.
set -euo pipefail

IMAGE="$1"
REGION="ap-south-1"

REGISTRY=$(echo "$IMAGE" | cut -d'/' -f1)
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"

docker pull "$IMAGE"

docker stop exxomm-frontend 2>/dev/null || true
docker rm exxomm-frontend 2>/dev/null || true

docker run -d \
  --name exxomm-frontend \
  --restart unless-stopped \
  -p 80:80 \
  "$IMAGE"

sleep 5
docker ps --filter "name=exxomm-frontend" --filter "status=running" --format "{{.Names}}" | grep -q exxomm-frontend
