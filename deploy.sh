#!/usr/bin/env bash
set -euo pipefail

# ----------------------------------------------------
# BD TicketPro deployment script for Ubuntu VPS
# ----------------------------------------------------
# Usage:
#   sudo ./deploy.sh
#
# Required environment variables for this script:
#   DOMAIN=app.example.com
#   REPO_URL=https://github.com/your-user/your-repo.git
#   JWT_SECRET=replace-with-a-long-random-secret
#   ADMIN_USERNAME=admin
#   ADMIN_PASSWORD=StrongPassword!2026
#   ALLOWED_ORIGINS=https://app.example.com
#
# Optional:
#   BRANCH=main
# ----------------------------------------------------

export DEBIAN_FRONTEND=noninteractive

DOMAIN="${DOMAIN:-app.example.com}"
REPO_URL="${REPO_URL:-https://github.com/YOUR_USERNAME/YOUR_REPO.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="/var/www/bdticketpro"
APP_REPO_DIR="${APP_DIR}/app"
DB_DIR="${APP_REPO_DIR}/data"
PORT="${PORT:-3000}"
JWT_SECRET="${JWT_SECRET:-replace_with_a_long_random_secret}"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-StrongPassword!2026}"
ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-https://${DOMAIN}}"

if [ "${EUID}" -ne 0 ]; then
  echo "Please run as root: sudo ./deploy.sh"
  exit 1
fi

echo "==============================="
echo "BD TicketPro VPS deployment"
echo "Domain: ${DOMAIN}"
echo "App dir: ${APP_REPO_DIR}"
echo "==============================="

# Install system dependencies
apt-get update
apt-get install -y ca-certificates curl gnupg git build-essential nginx certbot python3-certbot-nginx ufw

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Prepare app folders
mkdir -p "${APP_DIR}"
mkdir -p "${DB_DIR}"

# Clone or update repo
if [ ! -d "${APP_REPO_DIR}/.git" ]; then
  git clone -b "${BRANCH}" "${REPO_URL}" "${APP_REPO_DIR}"
else
  cd "${APP_REPO_DIR}"
  git fetch origin
  git checkout "${BRANCH}"
  git pull origin "${BRANCH}"
fi

cd "${APP_REPO_DIR}"

# Install dependencies
npm install

# Create production environment file
cat > .env.production <<EOF
NODE_ENV=production
PORT=${PORT}
DB_PATH=${DB_DIR}/bd-ticketpro.db
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=${ADMIN_USERNAME}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_EMAIL=admin@${DOMAIN}
ADMIN_PHONE=+1234567890
ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
ALLOW_DEMO_USERS=false
COMPANY_NAME=BD TicketPro
COMPANY_EMAIL=info@${DOMAIN}
COMPANY_PHONE=+880-123-456-7890
COMPANY_ADDRESS=Dhanmondi, Dhaka, Bangladesh
DEFAULT_CURRENCY=BDT
TIMEZONE=Asia/Dhaka
EOF

# Build frontend and server
NODE_ENV=production npm run build

# Stop existing pm2 app if present
pm2 delete bdticketpro >/dev/null 2>&1 || true

# Start the app in production mode
NODE_ENV=production \
PORT="${PORT}" \
DB_PATH="${DB_DIR}/bd-ticketpro.db" \
JWT_SECRET="${JWT_SECRET}" \
JWT_EXPIRES_IN="7d" \
ADMIN_USERNAME="${ADMIN_USERNAME}" \
ADMIN_PASSWORD="${ADMIN_PASSWORD}" \
ALLOWED_ORIGINS="${ALLOWED_ORIGINS}" \
pm2 start dist/server/node-build.mjs --name bdticketpro --watch false

pm2 save

# Setup firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Configure Nginx for HTTP -> HTTPS redirect and reverse proxy
cat > /etc/nginx/sites-available/bdticketpro <<EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/bdticketpro /etc/nginx/sites-enabled/bdticketpro
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# Obtain TLS certificate
certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" --non-interactive --agree-tos -m "admin@${DOMAIN}"

# Final status
pm2 status

echo "====================================="
echo "Deployment complete."
echo "Application URL: https://${DOMAIN}"
echo "PM2 process: bdticketpro"
echo "Database path: ${DB_DIR}/bd-ticketpro.db"
echo "====================================="
