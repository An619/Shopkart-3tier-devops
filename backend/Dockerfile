# ============================================================
# ShopKart — Backend Dockerfile
# Multi-stage build: build deps → slim runtime
# ============================================================

# ---------- Stage 1: dependencies ----------
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runtime

# curl for HEALTHCHECK
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Copy production deps from builder
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY package*.json ./
COPY src ./src

# Drop privileges
USER app

ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -fsS http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]
