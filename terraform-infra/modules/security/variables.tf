variable "project_name" {
  type    = string
  default = "exxomm"
}

variable "vpc_id" {
  type = string
}

variable "backend_port" {
  type    = number
  default = 3000
}

variable "mongo_port" {
  type    = number
  default = 27017
}

variable "jenkins_admin_cidr" {
  description = "CIDR allowed to reach the Jenkins UI (port 8080). Defaults to open -- tighten to your own IP/office CIDR once you know it."
  type        = string
  default     = "0.0.0.0/0"
}
