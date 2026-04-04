#!/bin/bash
# Ejecutar en el VPS como root: bash setup-vps.sh

set -e

echo "🚀 Configurando VPS para DaxCloud..."

# Actualiza el sistema
apt update && apt upgrade -y

# Instala dependencias
apt install -y curl git ufw fail2ban

# Instala Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Instala Docker Compose
apt install -y docker-compose-plugin

# Configura el firewall
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

# Crea directorio del proyecto
mkdir -p /opt/daxcloud/infra/nginx/conf.d

# Crea usuario de deploy (opcional pero recomendado)
useradd -m -s /bin/bash deploy
usermod -aG docker deploy

echo "✅ VPS listo. Ahora configura los secrets en GitHub."