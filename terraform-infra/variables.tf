variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "project_name" {
  type    = string
  default = "exxomm"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "azs" {
  description = "Single AZ by default -- matches running Mongo as a plain container rather than a managed multi-AZ DB. Add entries here (and matching subnet CIDRs below) if that ever changes."
  type        = list(string)
  default     = ["ap-south-1a"]
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.1.0/24"]
}

variable "private_app_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.2.0/24"]
}

variable "private_data_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.3.0/24"]
}

variable "instance_type" {
  description = "Backend's instance type."
  type        = string
  default     = "t3.micro"
}

variable "colocate_db_with_backend" {
  description = "TEMPORARY vCPU-quota workaround: true runs Mongo as a container on the backend instance instead of its own EC2. Set back to false once the account's vCPU quota increase is approved."
  type        = bool
  default     = true
}

variable "mongo_instance_type" {
  description = "Mongo's own instance type. t3.micro while the account's vCPU quota increase is pending; frontend/reverse-proxy are downsized to t2.micro in the meantime to make room for it."
  type        = string
  default     = "t3.micro"
}

variable "frontend_instance_type" {
  description = "Frontend's instance type. t2.micro isn't launchable on this account (Free Plan restriction), so this stays t3.micro until the vCPU quota increase is approved."
  type        = string
  default     = "t3.micro"
}

variable "reverse_proxy_instance_type" {
  description = "Reverse-proxy's instance type. t2.micro isn't launchable on this account (Free Plan restriction), so this stays t3.micro until the vCPU quota increase is approved."
  type        = string
  default     = "t3.micro"
}

variable "jenkins_instance_type" {
  type    = string
  default = "t3.small"
}

variable "jenkins_admin_cidr" {
  description = "CIDR allowed to reach the Jenkins UI (port 8080). Tighten to your own IP once known."
  type        = string
  default     = "0.0.0.0/0"
}

variable "backend_port" {
  type    = number
  default = 3000
}

variable "mongo_port" {
  type    = number
  default = 27017
}

variable "terraform_state_bucket" {
  description = "S3 bucket holding the project's own Terraform state, so Jenkins' IAM role can be granted exactly the access it needs to run terraform init/plan/apply against it."
  type        = string
  default     = "exxomm-terraform-state-495392543717"
}

variable "ssm_parameter_prefix" {
  description = "Path prefix under which Jenkins/ops store app secrets in AWS SSM Parameter Store."
  type        = string
  default     = "/exxomm/prod"
}
