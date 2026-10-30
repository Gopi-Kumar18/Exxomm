variable "project_name" {
  type    = string
  default = "exxomm"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "azs" {
  description = "Availability Zones to spread subnets across. One AZ keeps this a single-AZ, low-cost deployment (matches running Mongo as a plain container rather than a managed multi-AZ DB). Add more entries here later without touching any other module if that ever changes."
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
