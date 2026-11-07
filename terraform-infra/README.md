# Terraform — Exxomm Infrastructure

This folder is the whole infrastructure definition: the VPC, every
subnet, every security group, every EC2 instance, the two ECR repos,
the IAM roles, and the one non-secret SSM parameter Terraform owns.
Nothing here deploys the application — that's Jenkins' job, covered in
[`jenkins/README.md`](../jenkins/README.md). This file stays brief on
purpose; the full reasoning behind each decision is in the project PDF
under `docs/docs_ss/project-documentation.html`.

## Layout

```
terraform-infra/
├── main.tf              → calls the three modules below, S3 backend config
├── variables.tf, outputs.tf
└── modules/
    ├── networking/      → VPC, subnets, route tables, IGW, NAT
    ├── security/        → one security group per tier
    └── compute/         → EC2 instances, ECR repos, IAM roles, SSM parameter
```

```
                 ┌──────────────┐
                 │  networking  │  VPC, subnets, routing
                 └──────┬───────┘
                        │ subnet IDs
                 ┌──────▼───────┐
                 │   security   │  SGs (per subnet/tier)
                 └──────┬───────┘
                        │ SG IDs
                 ┌──────▼───────┐
                 │   compute    │  EC2 + ECR + IAM + SSM param
                 └──────────────┘
```

## What it actually provisions

- **VPC** `10.0.0.0/16`, single AZ (`ap-south-1a`) — a public subnet
  (`10.0.1.0/24`, reverse-proxy + Jenkins + NAT) and a private app
  subnet (`10.0.2.0/24`, frontend + backend + the colocated Mongo
  container). A third, private-data CIDR variable still exists for a
  dedicated Mongo instance, gated behind `colocate_db_with_backend`
  (currently `true`) — see that variable's description for why.
- **Security groups**, one per tier, each only accepting traffic from
  the specific SG allowed to reach it — no `0.0.0.0/0` on any port
  except the reverse-proxy's port 80.
- **EC2 instances**: reverse-proxy, jenkins, frontend, backend, and an
  optional (currently `count = 0`) dedicated mongo instance.
- **ECR**: one repo each for the backend and frontend images.
- **IAM**: `exxomm-ec2-role` (shared by frontend/backend — SSM Session
  Manager, ECR pull, read-only access to its own SSM secrets) and
  `exxomm-jenkins-role` (see Permissions below).
- **SSM parameter**: just `mongo_host`, kept in sync automatically on
  every apply with wherever Mongo actually ends up running — the one
  SSM value Terraform is allowed to write.

## State

Remote state in S3 (`terraform_state_bucket` variable), with native
locking (`use_lockfile = true` in the backend block — needs Terraform
≥1.10, no DynamoDB table involved). Both a local run and a Jenkins run
read and write the same state file, so neither one ever thinks the
other's resources are unmanaged.

## Permissions — who's allowed to run `terraform apply`, and how

There are two identities capable of running Terraform against this
project, and only one of them is actually part of the regular flow
today:

- **`terraform-exxomm`** — a plain IAM user, created by hand, with
  access keys configured locally. This existed to solve the obvious
  chicken-and-egg problem: *something* has to create the Jenkins
  instance before Jenkins exists to create anything itself. Scoped to
  `ec2:*`, ECR/SSM/S3-state actions, and IAM role/instance-profile
  management restricted to `exxomm-*` resource names, with
  `iam:PassRole` restricted to `ec2.amazonaws.com` only.
- **`exxomm-jenkins-role`** — the role the Jenkins EC2 instance itself
  assumes via its instance profile. It carries an inline policy,
  `exxomm-jenkins-terraform`, scoped the exact same way as the
  bootstrap user above (same `exxomm-*` restriction, same `PassRole`
  condition), plus read/write access to the S3 state bucket.

In the current setup, every infrastructure change goes through Jenkins
— a commit touching `terraform-infra/**` runs `Terraform Plan`, stops
at a manual approval gate, then runs `Terraform Apply`, all under
`exxomm-jenkins-role`. No access keys are typed or stored anywhere for
this; the EC2 instance profile handles authentication on its own.
That means `terraform-exxomm` isn't part of day-to-day operations
anymore — it's kept around, deactivated rather than deleted, purely as
a break-glass identity for the one scenario Jenkins can't cover itself:
rebuilding everything from nothing if the Jenkins instance is ever
lost.

## Running it directly (bootstrap or recovery only)

```bash
cd terraform-infra
terraform init
terraform plan
terraform apply
```

Push the application secrets to SSM *before* the first apply — the
backend instance's boot script reads them immediately on launch:

```bash
aws ssm put-parameter --region ap-south-1 --type SecureString --name /exxomm/prod/mongo_user    --value "<value>"
aws ssm put-parameter --region ap-south-1 --type SecureString --name /exxomm/prod/mongo_pass    --value "<value>"
aws ssm put-parameter --region ap-south-1 --type SecureString --name /exxomm/prod/mongo_db_name --value "<value>"
aws ssm put-parameter --region ap-south-1 --type SecureString --name /exxomm/prod/jwt_secret    --value "<value>"
```

`mongo_host` is the one exception — Terraform writes that one itself.
