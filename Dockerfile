FROM node:18-alpine

# Accept build arguments for Next.js environment variables
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_TURN_SERVER_HOST
ARG NEXT_PUBLIC_TURN_SERVER_PORT
ARG NEXT_PUBLIC_TURN_USERNAME
ARG NEXT_PUBLIC_TURN_PASSWORD
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_VERSION

# Set environment variables for build
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_TURN_SERVER_HOST=$NEXT_PUBLIC_TURN_SERVER_HOST
ENV NEXT_PUBLIC_TURN_SERVER_PORT=$NEXT_PUBLIC_TURN_SERVER_PORT
ENV NEXT_PUBLIC_TURN_USERNAME=$NEXT_PUBLIC_TURN_USERNAME
ENV NEXT_PUBLIC_TURN_PASSWORD=$NEXT_PUBLIC_TURN_PASSWORD
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION

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