# Jenkins — Exxomm CI/CD

This folder covers Jenkins' own role in the project: what it's
triggered by, what it's allowed to do, and how it's allowed to do it.
It doesn't re-explain the infrastructure Jenkins deploys onto — that's
[`terraform-infra/README.md`](../terraform-infra/README.md) — and it
keeps the reasoning brief; the full walkthrough lives in the project
PDF (`docs/docs_ss/project-documentation.html`).

## What Jenkins is here for

One Jenkinsfile (`jenkins/Jenkinsfile`), triggered either by a GitHub
push — forwarded through the reverse-proxy's `/github-webhook/` path,
never hitting Jenkins' own security group directly — or by a manual
"Build with Parameters" click. Every build runs one or both of two
`changeset`-gated flows, so a commit only does the work it actually
touched:

```
                    commit
                       │
            ┌──────────┴──────────┐
            │                     │
   terraform-infra/**        exxomm-be/** or exxomm-fe/**
            │                     │
   fmt → init → validate     validate → test → ECR login
     → plan → [approve]        → build & push → deploy (SSM)
     → apply                     → health check
            │                     │
            └────────┬────────────┘
                      │
            Read Infra Outputs
          (always runs, every build —
         terraform output, never hardcoded)
```

A change to the Jenkinsfile itself runs *both* flows in full,
regardless of `changeset` — a pipeline-logic edit can affect any
stage, and a Jenkinsfile-only commit should never silently report
success having run nothing.

## Permissions — how Jenkins is allowed to do all of this

No AWS access keys are stored in Jenkins anywhere, in any form. The
Jenkins EC2 instance assumes `exxomm-jenkins-role` through its own
instance profile, and every AWS call any stage makes runs under that
one role — Jenkins never has its own separate credentials to leak or
rotate. The role is split into a few focused inline policies rather
than one broad one:

- `AmazonSSMManagedInstanceCore` (AWS-managed) — Session Manager access
  for operators, same as every other instance in this project.
- `exxomm-jenkins-ecr-push` — push/pull to the two ECR repos.
- `exxomm-jenkins-deploy` — `ssm:SendCommand` against the backend and
  frontend instances only, plus read/write on the app's own SSM
  parameter path, for the `Deploy` stage.
- `exxomm-jenkins-terraform` — the newest addition: the exact same
  scoped `ec2:*` / IAM / ECR / SSM / S3-state permissions the original
  bootstrap IAM user had, so the `Terraform Plan`/`Apply` stages can
  run as Jenkins itself, with a human only approving the plan rather
  than typing any credentials in. See `terraform-infra/README.md` for
  why that bootstrap user now sits unused outside of disaster recovery.

## Stages, briefly

| Stage | What it does |
|---|---|
| Checkout | Pulls the repo |
| Terraform Format/Init/Validate/Plan | Standard Terraform checks, plan saved to `tfplan` |
| Approve Infrastructure Changes | Manual `input` gate — a human reads the plan and clicks Approve/Abort |
| Terraform Apply | Applies exactly the reviewed plan |
| Read Infra Outputs | Reads ECR URLs, instance IDs, and the reverse-proxy IP from `terraform output` — always runs |
| Validate / Test | `npm install` and the real Jest/Vitest suites, against source |
| ECR Login / Build & Push | Builds and pushes images tagged `:<build#>` and `:latest` |
| Deploy | Ships the app via AWS SSM Run Command — no SSH anywhere |
| Health Check | Hits `/` and `/api/products` on the live reverse-proxy URL |

## One-time setup

1. Push app secrets to SSM and create the S3 state bucket — both
   covered in `terraform-infra/README.md`, and both have to happen
   **before** the first Terraform apply.
2. Install the **Pipeline** and **Git** plugins — no AWS credentials
   plugin needed, the instance role handles auth.
3. Create a Pipeline job, Script Path set to `jenkins/Jenkinsfile`
   (not the repo root).
4. Add a GitHub webhook pointing at
   `http://<reverse-proxy-public-ip>/github-webhook/`, content type
   `application/json`, "Just the push event," and enable **"GitHub
   hook trigger for GITScm polling"** on the job.
5. Run the first build with `FORCE_ALL_STAGES = true` — Jenkins has no
   changelog yet for `changeset` to diff against.

## Rollback

`:latest` only moves after a successful push, and every build is also
tagged `:<build number>`, so rolling back is re-running the deploy
script by hand with an older tag:

```bash
jenkins/scripts/deploy-via-ssm.sh <BACKEND_INSTANCE_ID> jenkins/scripts/deploy-backend.sh <BACKEND_ECR_REPO>:<old-build-number> ap-south-1
```
