# Multi-stage build for production
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    make \
    gcc \
    g++ \
    python3 \
    py3-pip \
    linux-headers \
    curl

WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS builder
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Install production system dependencies
RUN apk add --no-cache \
    curl \
    dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 mediasoup

# Copy built application and dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Create necessary directories
RUN mkdir -p /app/logs && \
    chown -R mediasoup:nodejs /app

USER mediasoup

EXPOSE 3001
EXPOSE 10000-10100/udp
EXPOSE 10000-10100/tcp

ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/api/v1/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
