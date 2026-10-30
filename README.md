# Exxomm: Automated CI/CD Pipeline for a Web Application

This repository provisions AWS infrastructure with Terraform and deploys the Exxomm MERN web application automatically via a Jenkins CI/CD pipeline.

---

## 🎯 Project Objective

Build a pipeline that provisions AWS infrastructure using Terraform and deploys a web application automatically using Jenkins.

**Success criteria:** a code commit triggers the pipeline and deploys the updated application without manually provisioning infrastructure.

---

## 🏗️ Architecture Overview

* **Reverse Proxy (public subnet):** Nginx EC2 instance — the only public entry point. Routes requests to the frontend and backend.
* **Jenkins (public subnet):** CI/CD server — checks out code, builds, tests, and deploys on every commit.
* **Frontend / Backend (app tier):** React frontend and Node/Express backend, containerized with Docker.
* **MongoDB:** runs as a Docker container alongside the backend (no managed database service).
* **Security Groups:** zero-trust model — app servers accept traffic only from the reverse proxy; the reverse proxy is the only instance open to the internet.

See `terraform-infra/` for the Terraform configuration and the architecture diagram for the full network layout.

---

## 🛠️ Technology Stack

| Layer          | Tool              | Purpose                                |
| -------------- | ----------------- | --------------------------------------- |
| Infrastructure | Terraform         | Creates VPC, Subnets, EC2s, EIP, SGs   |
| CI/CD          | Jenkins           | Checkout, build, test, deploy on commit |
| Containers     | Docker            | Packages frontend, backend, and MongoDB |
| Gateway        | Nginx             | Reverse proxy & internal router         |
| Database       | MongoDB           | Containerized data storage              |

---

## ⚙️ Deployment Workflow

### Phase 1 — Provision Infrastructure (Terraform)

Run inside the `terraform-infra/` folder:

```bash
terraform init
terraform plan
terraform apply -auto-approve
```

**Outcome:** VPC, subnets, security groups, and EC2 instances (Reverse Proxy, Jenkins, Frontend, Backend), with an Elastic IP bound to the proxy.

### Phase 2 — Automated Build & Deploy (Jenkins)

The Jenkins pipeline (see `jenkins/Jenkinsfile`) runs on every push to the repository:

1. **Checkout** — pull the latest source from GitHub.
2. **Validate** — lint/sanity checks.
3. **Build** — build Docker images for frontend and backend.
4. **Test** — run application tests.
5. **Deploy** — ship the updated containers to the application EC2 instance.
6. **Verify** — run a health check against the deployed application.

Sensitive values (SSH keys, AWS credentials, app secrets) are stored in Jenkins credentials and AWS IAM roles — never committed to the repository.

---

## 🌐 Traffic Flow Summary

1. User visits the Elastic IP (port 80).
2. The reverse proxy receives and interprets the request.
3. The proxy forwards it internally to the frontend/backend over the private network.
4. Security groups validate that traffic originates from the proxy.
5. The frontend/backend containers serve the request; the backend talks to the MongoDB container.

---

## 📜 License & Credits

Designed and implemented as a comprehensive DevOps project. Replace with your details where needed.
