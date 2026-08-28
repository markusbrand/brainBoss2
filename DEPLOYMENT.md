# 🍓 Raspberry Pi Deployment & Operations Guide

### Target Environment
- **Host IP**: `192.168.0.150`
- **Domain**: `brainboss.brandstaetter.rocks`
- **Architecture**: ARM64 (Raspberry Pi 4 / 5) or AMD64
- **Database**: PostgreSQL 16 Alpine
- **Ingress**: Cloudflare Tunnel + Cloudflare Access

---

## 🛠️ Step-by-Step Installation on Raspberry Pi

### Step 1: Install Docker & Docker Compose (if not already installed)
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and log back in for group changes to take effect
```

### Step 2: Set up BrainBoss directory
```bash
mkdir -p ~/brainboss
cd ~/brainboss
```

### Step 3: Create `docker-compose.yml`
```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/markusbrand/brainboss:latest
    container_name: brainboss_app
    restart: unless-stopped
    ports:
      - "${APP_PORT:-3080}:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgres://brainboss:${POSTGRES_PASSWORD:-brainboss_secret}@postgres:5432/${POSTGRES_DB:-brainboss}
      - GEMINI_API_KEY=${GEMINI_API_KEY:-}
      - APP_URL=https://${DOMAIN:-brainboss.brandstaetter.rocks}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - brainboss_net

  postgres:
    image: postgres:16-alpine
    container_name: brainboss_postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=brainboss
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-brainboss_secret}
      - POSTGRES_DB=${POSTGRES_DB:-brainboss}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U brainboss -d ${POSTGRES_DB:-brainboss}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - brainboss_net

networks:
  brainboss_net:
    driver: bridge

volumes:
  postgres_data:
    name: brainboss_postgres_data
```

### Step 4: Create `.env` file
```dotenv
APP_PORT=3080
POSTGRES_USER=brainboss
POSTGRES_PASSWORD=your_super_secret_password
POSTGRES_DB=brainboss
GEMINI_API_KEY=your_gemini_key_here
DOMAIN=brainboss.brandstaetter.rocks
```

### Step 5: Start the stack
```bash
docker compose up -d
```

### Step 6: Updating to the latest version
```bash
cd ~/brainboss
docker compose pull app
docker compose up -d
docker image prune -f
```

---

## 💾 PostgreSQL Backups & Restores

### Backup database to file:
```bash
docker exec -t brainboss_postgres pg_dump -U brainboss brainboss > ~/brainboss_backup_$(date +%Y%m%d).sql
```

### Restore database from file:
```bash
cat ~/brainboss_backup_YYYYMMDD.sql | docker exec -i brainboss_postgres psql -U brainboss -d brainboss
```

---

## 🔍 Health & Diagnostic Checks
- **App Status**: `curl http://192.168.0.150:3080/api/health`
- **Database Status**: `curl http://192.168.0.150:3080/api/db/status`
- **Cloudflare Header Status**: `curl -H "cf-access-authenticated-user-email: test@brandstaetter.rocks" http://192.168.0.150:3080/api/auth/me`
