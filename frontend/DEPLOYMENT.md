# 🚀 Emerald DevDashboard - Deployment Guide

## Schnelstart (Local Development)

### 1. Database Setup

```bash
# PostgreSQL installieren und starten
brew install postgresql  # macOS
# oder: apt-get install postgresql  # Linux
# oder: choco install postgresql  # Windows

# Database erstellen
createdb emerald_content

# Migrations ausführen
psql -U postgres -d emerald_content -f backend/init_sql/002_devdash_migrations.sql
```

### 2. Backend Setup

```bash
# Python 3.9+ erforderlich
python --version

# Virtual Environment erstellen
python -m venv venv
source venv/bin/activate  # Linux/macOS
# oder: venv\Scripts\activate  # Windows

# Dependencies installieren
pip install -r backend/requirements.txt

# Environment Variablen kopieren
cp backend/.env.devdash.example backend/.env
# Datei bearbeiten und eigene Werte eintragen
nano backend/.env

# Backend starten
cd backend
python -m aiohttp.web devdash_api:app --port 8080
```

### 3. Frontend Setup

```bash
# HTML/JS in lokalen Web-Server kopieren oder:
# Simple Python HTTP Server
cd frontend
python -m http.server 8000

# Browser öffnen
open http://localhost:8000/devdash.html
```

---

## Production Deployment (Heroku)

### 1. Heroku App erstellen

```bash
# Heroku CLI installieren
brew install heroku

# Login
heroku login

# App erstellen
heroku create emerald-devdash
```

### 2. PostgreSQL Add-on

```bash
# PostgreSQL Hobby Dev (kostenlos)
heroku addons:create heroku-postgresql:hobby-dev -a emerald-devdash

# Migrations ausführen
heroku pg:psql -a emerald-devdash < backend/init_sql/002_devdash_migrations.sql
```

### 3. Environment Variablen

```bash
# Alle Variablen setzen
heroku config:set \
  BOT1_TOKEN="your_token" \
  BOT_USERNAME="YourBot" \
  SECRET_KEY="your_secret_key" \
  ALLOWED_ORIGINS="https://yourdomain.com" \
  NEAR_NETWORK="mainnet" \
  TON_API_KEY="your_key" \
  -a emerald-devdash

# Überprüfen
heroku config -a emerald-devdash
```

### 4. Procfile (bereits vorhanden)

```
web: python -c 'from aiohttp import web; from devdash_api import app, register_devdash_routes; app = web.Application(); register_devdash_routes(app); web.run_app(app, port=int(os.environ.get("PORT", 8080)))'
```

### 5. Deploy

```bash
# Git hinzufügen (falls noch nicht)
git add .
git commit -m "Add DevDashboard"

# Push zu Heroku
git push heroku main

# Logs prüfen
heroku logs -a emerald-devdash --tail
```

---

## Production Deployment (Docker)

### 1. Dockerfile erstellen

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# System Dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Python Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Code
COPY . .

# Start
CMD ["python", "-m", "aiohttp.web", "devdash_api:app"]
```

### 2. Docker Compose (für Local Testing)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: emerald_content
    ports:
      - "5432:5432"
    volumes:
      - ./init_sql:/docker-entrypoint-initdb.d

  backend:
    build: .
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/emerald_content
      BOT1_TOKEN: ${BOT1_TOKEN}
      SECRET_KEY: ${SECRET_KEY}
    ports:
      - "8080:8080"
    depends_on:
      - postgres

  frontend:
    image: nginx:alpine
    volumes:
      - ./frontend:/usr/share/nginx/html
    ports:
      - "80:80"
```

### 3. Build & Run

```bash
# Docker Images bauen
docker-compose build

# Starten
docker-compose up

# Im Browser
open http://localhost
```

---

## Production Deployment (AWS/GCP/DigitalOcean)

### Option 1: AWS Elastic Beanstalk

```bash
# EB CLI installieren
pip install awsebcli

# EB App initialisieren
eb init -p python-3.10 emerald-devdash

# Umgebung erstellen
eb create emerald-devdash-prod

# Variablen setzen
eb setenv BOT1_TOKEN="..." SECRET_KEY="..." ...

# Deploy
git push
eb deploy

# Logs
eb logs
```

### Option 2: DigitalOcean App Platform

```bash
# 1. GitHub Repository verbinden
# 2. Deploy Configuration in app.yaml:

name: emerald-devdash
services:
- name: api
  github:
    repo: your-org/repo
    branch: main
  build_command: pip install -r requirements.txt
  run_command: python -m aiohttp.web devdash_api:app
  http_port: 8080
  envs:
  - key: DATABASE_URL
    scope: RUN_AND_BUILD_TIME
    value: ${db.connection_string}

databases:
- name: db
  engine: PG
  version: "14"
```

### Option 3: Render.com (einfachste Option)

```bash
# 1. Code pushen zu GitHub
# 2. Auf Render.com neuen "Web Service" erstellen
# 3. GitHub Repo verbinden
# 4. Build: pip install -r requirements.txt
# 5. Start: python -m aiohttp.web devdash_api:app
# 6. Port: 8080
# 7. Environment Variables setzen
```

---

## Production Best Practices

### 1. SSL/HTTPS

```bash
# Certbot mit Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly -d yourdomain.com

# Auto-Renewal
sudo systemctl enable certbot.timer
```

### 2. Reverse Proxy (Nginx)

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location /devdash {
        proxy_pass http://localhost:8080;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header Content-Type $content_type;
        proxy_pass_request_headers on;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

### 3. Monitoring & Logging

```bash
# PM2 für Process Management
npm install -g pm2

# app.yml
apps:
  - name: devdash
    script: python
    args: "-m aiohttp.web devdash_api:app"
    watch: ["devdash_api.py"]
    env:
      PORT: 8080
      NODE_ENV: production

# Start
pm2 start app.yml
pm2 save
pm2 startup
```

### 4. Database Backups

```bash
# Tägliche Backups
0 2 * * * pg_dump -U postgres emerald_content | gzip > /backups/emerald_$(date +\%Y\%m\%d).sql.gz

# S3 Backup
aws s3 cp /backups/emerald_*.sql.gz s3://your-bucket/backups/
```

### 5. CI/CD (GitHub Actions)

```yaml
name: Deploy DevDashboard

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Run tests
        run: |
          pip install -r requirements.txt
          python -m pytest tests/
      
      - name: Deploy to Heroku
        run: |
          git push https://heroku:${{ secrets.HEROKU_API_KEY }}@git.heroku.com/emerald-devdash.git main
        env:
          HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
```

---

## Monitoring & Health Checks

### 1. Health Check Endpoint

```bash
# Regulär aufrufen
curl https://yourdomain.com/devdash/healthz

# Response:
# {"status":"ok","time":1234567890}
```

### 2. Status Page

```bash
# UptimeRobot oder StatusPage.io integrieren
https://uptime.com/status
```

### 3. Alerts

```python
# Sentry für Error Tracking
import sentry_sdk
sentry_sdk.init("https://key@sentry.io/project")

# Slack Notifications
async def notify_slack(message):
    async with httpx.AsyncClient() as client:
        await client.post(
            os.getenv("SLACK_WEBHOOK_URL"),
            json={"text": message}
        )
```

---

## Troubleshooting

### Problem: 502 Bad Gateway
```bash
# Logs prüfen
heroku logs -a emerald-devdash --tail

# Port Konfiguration
echo $PORT  # sollte 8080 sein
```

### Problem: Database Connection Failed
```bash
# URL überprüfen
heroku config:get DATABASE_URL -a emerald-devdash

# Connections prüfen
heroku pg:psql -a emerald-devdash
SELECT count(*) FROM pg_stat_activity;
```

### Problem: CORS Errors
```bash
# ALLOWED_ORIGINS überprüfen
heroku config:get ALLOWED_ORIGINS -a emerald-devdash

# Sollte exakte Domains enthalten:
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

---

## Skalierung

### Wenn Traffic zunimmt:

```bash
# Heroku: Dynos hochfahren
heroku ps:scale web=2 -a emerald-devdash

# Datenbank: Performance Plan
heroku addons:upgrade heroku-postgresql:standard-0

# Caching: Redis hinzufügen
heroku addons:create heroku-redis:premium-0

# Load Balancer: Amazon ELB/Application Load Balancer
```

---

## Support

Bei Deployment-Problemen:
- Logs prüfen: `heroku logs --tail`
- GitHub Issues: Detaillierte Fehlermeldung + Logs
- Community Support: Emerald Discord

---

**Last Updated**: 2025-01-15
**DevDashboard Version**: 1.0.0
