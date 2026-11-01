terraform {
  required_version = ">= 1.10"

  backend "s3" {
    bucket       = "exxomm-terraform-state-495392543717"
    key          = "webapp/terraform.tfstate"
    region       = "ap-south-1"
    encrypt      = true
    use_lockfile = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "networking" {
  source = "./modules/networking"

  project_name              = var.project_name
  vpc_cidr                  = var.vpc_cidr
  azs                       = var.azs
  public_subnet_cidrs       = var.public_subnet_cidrs
  private_app_subnet_cidrs  = var.private_app_subnet_cidrs
  private_data_subnet_cidrs = var.private_data_subnet_cidrs
}

module "security" {
  source = "./modules/security"

  project_name       = var.project_name
  vpc_id             = module.networking.vpc_id
  backend_port       = var.backend_port
  mongo_port         = var.mongo_port
  jenkins_admin_cidr = var.jenkins_admin_cidr
}

module "compute" {
  source = "./modules/compute"

  project_name                = var.project_name
  instance_type               = var.instance_type
  colocate_db_with_backend    = var.colocate_db_with_backend
  mongo_instance_type         = var.mongo_instance_type
  frontend_instance_type      = var.frontend_instance_type
  reverse_proxy_instance_type = var.reverse_proxy_instance_type
  jenkins_instance_type       = var.jenkins_instance_type
  backend_port                = var.backend_port
  ssm_parameter_prefix        = var.ssm_parameter_prefix
  terraform_state_bucket      = var.terraform_state_bucket
  public_subnet_id            = module.networking.public_subnet_ids[0]
  private_app_subnet_id       = module.networking.private_app_subnet_ids[0]
  private_data_subnet_id      = module.networking.private_data_subnet_ids[0]
  reverse_proxy_sg_id         = module.security.reverse_proxy_sg_id
  frontend_sg_id              = module.security.frontend_sg_id
  backend_sg_id               = module.security.backend_sg_id
  data_sg_id                  = module.security.data_sg_id
  jenkins_sg_id               = module.security.jenkins_sg_id
}
