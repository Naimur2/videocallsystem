# MediaSoup Video Call - Deployment Guide

This comprehensive guide covers setting up, developing, and deploying the complete MediaSoup Video Call application with Google Meet-like features.

## 🎥 Overview

The MediaSoup Video Call application provides a complete video conferencing solution with:

- **Real-time Video/Audio Calling** with MediaSoup WebRTC
- **Screen Sharing** and **Chat Functionality**
- **Participant Management** and **Hand Raising**
- **TURN/STUN Server** for NAT traversal
- **Scalable Backend** with Redis and PostgreSQL
- **Modern React Frontend** with Next.js

## 🏗️ Architecture

```
Frontend (Next.js)     Backend (Express.js)     Infrastructure
     :3000        ←→        :3001          ←→    TURN/STUN :3478
                                           ←→    Redis :6379
                                           ←→    PostgreSQL :5433
```

## ⚡ Quick Start (Development)

### Prerequisites

- **Node.js** 18+ 
- **Yarn** (for backend)
- **Bun** (for frontend) - Install from [bun.sh](https://bun.sh)
- **Docker & Docker Compose** (for infrastructure)

### Automated Setup

**Windows:**
```batch
start-all.bat
```

**Linux/macOS:**
```bash
chmod +x start-all.sh
./start-all.sh
```

This will:
1. ✅ Check prerequisites
2. 🐳 Start Docker services (TURN/STUN, Redis, PostgreSQL)
3. 📦 Install dependencies
4. 🚀 Start backend server (port 3001)
5. 🚀 Start frontend server (port 3000)

### Manual Setup

1. **Clone and setup environment:**
```bash
git clone <repository-url>
cd mediasoup-video-call
cp .env.example .env
```

2. **Start infrastructure services:**
```bash
# Windows
start-infrastructure.bat

# Linux/macOS
chmod +x start-infrastructure.sh
./start-infrastructure.sh
```

3. **Start backend server:**
```bash
cd videocallbackend
yarn install
yarn dev  # Runs on http://localhost:3001
```

4. **Start frontend server:**
```bash
cd videocall
bun install
bun dev   # Runs on http://localhost:3000
```

## 🔧 Configuration

### Environment Variables (`.env`)

```bash
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# MediaSoup Configuration
MEDIASOUP_LISTEN_IP=0.0.0.0
MEDIASOUP_ANNOUNCED_IP=127.0.0.1
MEDIASOUP_RTC_MIN_PORT=10000
MEDIASOUP_RTC_MAX_PORT=59999

# TURN/STUN Server Configuration
EXTERNAL_IP=127.0.0.1
TURN_SERVER_HOST=localhost
TURN_SERVER_PORT=3478
TURN_USERNAME=testuser
TURN_PASSWORD=testpassword
TURN_REALM=mediasoup-turn.example.com

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=mediasoup
POSTGRES_USER=mediasoup
POSTGRES_PASSWORD=mediasoup_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# WebRTC ICE Configuration
ICE_SERVERS='[{"urls":["stun:127.0.0.1:3478"]},{"urls":["turn:127.0.0.1:3478"],"username":"testuser","credential":"testpassword"}]'

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

## 🧪 Testing the Setup

1. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001  
   - API Documentation: http://localhost:3001/api-docs

2. **Test video calling:**
   - Open http://localhost:3000 in two browser windows/tabs
   - Create or join a room in both windows
   - Test audio/video toggle, screen sharing, and chat functionality

3. **Check infrastructure services:**
   ```bash
   docker-compose ps                    # Check service status
   docker-compose logs turn-server      # Check TURN server logs
   docker-compose logs redis           # Check Redis logs
   docker-compose logs postgres        # Check PostgreSQL logs
   ```

4. **Test TURN server connectivity:**
   ```bash
   # Install TURN utilities (Ubuntu/Debian)
   sudo apt-get install coturn-utils
   
   # Test TURN server
   turnutils_uclient -t -u testuser -w testpassword localhost
   ```

## 🚀 Production Deployment

### Server Requirements

**Minimum Specifications:**
- **CPU:** 4 cores (8 cores recommended for >50 users)
- **RAM:** 8GB (16GB+ recommended for scaling)
- **Storage:** 50GB SSD (100GB+ for logs and data)
- **Network:** 1Gbps bandwidth, low latency
- **OS:** Ubuntu 20.04+, CentOS 8+, or similar Linux distribution

**Required Ports:**
- `80, 443`: HTTP/HTTPS web traffic
- `3478`: TURN/STUN server
- `5349`: TURN over TLS (secure)
- `10000-20000`: RTP media relay ports

### Production Environment Setup

1. **Server Preparation:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for docker group membership
```

2. **Clone and Configure:**
```bash
# Clone repository
git clone <your-repository-url>
cd mediasoup-video-call

# Create production environment file
cp .env.example .env.production

# Edit with production values
nano .env.production
```

**Production `.env.production` example:**
```bash
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Use your server's public IP
EXTERNAL_IP=203.0.113.10
MEDIASOUP_ANNOUNCED_IP=203.0.113.10
TURN_SERVER_HOST=turn.yourdomain.com

# Secure credentials (generate strong passwords)
TURN_USERNAME=prod_user_$(openssl rand -hex 8)
TURN_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

# Database credentials
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)

# Production domain
CORS_ORIGIN=https://yourdomain.com
```

### SSL Certificate Setup

For HTTPS, you need SSL certificates:

```bash
# Using Let's Encrypt (recommended)
sudo certbot certonly --standalone -d your-domain.com

# Or using custom certificates
# Place your cert.pem and private.key in /etc/ssl/certs/
```

## 🏗️ Infrastructure Setup

### Docker Production Compose

Create `docker-compose.prod.yml`:

```yaml
version: "3.8"

services:
    # TURN/STUN Server
    turn-server:
        image: coturn/coturn:latest
        container_name: mediasoup-turn
        restart: unless-stopped
        ports:
            - "3478:3478"
            - "3478:3478/udp"
            - "5349:5349"
            - "5349:5349/udp"
        environment:
            - TURN_SERVER_CONFIG=turnserver.conf
        volumes:
            - ./turnserver.conf:/etc/coturn/turnserver.conf:ro
            - turn-data:/var/lib/coturn
        networks:
            - mediasoup-network

    # PostgreSQL Database
    postgres:
        image: postgres:15-alpine
        container_name: mediasoup-postgres
        restart: unless-stopped
        environment:
            - POSTGRES_DB=mediasoup_prod
            - POSTGRES_USER=mediasoup_user
            - POSTGRES_PASSWORD=secure-db-password
        volumes:
            - postgres-data:/var/lib/postgresql/data
            - ./init.sql:/docker-entrypoint-initdb.d/init.sql
        networks:
            - mediasoup-network

    # Redis Cache
    redis:
        image: redis:7-alpine
        container_name: mediasoup-redis
        restart: unless-stopped
        command: redis-server --requirepass secure-redis-password
        volumes:
            - redis-data:/data
        networks:
            - mediasoup-network

    # Backend API
    backend:
        build:
            context: ./videocallbackend
            dockerfile: Dockerfile.prod
        container_name: mediasoup-backend
        restart: unless-stopped
        environment:
            - NODE_ENV=production
        env_file:
            - .env
        ports:
            - "3001:3001"
        depends_on:
            - postgres
            - redis
            - turn-server
        volumes:
            - ./logs:/var/log/mediasoup
            - ./ssl:/etc/ssl/certs:ro
        networks:
            - mediasoup-network

    # Frontend
    frontend:
        build:
            context: ./videocall
            dockerfile: Dockerfile.prod
        container_name: mediasoup-frontend
        restart: unless-stopped
        ports:
            - "3000:3000"
        environment:
            - NEXT_PUBLIC_API_URL=https://your-domain.com/api
            - NEXT_PUBLIC_WS_URL=wss://your-domain.com
        networks:
            - mediasoup-network

    # Nginx Reverse Proxy
    nginx:
        image: nginx:alpine
        container_name: mediasoup-nginx
        restart: unless-stopped
        ports:
            - "80:80"
            - "443:443"
        volumes:
            - ./nginx.conf:/etc/nginx/nginx.conf:ro
            - ./ssl:/etc/ssl/certs:ro
            - nginx-logs:/var/log/nginx
        depends_on:
            - backend
            - frontend
        networks:
            - mediasoup-network

volumes:
    postgres-data:
    redis-data:
    turn-data:
    nginx-logs:

networks:
    mediasoup-network:
        driver: bridge
```

### TURN Server Configuration

Create `turnserver.conf`:

```bash
# TURN server configuration
listening-port=3478
tls-listening-port=5349
listening-ip=0.0.0.0
relay-ip=your-server-ip
external-ip=your-server-ip

# Authentication
lt-cred-mech
user=prod-user:secure-password-123
realm=your-domain.com

# Security
no-tlsv1
no-tlsv1_1
cipher-list="HIGH:!aNULL:!MD5"

# Performance
total-quota=100
stale-nonce=600

# Logging
log-file=/var/log/turnserver.log
simple-log

# Additional settings
no-software-attribute
```

### Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Performance
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=ws:10m rate=100r/s;

    upstream backend {
        server backend:3001;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL configuration
        ssl_certificate /etc/ssl/certs/cert.pem;
        ssl_certificate_key /etc/ssl/certs/private.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # Rate limiting
            limit_req zone=api burst=20 nodelay;
        }

        # WebSocket
        location /socket.io/ {
            proxy_pass http://backend/socket.io/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket specific settings
            proxy_buffering off;
            proxy_cache off;

            # Rate limiting for WebSocket
            limit_req zone=ws burst=200 nodelay;
        }

        # Static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## 🐳 Dockerfiles

### Backend Dockerfile

Create `videocallbackend/Dockerfile.prod`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production image
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mediasoup -u 1001

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Change ownership
RUN chown -R mediasoup:nodejs /app
USER mediasoup

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["npm", "start"]
```

### Frontend Dockerfile

Create `videocall/Dockerfile.prod`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production image
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Change ownership
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start application
CMD ["npm", "start"]
```

## 📊 Monitoring & Logging

### Application Monitoring

Add monitoring to your backend:

```typescript
// src/config/monitoring.ts
import * as Sentry from "@sentry/node";

export const initMonitoring = () => {
    if (process.env.SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV,
            tracesSampleRate: 1.0,
        });
    }
};

// src/middleware/monitoring.ts
import { Request, Response, NextFunction } from "express";
import * as Sentry from "@sentry/node";

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Sentry.captureException(error);
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
};
```

### Log Aggregation

Configure Winston for structured logging:

```typescript
// src/config/logger.ts
import winston from "winston";

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: process.env.LOG_FILE || "logs/app.log",
        }),
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
});
```

## 🔒 Security Best Practices

### Network Security

1. **Firewall Configuration**

    ```bash
    # Allow only necessary ports
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw allow 3478/udp  # TURN/STUN
    ufw allow 5349/tcp  # TURN/STUN TLS
    ufw --force enable
    ```

2. **SSL/TLS Configuration**

    - Use strong ciphers
    - Enable HSTS
    - Regular certificate renewal

3. **Rate Limiting**
    - Implement API rate limiting
    - WebSocket connection limits
    - DDoS protection

### Application Security

1. **Environment Variables**

    - Never commit secrets to version control
    - Use strong, unique passwords
    - Rotate credentials regularly

2. **Input Validation**

    - Validate all user inputs
    - Sanitize data before processing
    - Use parameterized queries

3. **Authentication & Authorization**
    - Implement JWT tokens
    - Role-based access control
    - Secure session management

## 📈 Scaling Strategies

### Horizontal Scaling

1. **Load Balancer Configuration**

    ```nginx
    upstream backend {
        least_conn;
        server backend1:3001;
        server backend2:3001;
        server backend3:3001;
    }
    ```

2. **Database Scaling**

    - Read replicas for PostgreSQL
    - Redis cluster for caching
    - Connection pooling

3. **MediaSoup Scaling**
    - Multiple workers per server
    - Distributed router management
    - Load balancing across servers

### Performance Optimization

1. **WebRTC Optimization**

    ```typescript
    // Optimize codec selection
    const codecs = [
        { kind: "audio", mimeType: "audio/opus", clockRate: 48000 },
        { kind: "video", mimeType: "video/VP8", clockRate: 90000 },
        { kind: "video", mimeType: "video/H264", clockRate: 90000 },
    ];
    ```

2. **Caching Strategy**
    - Cache room metadata in Redis
    - Cache user sessions
    - Cache static assets

## 🚨 Troubleshooting

### Common Issues

1. **TURN Server Connection Issues**

    ```bash
    # Check TURN server logs
    docker-compose logs turn-server

    # Test connectivity
    docker run --rm -it coturn/coturn turnutils_stunclient your-server-ip
    ```

2. **WebRTC Connection Problems**

    - Verify SSL certificates
    - Check firewall settings
    - Confirm TURN server configuration

3. **Performance Issues**
    - Monitor resource usage
    - Check database connections
    - Review MediaSoup worker logs

### Health Checks

```bash
# Check all services
docker-compose ps

# Check backend health
curl https://your-domain.com/api/v1/health

# Check TURN server
docker exec mediasoup-turn turnutils_stunclient 127.0.0.1
```

## 📞 Support

For deployment issues:

-   Check the troubleshooting section
-   Review Docker logs: `docker-compose logs`
-   Monitor system resources
-   Check network connectivity

---

This deployment guide provides a production-ready setup for the MediaSoup Video Call application. For additional customization or specific requirements, please refer to the main README.md file.
