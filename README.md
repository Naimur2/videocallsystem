# MediaSoup Video Call - Complete Setup# MediaSoup Video Call - Simple Setup# MediaSoup Video Call - Production Ready Video Conferencing Platform



## 🚀 Quick Start



### Local Development## 🚀 Quick Start[![Build Status](https://github.com/your-username/mediasoup-video-call/workflows/Deploy/badge.svg)](https://github.com/your-username/mediasoup-video-call/actions)



1. **Copy environment file:**[![Security Rating](https://img.shields.io/badge/security-A-green)](https://github.com/your-username/mediasoup-video-call/security)

   ```bash

   cp .env.local .env### Local Development[![AWS Deployment](https://img.shields.io/badge/AWS-Ready-orange)](./docs/AWS_DEPLOYMENT_GUIDE.md)

   ```

```bash

2. **Start services:**

   ```bashdocker-compose up -dA modern, scalable real-time video calling application built with **MediaSoup WebRTC**, **Next.js 15**, and **Express.js**. Features enterprise-grade deployment on AWS with complete CI/CD automation.

   docker-compose up -d

   ``````



3. **Access application:**## ✨ Features

   - Frontend: http://localhost

   - Backend API: http://localhost/api### Production Deployment

   - WebRTC ports: 40000-49999/UDP

### 🎥 Video Conferencing

### Production Deployment to EC2

1. **Setup GitHub Secrets:**- **Multi-party Video Calls**: Support for up to 50 participants

#### 1. Setup GitHub Secrets

   - `EC2_HOST` - Your EC2 server IP- **Screen Sharing**: High-quality desktop and application sharing

Go to GitHub repository → Settings → Secrets and variables → Actions → New repository secret

   - `EC2_USER` - Username (usually `ubuntu`)- **Chat Integration**: Real-time messaging during calls

**Required secrets:**

   - `EC2_KEY` - Your private SSH key- **Audio Controls**: Mute/unmute, noise suppression

- **`EC2_HOST`** - Your EC2 public IP address

- **`EC2_USER`** - SSH username (usually `ubuntu`)- **Video Quality**: Adaptive bitrate with VP8/VP9/H.264 codecs

- **`EC2_KEY`** - Your EC2 private SSH key (entire key content)

- **`ENV_VARS`** - Copy content from `.env.production` file:2. **Push to GitHub:**



```env   ```bash### 🏗️ Technical Excellence

DATABASE_URL=postgresql://mediasoup:YOUR_SECURE_PASSWORD@postgres:5432/mediasoup

REDIS_URL=redis://redis:6379   git push origin main- **WebRTC Technology**: MediaSoup for enterprise-grade real-time communication

JWT_SECRET=GENERATE-A-SECURE-32-CHARACTER-SECRET-HERE

SESSION_SECRET=GENERATE-ANOTHER-32-CHARACTER-SECRET-HERE   ```- **Modern Frontend**: Next.js 15 with React 19 and TypeScript

TURN_USERNAME=your-turn-username

TURN_CREDENTIAL=your-turn-password- **Microservices Backend**: Express.js with Socket.IO for real-time signaling

TURN_SERVER=turn:your-turn-server:3478

STUN_SERVER=stun:your-stun-server:34783. **Done!** GitHub Actions will build and deploy to your EC2.- **Database Layer**: PostgreSQL with Redis for session management

MEDIASOUP_ANNOUNCED_IP=YOUR-EC2-PUBLIC-IP

RTC_MIN_PORT=40000- **Container Ready**: Full Docker orchestration with multi-stage builds

RTC_MAX_PORT=49999

NODE_ENV=production## 📋 What This Does

DOMAIN=your-domain.com

FRONTEND_PORT=3000### 🚀 Production Deployment

BACKEND_PORT=3001

POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD- **One Dockerfile** - Builds frontend + backend in single container- **AWS Native**: ECS Fargate, RDS, ElastiCache, ALB deployment

```

- **One docker-compose.yml** - App + Postgres + Redis- **Container Registry**: GitHub Container Registry (GHCR) or AWS ECR support

#### 2. EC2 Security Groups

- **One GitHub workflow** - Build → Push to GHCR → Deploy to EC2- **CI/CD Pipeline**: GitHub Actions with automated testing and deployment

Ensure your EC2 security group allows:

- **Port 22** (SSH) - Your IP- **Infrastructure as Code**: CloudFormation templates for reproducible deployments

- **Port 80** (HTTP) - 0.0.0.0/0

- **Port 443** (HTTPS) - 0.0.0.0/0## 🔧 Configuration- **Security First**: Vulnerability scanning, secrets management, SSL/TLS

- **Ports 40000-49999 UDP** (WebRTC) - 0.0.0.0/0

- **Monitoring**: CloudWatch dashboards, logs, and alerting

#### 3. Domain Setup (Optional)

Edit environment variables in `docker-compose.yml`:

Point your domain A record to your EC2 IP:

```- Database credentials## 🏃‍♂️ Quick Start

your-domain.com → YOUR_EC2_IP

```- Redis configuration



#### 4. Deploy- Any other app settings### Local Development



```bash```bash

git push origin main

```## 📡 Ports# Clone the repository



GitHub Actions will automatically:git clone https://github.com/your-username/mediasoup-video-call.git

1. Build Docker image

2. Push to GitHub Container Registry- **80** - Main application (frontend)cd mediasoup-video-call

3. Deploy to your EC2 with Caddy reverse proxy

4. Setup automatic SSL (if domain configured)- **3001** - Backend API



## 📋 Architecture- **40000-49999/UDP** - WebRTC media# Start the application with Docker



```.\start.ps1

┌─────────────┐    ┌─────────────┐    ┌─────────────┐

│    Caddy    │    │     App     │    │  Database   │That's it! Simple and clean. 🎉```

│(Reverse     │◄──►│ Frontend +  │◄──►│(PostgreSQL) │

│ Proxy)      │    │  Backend    │    │             │The application will be available at:

│  :80, :443  │    │ :3000,:3001 │    └─────────────┘- **Frontend**: http://localhost:3000

└─────────────┘    └─────────────┘           │- **Backend API**: http://localhost:3001

                          │            ┌─────────────┐- **Admin Dashboard**: http://localhost:8080 (Nginx proxy)

                          │            │    Redis    │

                          └──────────►│   (Cache)   │### Production Deployment on AWS

                                       └─────────────┘For complete AWS deployment with GHCR:

```

```bash

## 🔧 Configuration Files# 1. Set up GHCR credentials for AWS

.\scripts\setup-ghcr.ps1 -GitHubToken "ghp_xxxx" -GitHubUsername "your-username"

- **`Dockerfile`** - Builds frontend + backend in single container

- **`docker-compose.yml`** - Local development with Caddy# 2. Set up AWS infrastructure

- **`Caddyfile`** - Reverse proxy configuration.\scripts\aws-setup.ps1 -Region us-east-1 -CreateSecrets -SetupMonitoring -CreateECR

- **`.env.local`** - Local development environment

- **`.env.production`** - Production environment template# 3. Deploy to staging

- **`.github/workflows/deploy.yml`** - CI/CD pipeline.\scripts\deploy.ps1 -Environment staging



## 🔑 Environment Variables# 4. Deploy to production

git checkout production

### Required for Production:git push origin production

- `DOMAIN` - Your domain (e.g., your-domain.com)```

- `MEDIASOUP_ANNOUNCED_IP` - Your EC2 public IP

- `JWT_SECRET` - 32+ character secret📖 **Deployment guides**: 

- `SESSION_SECRET` - 32+ character secret- [GHCR Deployment Guide](./docs/GHCR_DEPLOYMENT_GUIDE.md) - GitHub Container Registry setup

- `POSTGRES_PASSWORD` - Secure database password- [AWS Deployment Guide](./docs/AWS_DEPLOYMENT_GUIDE.md) - Complete AWS infrastructure



### Optional:## 🛠️ Technology Stack

- `TURN_USERNAME/TURN_CREDENTIAL` - For NAT traversal

- `TURN_SERVER/STUN_SERVER` - TURN/STUN servers### Frontend (`./videocall/`)

- **Framework**: Next.js 15.5.2 with App Router

## 🚨 Security Checklist- **UI Library**: React 19 with TypeScript

- **Styling**: Tailwind CSS with responsive design

- [ ] Generate strong JWT and session secrets- **State Management**: Zustand for client-side state

- [ ] Use secure database password- **WebRTC Client**: MediaSoup Client with device detection

- [ ] Configure proper security groups

- [ ] Setup domain with SSL (Caddy auto-generates)### Backend (`./videocallbackend/`)

- [ ] Configure TURN server for production- **Runtime**: Node.js 20+ with Express.js

- **WebRTC Server**: MediaSoup 3.x for media routing

## 📊 Monitoring- **Real-time Communication**: Socket.IO for signaling

- **Database**: PostgreSQL 15 with connection pooling

```bash- **Cache**: Redis for session and room management

# Check services on EC2

sudo docker-compose ps### Mobile App (`./VideoCallApp/`)

- **Framework**: React Native with TypeScript

# View logs- **Navigation**: React Navigation 6

sudo docker-compose logs -f- **WebRTC**: React Native WebRTC

- **State Management**: Context API with hooks

# Check Caddy SSL status

sudo docker-compose logs caddy### Infrastructure

```- **Containerization**: Docker with multi-stage builds

- **Orchestration**: Docker Compose for development

## 🔧 Troubleshooting- **Production**: AWS ECS Fargate with Application Load Balancer

- **Database**: Amazon RDS PostgreSQL with automated backups

### Common Issues:- **Cache**: Amazon ElastiCache Redis cluster

- **SSL**: AWS Certificate Manager with automatic renewal

1. **SSL not working:** Check domain DNS pointing to EC2 IP

2. **WebRTC not connecting:** Verify UDP ports 40000-49999 open## 📁 Project Structure

3. **App not accessible:** Check security groups allow HTTP/HTTPS

```

### Useful Commands:├── videocall/                 # Next.js Frontend Application

│   ├── src/

```bash│   │   ├── app/              # Next.js App Router pages

# Restart services│   │   ├── components/       # Reusable React components

sudo docker-compose restart│   │   ├── hooks/            # Custom React hooks

│   │   ├── services/         # MediaSoup client services

# Update deployment│   │   └── types/            # TypeScript type definitions

git push origin main│   └── Dockerfile            # Production container configuration

│

# Check container logs├── videocallbackend/         # Express.js Backend Application

sudo docker-compose logs app│   ├── src/

```│   │   ├── config/           # MediaSoup and server configuration

│   │   ├── services/         # Core business logic services

That's it! Simple, secure, and scalable. 🎉│   │   ├── routes/           # API route handlers
│   │   └── types/            # Shared type definitions
│   └── Dockerfile            # Production container configuration
│
├── VideoCallApp/             # React Native Mobile Application
│   ├── src/
│   │   ├── components/       # Mobile UI components
│   │   ├── screens/          # Navigation screens
│   │   └── services/         # Mobile WebRTC services
│   └── package.json
│
├── aws/                      # AWS Infrastructure Configuration
│   └── cloudformation/       # CloudFormation templates
│       └── infrastructure.yml
│
├── .github/                  # GitHub Actions CI/CD
│   └── workflows/
│       └── deploy.yml        # Automated deployment pipeline
│
├── scripts/                  # Deployment and Setup Scripts
│   ├── setup.ps1            # AWS resource initialization
│   └── deploy.ps1           # Infrastructure deployment
│
├── docs/                     # Documentation
│   ├── AWS_DEPLOYMENT_GUIDE.md
│   ├── ARCHITECTURE_GUIDE.md
│   └── DEVELOPMENT_GUIDE.md
│
└── docker-compose.yml        # Development environment
```

## 🔧 Development Guide

### Prerequisites
- **Node.js**: 20.x or higher
- **Package Manager**: Bun (recommended) or npm
- **Container Runtime**: Docker and Docker Compose
- **Database**: PostgreSQL 15+ (or use Docker)
- **Cache**: Redis 7+ (or use Docker)

### Environment Setup
```bash
# Install dependencies (use Bun for better performance)
cd videocallbackend && bun install
cd ../videocall && bun install

# Copy environment configuration
cp .env.example .env
# Edit .env with your configuration

# Start development services
docker-compose up postgres redis

# Start backend
cd videocallbackend && bun run dev

# Start frontend (new terminal)
cd videocall && bun run dev
```

### Key Configuration

#### MediaSoup Configuration (`videocallbackend/src/config/mediasoup.ts`)
```javascript
// WebRTC transport settings
const webRtcTransportOptions = {
  listenIps: [{ ip: '0.0.0.0', announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP }],
  maxIncomingBitrate: 1500000,
  initialAvailableOutgoingBitrate: 1000000,
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
};

// Supported codecs
const mediaCodecs = [
  { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
  { kind: 'video', mimeType: 'video/VP8', clockRate: 90000 },
  { kind: 'video', mimeType: 'video/h264', clockRate: 90000 },
];
```

#### Frontend State Management (`videocall/src/hooks/useVideoCallZustand.ts`)
```typescript
interface VideoCallState {
  // Room and user management
  roomId: string | null;
  participants: Participant[];
  localStream: MediaStream | null;
  
  // MediaSoup WebRTC state
  device: mediasoupClient.Device | null;
  sendTransport: mediasoupClient.Transport | null;
  recvTransport: mediasoupClient.Transport | null;
  
  // UI state
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
}
```

### Testing
```bash
# Run unit tests
cd videocallbackend && bun test
cd videocall && bun test

# Run integration tests
docker-compose -f docker-compose.test.yml up

# Load testing
cd scripts && .\load-test.ps1 -Concurrent 50 -Duration 300
```

## 🔐 Security Features

### Network Security
- **TLS Encryption**: End-to-end encryption for all communications
- **WebRTC Security**: DTLS-SRTP for media encryption
- **API Security**: Rate limiting, CORS configuration, input validation
- **Container Security**: Non-root users, minimal base images

### Authentication & Authorization
- **JWT Tokens**: Secure session management
- **Room Access Control**: Password-protected rooms
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive sanitization

### Infrastructure Security
- **VPC Isolation**: Private subnets for sensitive resources
- **Security Groups**: Least-privilege network access
- **Secrets Management**: AWS Parameter Store for sensitive data
- **Vulnerability Scanning**: Automated container scanning with Trivy

## 📊 Monitoring & Performance

### Application Monitoring
- **Real-time Metrics**: Active participants, room count, media quality
- **Performance Tracking**: WebRTC connection statistics
- **Error Tracking**: Comprehensive logging with structured format
- **Health Checks**: Automated service health verification

### Infrastructure Monitoring
- **CloudWatch Dashboards**: CPU, memory, network, and storage metrics
- **Log Aggregation**: Centralized logging with search capabilities
- **Alerting**: Automated notifications for critical issues
- **Cost Monitoring**: Resource usage and optimization recommendations

### Performance Optimizations
- **Adaptive Bitrate**: Automatic quality adjustment based on network
- **Connection Redundancy**: Multiple ICE candidates and fallback servers
- **Efficient Scaling**: Horizontal scaling based on demand
- **CDN Integration**: Static asset delivery optimization

## 🌍 Deployment Options

### Development Environment
```bash
# Local development with hot reload
.\start.ps1
```

### Staging Environment
```bash
# Deploy to AWS staging environment
.\scripts\deploy.ps1 -Environment staging -Region us-east-1
```

### Production Environment
```bash
# Production deployment with blue-green strategy
git checkout production
git push origin production  # Triggers CI/CD pipeline
```

### Multi-Region Deployment
```bash
# Deploy to multiple AWS regions for HA
.\scripts\deploy.ps1 -Environment production -Region us-east-1
.\scripts\deploy.ps1 -Environment production -Region eu-west-1
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Enforced code style
- **Prettier**: Automatic code formatting
- **Testing**: Unit tests required for new features
- **Documentation**: Update docs for API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- **[GitHub Secrets Guide](./docs/GITHUB_SECRETS_GUIDE.md)**: Complete GitHub repository secrets configuration
- **[GHCR Deployment Guide](./docs/GHCR_DEPLOYMENT_GUIDE.md)**: GitHub Container Registry deployment
- **[AWS Deployment Guide](./docs/AWS_DEPLOYMENT_GUIDE.md)**: Complete production deployment
- **[Architecture Guide](./docs/ARCHITECTURE_GUIDE.md)**: System design and components
- **[Development Guide](./docs/DEVELOPMENT_GUIDE.md)**: Local development setup
- **[API Documentation](./docs/API_GUIDE.md)**: Backend API reference

### Community & Support
- **Issues**: [GitHub Issues](https://github.com/your-username/mediasoup-video-call/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/mediasoup-video-call/discussions)
- **Wiki**: [Project Wiki](https://github.com/your-username/mediasoup-video-call/wiki)

### Professional Support
For enterprise support, custom development, or consulting services, please contact: [support@yourcompany.com](mailto:support@yourcompany.com)

---

## 🎯 Roadmap

### Short Term (Next 3 months)
- [ ] **Recording Feature**: Server-side recording with cloud storage
- [ ] **Mobile App**: Complete React Native implementation
- [ ] **Admin Dashboard**: Real-time monitoring and room management
- [ ] **Kubernetes**: Helm charts for Kubernetes deployment

### Medium Term (6 months)
- [ ] **AI Integration**: Real-time transcription and translation
- [ ] **Advanced Analytics**: Usage analytics and insights dashboard
- [ ] **White-label Solution**: Customizable branding and UI
- [ ] **Plugin System**: Extensible architecture for custom features

### Long Term (12 months)
- [ ] **WebRTC Improvements**: Support for WebRTC-NV and AV1 codec
- [ ] **Global CDN**: Edge deployment for reduced latency
- [ ] **Enterprise SSO**: SAML/OAuth integration
- [ ] **Compliance**: HIPAA, SOC2, and GDPR compliance

---

**🚀 Ready to deploy your video calling platform? Start with our [AWS Deployment Guide](./docs/AWS_DEPLOYMENT_GUIDE.md)!**

---

*Built with ❤️ using MediaSoup, Next.js, and modern DevOps practices*
