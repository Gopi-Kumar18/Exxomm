variable "project_name" {
  type    = string
  default = "exxomm"
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "jenkins_instance_type" {
  description = "Jenkins builds Docker images, so it gets a bigger instance than the app tier's t3.micro."
  type        = string
  default     = "t3.small"
}

variable "public_subnet_id" {
  type = string
}

variable "private_app_subnet_id" {
  type = string
}

variable "private_data_subnet_id" {
  type = string
}

variable "reverse_proxy_sg_id" {
  type = string
}

variable "frontend_sg_id" {
  type = string
}

variable "backend_sg_id" {
  type = string
}

variable "data_sg_id" {
  type = string
}

variable "jenkins_sg_id" {
  type = string
}

variable "backend_port" {
  type    = number
  default = 3000
}

variable "ssm_parameter_prefix" {
  description = "Path prefix under which Jenkins/ops store app secrets in AWS SSM Parameter Store (e.g. /exxomm/prod/mongo_user). Terraform never writes the secret values themselves -- it only grants EC2 instances read access to this path, same split as the local .env vs Jenkins-credentials setup."
  type        = string
  default     = "/exxomm/prod"
}
