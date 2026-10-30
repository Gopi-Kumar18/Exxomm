#!/bin/bash
set -euxo pipefail

apt-get update -y
apt-get install -y nginx

snap install amazon-ssm-agent --classic || true
systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service || true
systemctl start snap.amazon-ssm-agent.amazon-ssm-agent.service || true

rm -f /etc/nginx/sites-enabled/default

cat > /etc/nginx/sites-available/exxomm.conf <<'NGINX_EOF'
server {
    listen 80;

    location /api {
        proxy_pass http://${backend_private_ip}:${backend_port};
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_redirect off;
    }

    location / {
        proxy_pass http://${frontend_private_ip}:80;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_redirect off;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/exxomm.conf /etc/nginx/sites-enabled/exxomm.conf

systemctl enable nginx
systemctl restart nginx
