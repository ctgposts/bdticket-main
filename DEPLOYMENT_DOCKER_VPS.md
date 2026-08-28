# Docker + Linux VPS Deployment Guide

## 1) Build the Docker image

```bash
docker build -t bd-ticketpro .
```

## 2) Run with Docker Compose

```bash
docker compose up -d --build
```

Then open:

```bash
http://localhost:3000
```

## 3) Environment variables

Set these in production:

```bash
NODE_ENV=production
PORT=3000
DB_PATH=/app/data/bd-ticketpro.db
JWT_SECRET=your-long-random-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-strong-password
ALLOWED_ORIGINS=https://your-domain.com
```

## 4) Linux VPS deployment

On the VPS:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

Then clone the project and run:

```bash
git clone <your-repo-url>
cd bdticket-main
sudo docker compose up -d --build
```

## 5) Persistent database

The SQLite database is saved in a Docker volume at `/app/data`, which survives container restarts.

## 6) Reverse proxy with Nginx (optional)

Example Nginx config:

```nginx
server {
  listen 80;
  server_name your-domain.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Then enable HTTPS with Certbot.

## 7) Recommended hardening

- Keep `JWT_SECRET` in a secure environment file, never in source code
- Use a strong admin password
- Restrict `ALLOWED_ORIGINS` to your real frontend domain
- Run the app behind a reverse proxy and TLS termination
- Use regular database backups
