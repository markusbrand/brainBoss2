# ==========================================
# 1. Build Stage (Runs natively on the builder host)
# ==========================================
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json* bun.lock* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source files
COPY . .

# Build Vite frontend + esbuild server bundle into /app/dist
ENV NODE_ENV=production
RUN npm run build

# Remove devDependencies to keep only production dependencies
RUN npm prune --omit=dev && npm cache clean --force

# ==========================================
# 2. Production Runtime Stage (Target platform: amd64/arm64)
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl for healthcheck & tzdata
RUN apk add --no-cache curl tzdata

# Copy production node_modules, build distribution, and package.json from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Expose default application port (can be mapped to any host port via docker-compose)
EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:${PORT:-3000}/api/health || exit 1

# Start BrainBoss production server
CMD ["node", "dist/server.cjs"]
