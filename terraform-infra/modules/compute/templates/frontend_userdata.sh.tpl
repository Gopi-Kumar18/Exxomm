#!/bin/bash
set -euxo pipefail

apt-get update -y
apt-get install -y docker.io
systemctl enable docker
systemctl start docker

snap install amazon-ssm-agent --classic || true
systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service || true
systemctl start snap.amazon-ssm-agent.amazon-ssm-agent.service || true

# Docker + the SSM agent are ready. Jenkins deploys the actual frontend
# container here as part of the CI/CD pipeline step. This script
# intentionally stops at "infra ready."
