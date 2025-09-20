# # 🎥 MediaSoup Video Call System

A modern, scalable video calling platform built with **MediaSoup**, **Next.js**, and **Docker**. Features real-time video communication, WebRTC connectivity, and a microservices architecture.

## ✨ Features

- 🎥 **High-Quality Video Calls** - MediaSoup-powered WebRTC communication
- 🏗️ **Microservices Architecture** - Independent, scalable services  
- 🚀 **Fast Deployment** - Pre-built Docker images from GHCR
- 🔒 **Secure by Default** - JWT authentication, encrypted connections
- 📱 **Multi-Platform** - Web and mobile (React Native) support
- ⚡ **High Performance** - Optimized for low latency and scalability

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App<br/>Next.js]
        MOBILE[Mobile App<br/>React Native]
    end
    
    subgraph "Application Layer"
        PROXY[Caddy Proxy<br/>:80/:443]
        FRONTEND[Frontend Service<br/>:3000]
        BACKEND[Backend Service<br/>:8080]
    end
    
    subgraph "Infrastructure Layer"
        TURN[CoTURN Server<br/>:3478]
        DB[PostgreSQL<br/>:5432]
        CACHE[Redis<br/>:6379]
    end
    
    WEB --> PROXY
    MOBILE --> BACKEND
    PROXY --> FRONTEND
    FRONTEND --> BACKEND
    BACKEND --> DB
    BACKEND --> CACHE
    BACKEND --> TURN
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git
- Node.js 18+ (for local development)

### 1. Clone Repository

```bash
git clone https://github.com/Naimur2/videocallsystem.git
cd videocallsystem
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.template .env

# Edit with your configuration
nano .env  # or your preferred editor
```

### 3. Development Mode

```bash
# Start all services for development
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker compose logs -f frontend backend

# Access services
# Frontend: http://localhost:3000
# Backend:  http://localhost:8080
# Database: localhost:5432
```

### 4. Production Deployment

```bash
# Production deployment (uses pre-built GHCR images)
docker compose up -d

# Check status
docker compose ps
```

## 📦 Services

| Service | Description | Technology | Ports |
|---------|-------------|------------|-------|
| **Frontend** | React/Next.js web application | Next.js 14, TypeScript | 3000 |
| **Backend** | API server and MediaSoup logic | Node.js, Express, MediaSoup | 8080 |
| **CoTURN** | TURN/STUN server for NAT traversal | CoTURN (Alpine Linux) | 3478 |
| **Database** | PostgreSQL database | PostgreSQL 15 | 5432 |
| **Cache** | Redis for sessions/cache | Redis 7 | 6379 |
| **Proxy** | Reverse proxy with SSL | Caddy 2.7 | 80/443 |

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Application
DOMAIN=your-domain.com
NODE_ENV=production

# Security  
JWT_SECRET=your-32-character-secret
SESSION_SECRET=your-32-character-secret

# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/mediasoup
REDIS_URL=redis://redis:6379

# WebRTC
MEDIASOUP_ANNOUNCED_IP=your-domain.com
RTC_MIN_PORT=40000
RTC_MAX_PORT=49999

# TURN Server
COTURN_USERNAME=mediasoup
COTURN_PASSWORD=secure-password
```

### Docker Compose Files

- `docker-compose.yml` - **Production** configuration with GHCR images
- `docker-compose.dev.yml` - **Development** overrides (exposed ports, dev env)
- `docker-compose.local.yml` - **Legacy** local build configuration

## 🚀 Deployment

### Automated CI/CD

GitHub Actions automatically:

1. **Build Images** (`.github/workflows/build-images.yml`)
   - Builds each service separately
   - Pushes to GitHub Container Registry
   - Runs security scans

2. **Deploy Services** (`.github/workflows/deploy-multi-service.yml`)
   - Pulls pre-built images
   - Deploys via Docker Compose
   - Verifies service health

### Manual Deployment

```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USER --password-stdin

# Pull latest images
docker compose pull

# Deploy
docker compose up -d --wait

# Verify
docker compose ps
```

## 🧪 Testing

### Automated Testing

```bash
# Run test suite
chmod +x test-multi-service.sh
./test-multi-service.sh

# Test specific components
./test-multi-service.sh config    # Test configuration
./test-multi-service.sh images    # Test image availability
./test-multi-service.sh startup   # Test service startup
```

### Manual Testing

```bash
# Health checks
curl http://localhost:3000/api/health  # Frontend
curl http://localhost:8080/api/health  # Backend

# Database connectivity
docker compose exec postgres pg_isready -U mediasoup

# Redis connectivity  
docker compose exec redis redis-cli ping
```

## 📁 Project Structure

```
videocallsystem/
├── 📂 videocall/              # Frontend (Next.js)
├── 📂 videocallbackend/       # Backend (Node.js)
├── 📂 VideoCallApp/           # Mobile App (React Native)
├── 📂 coturn/                 # CoTURN server config
├── 📂 docs/                   # Documentation
├── 📂 scripts/                # Utility scripts
├── 📂 .github/workflows/      # CI/CD pipelines
├── 🐳 docker-compose.yml      # Production config
├── 🐳 docker-compose.dev.yml  # Development overrides
├── 🐳 docker-compose.local.yml # Legacy local builds
├── ⚙️ .env.template           # Environment template
├── ⚙️ .env.development        # Development defaults
└── 📋 README.md               # This file
```

## 🔍 Monitoring & Debugging

### Service Logs

```bash
# View all logs
docker compose logs -f

# Specific service logs
docker compose logs -f backend
docker compose logs -f frontend

# Recent logs only
docker compose logs --tail=50 backend
```

### Resource Monitoring

```bash
# Resource usage
docker stats

# Service status
docker compose ps

# Network information
docker network ls
docker inspect videocallsystem_default
```

## 🛠️ Development

### Local Development

```bash
# Install dependencies
cd videocall && npm install
cd ../videocallbackend && npm install

# Start development services
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis coturn

# Run frontend locally
cd videocall && npm run dev

# Run backend locally  
cd videocallbackend && npm run dev
```

### Adding New Services

1. Create service directory with Dockerfile
2. Add to `build-images.yml` workflow
3. Add to `docker-compose.yml`
4. Update documentation

## 📚 Documentation

- [Multi-Service Architecture](docs/MULTI_SERVICE_ARCHITECTURE.md) - Detailed architecture guide
- [Docker Compose Override Solution](docs/DOCKER_COMPOSE_OVERRIDE_SOLUTION.md) - Build context resolution

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/Naimur2/videocallsystem/issues)
- 📖 **Docs**: [Documentation](docs/)

---
