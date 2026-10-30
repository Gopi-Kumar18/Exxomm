output "reverse_proxy_sg_id" {
  value = aws_security_group.reverse_proxy.id
}

output "frontend_sg_id" {
  value = aws_security_group.frontend.id
}

output "backend_sg_id" {
  value = aws_security_group.backend.id
}

output "data_sg_id" {
  value = aws_security_group.data.id
}

output "jenkins_sg_id" {
  value = aws_security_group.jenkins.id
}
