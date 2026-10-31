output "reverse_proxy_public_ip" {
  value = aws_eip.reverse_proxy.public_ip
}

output "frontend_private_ip" {
  value = aws_instance.frontend.private_ip
}

output "backend_private_ip" {
  value = aws_instance.backend.private_ip
}

output "mongo_private_ip" {
  value = var.colocate_db_with_backend ? aws_instance.backend.private_ip : aws_instance.mongo[0].private_ip
}

output "jenkins_public_ip" {
  value = aws_eip.jenkins.public_ip
}

output "backend_instance_id" {
  value = aws_instance.backend.id
}

output "frontend_instance_id" {
  value = aws_instance.frontend.id
}

output "backend_ecr_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "frontend_ecr_repository_url" {
  value = aws_ecr_repository.frontend.repository_url
}
