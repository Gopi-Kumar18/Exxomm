#!/bin/bash
# Runs ON the backend EC2 (via SSM Run Command). Pulls the given image from
# ECR using the instance's own IAM role, fetches secrets from SSM Parameter
# Store, and (re)starts the container.
set -euo pipefail

IMAGE="$1"
REGION="ap-south-1"
SSM_PREFIX="/exxomm/prod"

REGISTRY=$(echo "$IMAGE" | cut -d'/' -f1)
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"

docker pull "$IMAGE"

MONGO_USER=$(aws ssm get-parameter --region "$REGION" --name "$SSM_PREFIX/mongo_user" --with-decryption --query Parameter.Value --output text)
MONGO_PASS=$(aws ssm get-parameter --region "$REGION" --name "$SSM_PREFIX/mongo_pass" --with-decryption --query Parameter.Value --output text)
MONGO_DB_NAME=$(aws ssm get-parameter --region "$REGION" --name "$SSM_PREFIX/mongo_db_name" --with-decryption --query Parameter.Value --output text)
MONGO_HOST=$(aws ssm get-parameter --region "$REGION" --name "$SSM_PREFIX/mongo_host" --query Parameter.Value --output text)
JWT_SECRET=$(aws ssm get-parameter --region "$REGION" --name "$SSM_PREFIX/jwt_secret" --with-decryption --query Parameter.Value --output text)

docker stop exxomm-backend 2>/dev/null || true
docker rm exxomm-backend 2>/dev/null || true

docker run -d \
  --name exxomm-backend \
  --restart unless-stopped \
  -e PORT=3000 \
  -e MONGO_USER="$MONGO_USER" \
  -e MONGO_PASS="$MONGO_PASS" \
  -e MONGO_DB_NAME="$MONGO_DB_NAME" \
  -e MONGO_HOST="$MONGO_HOST" \
  -e MONGO_PORT=27017 \
  -e JWT_SECRET="$JWT_SECRET" \
  -p 3000:3000 \
  "$IMAGE"

sleep 5
docker ps --filter "name=exxomm-backend" --filter "status=running" --format "{{.Names}}" | grep -q exxomm-backend
