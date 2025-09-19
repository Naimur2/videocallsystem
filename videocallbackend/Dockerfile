# Multi-stage build for production backend
FROM node:20-alpine AS base

# Set build arguments for MediaSoup optimization
ARG MEDIASOUP_SKIP_WORKER_PREBUILT_DOWNLOAD=false
ARG MEDIASOUP_WORKER_BIN_PATH=

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
    cmake

# Set environment variables for MediaSoup
ENV MEDIASOUP_SKIP_WORKER_PREBUILT_DOWNLOAD=${MEDIASOUP_SKIP_WORKER_PREBUILT_DOWNLOAD}
ENV MEDIASOUP_WORKER_BIN_PATH=${MEDIASOUP_WORKER_BIN_PATH}
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn

WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json ./
# Set npm configuration for MediaSoup build
RUN npm config set network-timeout 300000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5
# Install production dependencies with timeout and resource limits
RUN timeout 600 npm install --production --no-package-lock --verbose --maxsockets 1 || \
    (echo "Retrying with different approach..." && npm install --production --no-package-lock --no-optional) && \
    npm cache clean --force

# Build stage  
FROM base AS builder
COPY package.json ./
# Configure npm for MediaSoup build
RUN npm config set network-timeout 300000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5
# Install all dependencies with timeout
RUN timeout 600 npm install --no-package-lock --verbose --maxsockets 1 || \
    (echo "Retrying MediaSoup installation..." && npm install --no-package-lock --no-optional)
COPY . .
# Build with fallback
RUN npm run build || npx tsc || (echo "Direct tsc build..." && npx tsc --outDir dist src/**/*.ts)

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