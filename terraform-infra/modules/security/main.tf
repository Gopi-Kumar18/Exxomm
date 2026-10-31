# No security group here opens port 22 to anywhere -- operator access is
# via AWS SSM Session Manager (IAM-based), not SSH/bastion.

resource "aws_security_group" "reverse_proxy" {
  name        = "${var.project_name}-reverse-proxy-sg"
  description = "Public entry point: HTTP(S) from the internet, forwards to the private app tier"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # 443/TLS intentionally left out until a real domain + certificate exist.

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-reverse-proxy-sg"
  }
}

resource "aws_security_group" "frontend" {
  name        = "${var.project_name}-frontend-sg"
  description = "Frontend app tier: reachable only from the reverse proxy"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP from the reverse proxy only"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.reverse_proxy.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-frontend-sg"
  }
}

resource "aws_security_group" "backend" {
  name        = "${var.project_name}-backend-sg"
  description = "Backend app tier: reachable only from the reverse proxy"
  vpc_id      = var.vpc_id

  ingress {
    description     = "API traffic from the reverse proxy only"
    from_port       = var.backend_port
    to_port         = var.backend_port
    protocol        = "tcp"
    security_groups = [aws_security_group.reverse_proxy.id]
  }

  # TEMPORARY vCPU-quota workaround: Mongo runs as a container on this same
  # instance (see colocate_db_with_backend), so the backend app container
  # needs to reach it over this instance's own private IP. Remove once the
  # quota increase is approved and Mongo moves back to its own instance.
  ingress {
    description = "Mongo traffic from itself (temporary DB colocation on this instance)"
    from_port   = var.mongo_port
    to_port     = var.mongo_port
    protocol    = "tcp"
    self        = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-backend-sg"
  }
}

resource "aws_security_group" "jenkins" {
  name        = "${var.project_name}-jenkins-sg"
  description = "Jenkins CI/CD server: UI access only. Deploys reach the app tier via SSM Run Command (AWS API), not a direct network path, so no extra rule is needed for that."
  vpc_id      = var.vpc_id

  ingress {
    description = "Jenkins UI"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = [var.jenkins_admin_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-jenkins-sg"
  }
}

resource "aws_security_group" "data" {
  name        = "${var.project_name}-data-sg"
  description = "Data tier (Mongo): reachable only from the backend, no inbound internet access"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Mongo traffic from the backend only"
    from_port       = var.mongo_port
    to_port         = var.mongo_port
    protocol        = "tcp"
    security_groups = [aws_security_group.backend.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-data-sg"
  }
}
