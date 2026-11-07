# Exxomm — Automated CI/CD Pipeline for a Web Application on AWS

This repository provisions AWS infrastructure with **Terraform** and
delivers the Exxomm MERN web application with a **Jenkins** CI/CD
pipeline. Application source, Terraform configuration, and the
Jenkinsfile all live in this one GitHub repository.

**Full documentation (architecture, workflows, screenshots, setup,
known limitations):**
[`docs/docs_ss/project-documentation.html`](docs/docs_ss/project-documentation.html)
— open it in a browser, or print it to PDF.

This file just orients you around the repo. For the two moving parts
specifically:

- **Terraform** — what it provisions and how it gets permission to do
  so: [`terraform-infra/README.md`](terraform-infra/README.md)
- **Jenkins** — what triggers it, what it's allowed to do, and how:
  [`jenkins/README.md`](jenkins/README.md)

---

## Repository layout

```
Exxomm-Devops-Automation/
├── README.md                      ← this file
├── docker-compose.yml             ← local dev only, not used by Jenkins
├── docs/
│   ├── architecture-diagram.html
│   └── docs_ss/
│       └── project-documentation.html   ← the full writeup + real screenshots
├── exxomm-be/                     ← Node/Express backend + Jest tests
├── exxomm-fe/                     ← React frontend + Vitest tests
├── jenkins/
│   ├── Jenkinsfile                ← the one pipeline, both flows
│   ├── README.md                  ← Jenkins' own role, permissions, stages
│   └── scripts/                   ← deploy-via-ssm.sh, deploy-backend.sh, deploy-frontend.sh, health-check.sh
└── terraform-infra/
    ├── README.md                  ← what Terraform provisions, permissions
    ├── main.tf, variables.tf, outputs.tf
    ├── terraform.tfvars.example
    └── modules/
        ├── networking/  (VPC, subnets, route tables — the required module)
        ├── security/    (all security groups)
        └── compute/     (EC2 instances, ECR, IAM roles, SSM parameter)
```

For anything beyond "where is it" — architecture, workflows, setup
steps, IAM permissions, known tradeoffs — see the full PDF/HTML doc or
the two component READMEs linked above.
