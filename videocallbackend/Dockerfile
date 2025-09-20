# Optimized MediaSoup Dockerfile using Debian slim
FROM node:20-slim AS base

# Install MediaSoup system dependencies (Debian-based for better compatibility)
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    python3-pip \
    cmake \
    pkg-config \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies stage with MediaSoup pre-built binaries
FROM base AS deps
COPY package.json .npmrc ./
# Use MediaSoup pre-built binaries when possible
ENV MEDIASOUP_SKIP_WORKER_PREBUILT_DOWNLOAD=false
RUN npm install --only=production && \
    npm cache clean --force

# Build stage
FROM base AS builder
COPY package.json .npmrc ./
RUN npm install
COPY . .
RUN npm run build

# Production runtime
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 backend

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

USER backend
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

CMD ["node", "dist/index.js"]