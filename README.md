# 🧠 BrainBoss — Gamified Multi-Subject Learning Adventure

BrainBoss is an interactive, gamified learning platform for children aged 6–15 (Grundschule & Mittelschule, Grades 1–8) with AI-powered story quests, a schoolbook camera scanner, PostgreSQL cloud/local synchronization, and parent admin controls.

---

## 🚀 Raspberry Pi & Docker Deployment (192.168.0.150)

This application is ready to run as a multi-arch container (`linux/arm64` for Raspberry Pi and `linux/amd64`) backed by a **PostgreSQL** database and exposed securely through **Cloudflare Zero Trust** (`brainboss.brandstaetter.rocks`).

### 📦 Quick Start on Raspberry Pi

#### 1. Connect to your Raspberry Pi
```bash
ssh pi@192.168.0.150
```

#### 2. Create Application Directory
```bash
mkdir -p ~/brainboss && cd ~/brainboss
```

#### 3. Create or Copy `docker-compose.yml` and `.env`
Download `docker-compose.yml` and create your `.env` file:
```bash
cp .env.example .env
nano .env
```

Set your configuration values:
```dotenv
# Port configuration on Raspberry Pi (choose any available port)
APP_PORT=3080

# PostgreSQL credentials
POSTGRES_USER=brainboss
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=brainboss
DATABASE_URL=postgres://brainboss:your_secure_password_here@postgres:5432/brainboss

# AI Features (Gemini API)
GEMINI_API_KEY=your_gemini_api_key_here

# Domain / Cloudflare
APP_URL=https://brainboss.brandstaetter.rocks
DOMAIN=brainboss.brandstaetter.rocks
```

#### 4. Launch with Docker Compose
```bash
docker compose pull
docker compose up -d
```

Verify services are running:
```bash
docker compose ps
docker compose logs -f
```

The application is now accessible locally on `http://192.168.0.150:3080` (or whichever `APP_PORT` you configured).

---

## 🔒 Cloudflare Tunnel & Zero Trust Setup

To access the app securely via `https://brainboss.brandstaetter.rocks` with Cloudflare authentication:

### 1. Cloudflare Tunnel Configuration
In the [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/):
1. Navigate to **Networks** → **Tunnels** → **Create a Tunnel** (e.g. named `home-pi`).
2. Add a Public Hostname:
   - **Subdomain**: `brainboss`
   - **Domain**: `brandstaetter.rocks`
   - **Service Type**: `HTTP`
   - **URL**: `192.168.0.150:3080` (or `localhost:3080` if running tunnel on the Pi)

### 2. Cloudflare Access (Authentication)
1. In Cloudflare Zero Trust, go to **Access** → **Applications** → **Add an Application**.
2. Select **Self-hosted**.
3. Set Application domain: `brainboss.brandstaetter.rocks`.
4. Configure your identity providers (e.g. One-Time PIN / Email PIN, Google OAuth, GitHub).
5. Set access policies to whitelist authorized family members' email addresses.

Cloudflare automatically handles SSL, DDoS protection, and user authentication before traffic reaches your Raspberry Pi. The server detects `Cf-Access-Authenticated-User-Email` headers seamlessly via `/api/auth/me`.

---

## ⚙️ Configurable Application Port

Because you may have multiple services running on your Raspberry Pi:
- The internal container port is `3000`.
- The external host port is configured via `APP_PORT` in your `.env` file (e.g. `APP_PORT=3080`, `APP_PORT=8095`, `APP_PORT=4000`).
- Docker will bind `${APP_PORT}:3000` automatically.

---

## 🐘 PostgreSQL Persistence

The app automatically provisions the required tables (`brainboss_settings`, `brainboss_custom_questions`, `brainboss_scanned_batches`, `brainboss_activity_logs`) on first startup.

- All progress, parent configurations, scanned textbook batches, and custom questions are persisted in the named Docker volume `brainboss_postgres_data`.
- If the PostgreSQL container is temporarily unreachable, the frontend automatically falls back to client-side localStorage and synchronizes in the background once reconnected.

---

## 🔄 GitHub Actions Multi-Arch Docker Build

The workflow in `.github/workflows/docker-publish.yml` automatically builds multi-architecture images (`linux/arm64` for Raspberry Pi & `linux/amd64`) on every push to `main` and publishes them to GitHub Container Registry:

- **Registry**: `ghcr.io/markusbrand/brainboss:latest`
- Supports automatic SSH deployment to your Pi if `PI_SSH_KEY` is added to repository Secrets.

---

## 🛠️ Local Development & Testing

```bash
# Install dependencies
npm install

# Run dev server on port 3000
npm run dev

# Build and verify production bundle
npm run build
npm start
```
