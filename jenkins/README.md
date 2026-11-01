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

### 1. Push the app secrets into SSM Parameter Store

Terraform creates the IAM permissions to *read* `/exxomm/prod/*`, but never
writes the values -- that's deliberately a manual/Jenkins-credentials step,
matching requirement #7 (secrets via Jenkins credentials + IAM roles, not
hardcoded or Terraform state). **This has to happen before `terraform
apply`**, not after: the Mongo EC2's `user_data` reads `mongo_user`/
`mongo_pass`/`mongo_db_name` from SSM at boot to start the `mongo` container
immediately, so if those parameters don't exist yet, that boot script fails
and Mongo never comes up -- silently, since a failed `user_data` script
doesn't fail `terraform apply` itself. Run once (from anywhere with AWS CLI
access and permission to write SSM parameters, e.g. your own machine or the
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

### 2. Apply the Terraform infra

```
cd terraform-infra
terraform init
terraform apply
```

The Jenkinsfile's own **"Read Infra Outputs"** stage reads
`backend_ecr_repository_url`, `frontend_ecr_repository_url`,
`backend_instance_id`, `frontend_instance_id`, and `reverse_proxy_public_ip`
straight from this same Terraform state on every single build (via
`terraform output`) -- nothing to copy by hand, and it can never go stale,
even right after a same-run `Terraform Apply` replaces an instance.

### 3. Jenkins job setup

- Install plugins: **Pipeline**, **Git**. No AWS credentials plugin is
  needed -- the Jenkins EC2's own IAM role (from `terraform-infra`) already
  grants ECR push, SSM deploy, and Terraform-apply permissions, per
  requirement #7.
- Create a Pipeline job pointing at this repo, and set the job's
  **"Script Path"** (under Pipeline > Definition: *Pipeline script from
  SCM*) to `jenkins/Jenkinsfile`, since the file no longer lives at the
  repo root.
- If the GitHub repo is private, add a Jenkins credential (username/PAT or
  SSH key) and select it in the job's SCM configuration.
- The only pipeline parameters left are `AWS_REGION`, `JENKINS_ADMIN_CIDR`
  (your own IP, for direct UI access only), and `FORCE_ALL_STAGES` (set
  `true` for the very first build, since Jenkins has no changelog yet for
  the `changeset` conditions to diff against).
- Add a GitHub webhook pointing at the **reverse-proxy**, not Jenkins
  directly: `http://<reverse-proxy-public-ip>/github-webhook/` (port 80,
  forwarded internally to Jenkins over the private network -- Jenkins'
  own security group never needs to be open to the internet). Enable
  **"GitHub hook trigger for GITScm polling"** in the job's Build Triggers.
  This satisfies the success criterion ("a code commit triggers the
  pipeline and deploys the updated application without manually
  provisioning infrastructure").

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
