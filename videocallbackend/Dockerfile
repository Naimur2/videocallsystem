# Multi-stage build for production backend
FROM node:20-alpine AS base

# Install system dependencies for MediaSoup and native modules
RUN apk add --no-cache \
    make \
    gcc \
    g++ \
    python3 \
    py3-pip \
    linux-headers \
    curl \
    git \
    dumb-init \
    pkgconfig \
    openssl-dev \
    cmake \
    libc6-compat

# Set environment variables
ENV NODE_ENV=production

WORKDIR /app

# Dependencies stage - optimized for MediaSoup
FROM base AS deps
COPY package.json .npmrc ./
# Generate lock file and clean install for better caching
RUN npm install --package-lock-only && \
    npm ci --only=production && \
    npm cache clean --force

# Build stage  
FROM base AS builder
COPY package.json .npmrc ./
# Generate lock file and install all dependencies
RUN npm install --package-lock-only && \
    npm ci
COPY . .
# Build with error handling
RUN npm run build || npx tsc || npx tsc --outDir dist src/index.ts

# Production runtime
FROM node:20-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    dumb-init

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Copy application files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Create necessary directories and set permissions
RUN mkdir -p /app/logs && \
    chown -R backend:nodejs /app

# Switch to non-root user
USER backend

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Expose port
EXPOSE 8080

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]