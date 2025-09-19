FROM node:18-alpine

# Install system dependencies for MediaSoup
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    gcc \
    libc-dev \
    linux-headers

WORKDIR /app

# Copy package files
COPY videocall/package.json videocall/bun.lock* ./frontend/
COPY videocallbackend/package.json videocallbackend/bun.lock* ./backend/

# Install bun
RUN npm install -g bun

# Install dependencies
RUN cd frontend && bun install
RUN cd backend && bun install

# Copy source code
COPY videocall/ ./frontend/
COPY videocallbackend/ ./backend/

# Build frontend
RUN cd frontend && bun run build

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/backend && node src/index.js &' >> /app/start.sh && \
    echo 'cd /app/frontend && bun start' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose ports
EXPOSE 3000 8000 40000-49999/udp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start both applications
CMD ["/app/start.sh"]