output "reverse_proxy_public_ip" {
  description = "Public IP of the real AWS reverse-proxy EC2 -- the single entry point for the app."
  value       = module.compute.reverse_proxy_public_ip
}

output "vpc_id" {
  value = module.networking.vpc_id
}

output "frontend_private_ip" {
  value = module.compute.frontend_private_ip
}

output "backend_private_ip" {
  value = module.compute.backend_private_ip
}

output "mongo_private_ip" {
  value = module.compute.mongo_private_ip
}

output "jenkins_public_ip" {
  description = "Jenkins UI: http://<this-ip>:8080"
  value       = module.compute.jenkins_public_ip
}

output "backend_instance_id" {
  value = module.compute.backend_instance_id
}

output "frontend_instance_id" {
  value = module.compute.frontend_instance_id
}

output "backend_ecr_repository_url" {
  value = module.compute.backend_ecr_repository_url
}

output "frontend_ecr_repository_url" {
  value = module.compute.frontend_ecr_repository_url
}
