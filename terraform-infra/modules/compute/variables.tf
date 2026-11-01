variable "project_name" {
  type    = string
  default = "exxomm"
}

variable "instance_type" {
  description = "Backend's instance type."
  type        = string
  default     = "t3.micro"
}

variable "colocate_db_with_backend" {
  description = "TEMPORARY vCPU-quota workaround: true runs Mongo as a container on the backend instance instead of its own EC2, so no 5th instance is launched. Set back to false once the account's vCPU quota increase is approved, to restore the dedicated mongo instance (the zero-trust data tier)."
  type        = bool
  default     = true
}

variable "mongo_instance_type" {
  description = "Mongo's own instance type. t3.micro (2 vCPU) while the account's vCPU quota increase is pending; frontend/reverse-proxy are downsized to t2.micro in the meantime to make room for it under the current 8-vCPU quota."
  type        = string
  default     = "t3.micro"
}

variable "frontend_instance_type" {
  description = "Frontend's instance type. t2.micro isn't launchable on this account (Free Plan restriction blocks it), so this stays t3.micro until the vCPU quota increase is approved."
  type        = string
  default     = "t3.micro"
}

variable "reverse_proxy_instance_type" {
  description = "Reverse-proxy's instance type. t2.micro isn't launchable on this account (Free Plan restriction blocks it), so this stays t3.micro until the vCPU quota increase is approved."
  type        = string
  default     = "t3.micro"
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

variable "terraform_state_bucket" {
  description = "S3 bucket holding the project's own Terraform state, so Jenkins' IAM role can be granted exactly the access it needs to run terraform init/plan/apply against it."
  type        = string
  default     = "exxomm-terraform-state-495392543717"
}

variable "ssm_parameter_prefix" {
  description = "Path prefix under which Jenkins/ops store app secrets in AWS SSM Parameter Store (e.g. /exxomm/prod/mongo_user). Terraform never writes the secret values themselves -- it only grants EC2 instances read access to this path, same split as the local .env vs Jenkins-credentials setup."
  type        = string
  default     = "/exxomm/prod"
}
