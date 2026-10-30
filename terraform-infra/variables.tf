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
  type    = string
  default = "t3.micro"
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

variable "ssm_parameter_prefix" {
  description = "Path prefix under which Jenkins/ops store app secrets in AWS SSM Parameter Store."
  type        = string
  default     = "/exxomm/prod"
}
