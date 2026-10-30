#!/bin/bash
set -euxo pipefail

apt-get update -y
apt-get install -y fontconfig openjdk-17-jre docker.io awscli

systemctl enable docker
systemctl start docker

snap install amazon-ssm-agent --classic || true
systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service || true
systemctl start snap.amazon-ssm-agent.amazon-ssm-agent.service || true

curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | tee /etc/apt/sources.list.d/jenkins.list > /dev/null

apt-get update -y
apt-get install -y jenkins

# Jenkins runs as the "jenkins" user and needs to run docker build/push.
usermod -aG docker jenkins

systemctl enable jenkins
systemctl restart jenkins
