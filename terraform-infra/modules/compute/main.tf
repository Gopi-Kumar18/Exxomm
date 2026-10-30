data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# --- IAM: SSM Session Manager access (no SSH/bastion) + read-only access to
# this project's secrets in AWS SSM Parameter Store. ---
resource "aws_iam_role" "ec2" {
  name = "${var.project_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy" "read_app_secrets" {
  name = "${var.project_name}-read-ssm-secrets"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ssm:GetParameter", "ssm:GetParametersByPath"]
      Resource = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${var.ssm_parameter_prefix}/*"
    }]
  })
}

# Lets the app-tier instances pull the images Jenkins pushes to ECR.
resource "aws_iam_role_policy" "ecr_pull" {
  name = "${var.project_name}-ecr-pull"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "ecr:GetAuthorizationToken"
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchCheckLayerAvailability",
        ]
        Resource = [
          aws_ecr_repository.backend.arn,
          aws_ecr_repository.frontend.arn,
        ]
      },
    ]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# --- ECR: where Jenkins pushes built images, and the app tier pulls from ---
resource "aws_ecr_repository" "backend" {
  name                 = "${var.project_name}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "${var.project_name}-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# --- IAM for Jenkins: build/push to ECR, deploy to the app tier over SSM
# Run Command (no SSH), and write app secrets into SSM Parameter Store
# (the credentials themselves come from Jenkins credentials, not Terraform). ---
resource "aws_iam_role" "jenkins" {
  name = "${var.project_name}-jenkins-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "jenkins_ssm_core" {
  role       = aws_iam_role.jenkins.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy" "jenkins_ecr_push" {
  name = "${var.project_name}-jenkins-ecr-push"
  role = aws_iam_role.jenkins.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "ecr:GetAuthorizationToken"
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchCheckLayerAvailability",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
        ]
        Resource = [
          aws_ecr_repository.backend.arn,
          aws_ecr_repository.frontend.arn,
        ]
      },
    ]
  })
}

resource "aws_iam_role_policy" "jenkins_deploy" {
  name = "${var.project_name}-jenkins-deploy"
  role = aws_iam_role.jenkins.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["ssm:SendCommand"]
        Resource = [
          aws_instance.backend.arn,
          aws_instance.frontend.arn,
          "arn:aws:ssm:${data.aws_region.current.name}::document/AWS-RunShellScript",
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["ssm:GetCommandInvocation", "ssm:ListCommandInvocations"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["ssm:PutParameter", "ssm:GetParameter", "ssm:GetParametersByPath"]
        Resource = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${var.ssm_parameter_prefix}/*"
      },
    ]
  })
}

resource "aws_iam_instance_profile" "jenkins" {
  name = "${var.project_name}-jenkins-profile"
  role = aws_iam_role.jenkins.name
}

# Non-secret: kept in sync with the Mongo instance's actual private IP on
# every apply, so a redeploy never has to remember to update it by hand.
resource "aws_ssm_parameter" "mongo_host" {
  name  = "${var.ssm_parameter_prefix}/mongo_host"
  type  = "String"
  value = aws_instance.mongo.private_ip
}

# --- Data tier: self-hosted Mongo container on its own EC2 ---
resource "aws_instance" "mongo" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = var.private_data_subnet_id
  vpc_security_group_ids = [var.data_sg_id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = templatefile("${path.module}/templates/mongo_userdata.sh.tpl", {
    ssm_parameter_prefix = var.ssm_parameter_prefix
  })

  tags = {
    Name = "${var.project_name}-mongo"
    Role = "data"
  }
}

# --- App tier: backend ---
resource "aws_instance" "backend" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = var.private_app_subnet_id
  vpc_security_group_ids = [var.backend_sg_id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  user_data = file("${path.module}/templates/backend_userdata.sh.tpl")

  tags = {
    Name = "${var.project_name}-backend"
    Role = "backend"
  }
}

# --- App tier: frontend ---
resource "aws_instance" "frontend" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = var.private_app_subnet_id
  vpc_security_group_ids = [var.frontend_sg_id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  user_data = file("${path.module}/templates/frontend_userdata.sh.tpl")

  tags = {
    Name = "${var.project_name}-frontend"
    Role = "frontend"
  }
}

# --- Public tier: the real AWS reverse proxy (dedicated EC2 + real nginx).
# This replaces the container-embedded nginx used only for local
# docker-compose testing -- in production this instance is the single
# entry point and is the thing that proxies to frontend/backend. ---
resource "aws_instance" "reverse_proxy" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = var.public_subnet_id
  vpc_security_group_ids      = [var.reverse_proxy_sg_id]
  associate_public_ip_address = true
  iam_instance_profile        = aws_iam_instance_profile.ec2.name

  user_data = templatefile("${path.module}/templates/reverse_proxy_userdata.sh.tpl", {
    frontend_private_ip = aws_instance.frontend.private_ip
    backend_private_ip  = aws_instance.backend.private_ip
    backend_port        = var.backend_port
  })

  tags = {
    Name = "${var.project_name}-reverse-proxy"
    Role = "reverse-proxy"
  }
}

resource "aws_eip" "reverse_proxy" {
  instance = aws_instance.reverse_proxy.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-reverse-proxy-eip"
  }
}

# --- Public tier: Jenkins CI/CD server ---
resource "aws_instance" "jenkins" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.jenkins_instance_type
  subnet_id                   = var.public_subnet_id
  vpc_security_group_ids      = [var.jenkins_sg_id]
  associate_public_ip_address = true
  iam_instance_profile        = aws_iam_instance_profile.jenkins.name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = file("${path.module}/templates/jenkins_userdata.sh.tpl")

  tags = {
    Name = "${var.project_name}-jenkins"
    Role = "cicd"
  }
}

resource "aws_eip" "jenkins" {
  instance = aws_instance.jenkins.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-jenkins-eip"
  }
}
