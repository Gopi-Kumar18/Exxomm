#!/bin/bash
set -euxo pipefail

apt-get update -y
apt-get install -y docker.io awscli
systemctl enable docker
systemctl start docker

snap install amazon-ssm-agent --classic || true
systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service || true
systemctl start snap.amazon-ssm-agent.amazon-ssm-agent.service || true

%{ if colocate_db_with_backend ~}
# TEMPORARY vCPU-quota workaround: Mongo runs right here instead of on its
# own EC2 (see colocate_db_with_backend in modules/compute/variables.tf).
# Same secrets-at-boot pattern as the dedicated mongo instance normally
# uses. Remove this block (set colocate_db_with_backend = false and
# terraform apply) once the account's vCPU quota increase is approved.
PREFIX="${ssm_parameter_prefix}"
REGION="${aws_region}"
MONGO_USER=$(aws ssm get-parameter --region "$REGION" --name "$PREFIX/mongo_user" --with-decryption --query Parameter.Value --output text)
MONGO_PASS=$(aws ssm get-parameter --region "$REGION" --name "$PREFIX/mongo_pass" --with-decryption --query Parameter.Value --output text)
MONGO_DB_NAME=$(aws ssm get-parameter --region "$REGION" --name "$PREFIX/mongo_db_name" --with-decryption --query Parameter.Value --output text)

docker volume create exxomm_db_volume

docker run -d \
  --name mongo \
  --restart unless-stopped \
  -e MONGO_INITDB_ROOT_USERNAME="$MONGO_USER" \
  -e MONGO_INITDB_ROOT_PASSWORD="$MONGO_PASS" \
  -e MONGO_INITDB_DATABASE="$MONGO_DB_NAME" \
  -v exxomm_db_volume:/data/db \
  -p 27017:27017 \
  mongo:latest
%{ endif ~}

# Docker + the SSM agent are ready. Jenkins deploys the actual backend
# container here -- pulling the built image and fetching live secrets from
# AWS SSM Parameter Store at deploy time -- as part of the CI/CD pipeline
# step. This script intentionally stops at "infra ready."
