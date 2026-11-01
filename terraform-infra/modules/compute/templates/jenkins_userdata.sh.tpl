#!/bin/bash
set -euxo pipefail

apt-get update -y
# Jenkins requires a newer JDK than the LTS release names suggest -- verified
# working: openjdk-21-jre (Jenkins 2.580.x requires Java 21 or 25 as of
# 2026-10-31). Bump this if a future Jenkins release raises the minimum again.
apt-get install -y fontconfig openjdk-21-jre docker.io awscli unzip

systemctl enable docker
systemctl start docker

# Terraform for the pipeline's own Terraform Init/Plan/Apply stages.
curl -fsSL https://releases.hashicorp.com/terraform/1.16.5/terraform_1.16.5_linux_amd64.zip -o /tmp/terraform.zip
unzip -o /tmp/terraform.zip -d /usr/local/bin
rm -f /tmp/terraform.zip

snap install amazon-ssm-agent --classic || true
systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service || true
systemctl start snap.amazon-ssm-agent.amazon-ssm-agent.service || true

# Jenkins rotates this signing key yearly under a dated filename (verified
# working: jenkins.io-2026.key as of 2026-10-31) -- bump the year here if a
# future replace of this instance hits "NO_PUBKEY" / "not signed" apt errors.
install -d -m 0755 /etc/apt/keyrings
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key -o /etc/apt/keyrings/jenkins-keyring.asc
echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | tee /etc/apt/sources.list.d/jenkins.list > /dev/null

apt-get update -y
apt-get install -y jenkins

# Jenkins runs as the "jenkins" user and needs to run docker build/push.
usermod -aG docker jenkins

systemctl enable jenkins
systemctl restart jenkins
