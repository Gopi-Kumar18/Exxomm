#!/bin/bash
set -euxo pipefail

apt-get update -y
apt-get install -y docker.io awscli
systemctl enable docker
systemctl start docker

snap install amazon-ssm-agent --classic || true
systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service || true
systemctl start snap.amazon-ssm-agent.amazon-ssm-agent.service || true

# Docker + the SSM agent are ready. Jenkins deploys the actual backend
# container here -- pulling the built image and fetching live secrets from
# AWS SSM Parameter Store at deploy time -- as part of the CI/CD pipeline
# step. This script intentionally stops at "infra ready."
