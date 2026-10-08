# ============================================================
# ShopKart — Frontend Dockerfile (multi-stage)
# Stage 1: build the React app with Vite
# Stage 2: serve the built assets with Nginx
# ============================================================

# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (better layer cache)
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy source and build
COPY . .

# Vite bakes VITE_* into the bundle at build time.
# Default to /api — the nginx proxy will handle the actual backend URL at runtime.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# ---------- Stage 2: Runtime ----------
FROM nginx:1.27-alpine AS runtime

# curl is needed for HEALTHCHECK; keep the image lean otherwise
RUN apk add --no-cache curl

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy our config as a template — envsubst will inject ${BACKEND_URL}
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Runtime backend URL, overridable via env var (K8s ConfigMap / Compose)
ENV BACKEND_URL="http://backend:5000"
ENV BACKEND_URL_METRICS="http://backend:5000"

# Nginx official image auto-runs envsubst on /etc/nginx/templates/*
# and writes results to /etc/nginx/conf.d/*.conf at container start.

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -fsS http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
