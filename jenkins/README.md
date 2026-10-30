# CI/CD pipeline

`jenkins/Jenkinsfile` builds, tests, and deploys Exxomm on every commit,
onto the infrastructure `terraform-infra/` already provisioned. Terraform
never re-runs as part of this pipeline -- it provisions the VPC/EC2s/ECR
repos once, and Jenkins only ever builds/tests/deploys the application onto
them.

## Pipeline stages

1. **Checkout** -- pulls the commit that triggered the build.
2. **Validate** -- `npm install` for both apps (no lint script exists yet in
   either `package.json`, so this is a dependency-resolution sanity check).
3. **Test** -- runs the real Jest (`exxomm-be`) and Vitest (`exxomm-fe`)
   suites against source, before anything is built or pushed.
4. **Build & Push** -- builds the production Docker images and pushes them
   to ECR, tagged `:<build number>` and `:latest`.
5. **Deploy** -- sends the deploy scripts under `jenkins/scripts/` to the
   backend/frontend EC2 instances via **AWS SSM Run Command** (no SSH, no
   bastion). Each instance's own IAM role pulls from ECR and reads its
   secrets from SSM Parameter Store itself -- Jenkins never handles the
   actual secret values.
6. **Health Check** -- hits the real reverse-proxy EC2's public IP for `/`
   and `/api/products` and fails the build if either doesn't return `200`.

## One-time setup

### 1. Apply the Terraform infra

```
cd terraform-infra
terraform init
terraform apply
```

Keep the outputs handy -- they feed the pipeline parameters below:
`backend_ecr_repository_url`, `frontend_ecr_repository_url`,
`backend_instance_id`, `frontend_instance_id`, `reverse_proxy_public_ip`.

### 2. Push the app secrets into SSM Parameter Store

Terraform creates the IAM permissions to *read* `/exxomm/prod/*`, but never
writes the values -- that's deliberately a manual/Jenkins-credentials step,
matching requirement #7 (secrets via Jenkins credentials + IAM roles, not
hardcoded or Terraform state). Run once (from anywhere with AWS CLI access
and permission to write SSM parameters, e.g. your own machine or the
Jenkins box itself):

```bash
aws ssm put-parameter --region ap-south-1 --type SecureString --name /exxomm/prod/mongo_user     --value "<your-mongo-user>"
aws ssm put-parameter --region ap-south-1 --type SecureString --name /exxomm/prod/mongo_pass     --value "<your-mongo-pass>"
aws ssm put-parameter --region ap-south-1 --type SecureString --name /exxomm/prod/mongo_db_name  --value "<your-db-name>"
aws ssm put-parameter --region ap-south-1 --type SecureString --name /exxomm/prod/jwt_secret     --value "<a-long-random-secret>"
```

`/exxomm/prod/mongo_host` is written automatically by Terraform (it's just
the Mongo EC2's private IP, not a secret) and kept in sync on every
`terraform apply`.

### 3. Jenkins job setup

- Install plugins: **Pipeline**, **Git**. No AWS credentials plugin is
  needed -- the Jenkins EC2's own IAM role (from `terraform-infra`) already
  grants ECR push and SSM deploy permissions, per requirement #7.
- Create a Pipeline job pointing at this repo, and set the job's
  **"Script Path"** (under Pipeline > Definition: *Pipeline script from
  SCM*) to `jenkins/Jenkinsfile`, since the file no longer lives at the
  repo root.
- If the GitHub repo is private, add a Jenkins credential (username/PAT or
  SSH key) and select it in the job's SCM configuration.
- Fill in the job's pipeline parameters (or set defaults in the job config)
  from the Terraform outputs in step 1:
  `BACKEND_ECR_REPO`, `FRONTEND_ECR_REPO`, `BACKEND_INSTANCE_ID`,
  `FRONTEND_INSTANCE_ID`, `REVERSE_PROXY_URL` (as `http://<ip>`).
- Add a GitHub webhook (`http://<jenkins-public-ip>:8080/github-webhook/`)
  so a commit triggers the pipeline automatically, per the success
  criterion ("a code commit triggers the pipeline and deploys the updated
  application without manually provisioning infrastructure").

## Rollback

`:latest` in ECR only moves after a successful push, and every build is
also tagged `:<build number>`. To roll back, re-run the **Deploy** stage
logic manually with an older tag:

```bash
jenkins/scripts/deploy-via-ssm.sh <BACKEND_INSTANCE_ID> jenkins/scripts/deploy-backend.sh <BACKEND_ECR_REPO>:<old-build-number> ap-south-1
```

## Known limitation

The reverse-proxy EC2's nginx config is rendered once, at boot, from the
frontend/backend instances' private IPs at `terraform apply` time. If
either instance is ever replaced (not just redeployed via this pipeline,
which reuses the same instance), the reverse proxy needs re-provisioning
too. Given the current scope (single long-lived instance per tier, no
auto-scaling), this is an accepted tradeoff for simplicity.
