#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-}"

if [[ -z "$DOMAIN" ]]; then
  echo "Uso: ./install.sh app.seudominio.com"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker não encontrado. Instalando..."
  sudo dnf -y install dnf-plugins-core
  sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
  sudo dnf -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo systemctl enable --now docker
fi

if ! command -v docker compose >/dev/null 2>&1; then
  echo "Docker Compose plugin não encontrado."
  exit 1
fi

if [[ ! -f backend/.env ]]; then
  cp backend/.env.example backend/.env
fi

if [[ ! -f frontend/.env ]]; then
  touch frontend/.env
fi

APP_URL="https://${DOMAIN}"
sed -i "s|^APP_URL=.*|APP_URL=${APP_URL}|g" backend/.env
if ! grep -q "^APP_URL=" backend/.env; then
  echo "APP_URL=${APP_URL}" >> backend/.env
fi

if grep -q "^FRONTEND_URL=" backend/.env; then
  sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=${APP_URL}|g" backend/.env
else
  echo "FRONTEND_URL=${APP_URL}" >> backend/.env
fi

sed -i "s|^DB_CONNECTION=.*|DB_CONNECTION=pgsql|g" backend/.env
sed -i "s|^DB_HOST=.*|DB_HOST=db|g" backend/.env
sed -i "s|^DB_PORT=.*|DB_PORT=5432|g" backend/.env
sed -i "s|^DB_DATABASE=.*|DB_DATABASE=flowio|g" backend/.env
sed -i "s|^DB_USERNAME=.*|DB_USERNAME=postgres|g" backend/.env
sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=postgres|g" backend/.env

if grep -q "^NEXT_PUBLIC_API_URL=" frontend/.env; then
  sed -i "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=${APP_URL}/api|g" frontend/.env
else
  echo "NEXT_PUBLIC_API_URL=${APP_URL}/api" >> frontend/.env
fi

echo "Subindo containers..."
cd deploy
docker compose up -d --build

echo "Instalação inicial concluída."
echo "Acesse: ${APP_URL}/install"
