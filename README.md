# MediaSoup Video Call - Production Ready Video Conferencing Platform

[![Build Status](https://github.com/your-username/mediasoup-video-call/workflows/Deploy/badge.svg)](https://github.com/your-username/mediasoup-video-call/actions)
[![Security Rating](https://img.shields.io/badge/security-A-green)](https://github.com/your-username/mediasoup-video-call/security)
[![AWS Deployment](https://img.shields.io/badge/AWS-Ready-orange)](./docs/AWS_DEPLOYMENT_GUIDE.md)

A modern, scalable real-time video calling application built with **MediaSoup WebRTC**, **Next.js 15**, and **Express.js**. Features enterprise-grade deployment on AWS with complete CI/CD automation.

## ✨ Features

### 🎥 Video Conferencing
- **Multi-party Video Calls**: Support for up to 50 participants
- **Screen Sharing**: High-quality desktop and application sharing
- **Chat Integration**: Real-time messaging during calls
- **Audio Controls**: Mute/unmute, noise suppression
- **Video Quality**: Adaptive bitrate with VP8/VP9/H.264 codecs

### 🏗️ Technical Excellence
- **WebRTC Technology**: MediaSoup for enterprise-grade real-time communication
- **Modern Frontend**: Next.js 15 with React 19 and TypeScript
- **Microservices Backend**: Express.js with Socket.IO for real-time signaling
- **Database Layer**: PostgreSQL with Redis for session management
- **Container Ready**: Full Docker orchestration with multi-stage builds

### 🚀 Production Deployment
- **AWS Native**: ECS Fargate, RDS, ElastiCache, ALB deployment
- **Container Registry**: GitHub Container Registry (GHCR) or AWS ECR support
- **CI/CD Pipeline**: GitHub Actions with automated testing and deployment
- **Infrastructure as Code**: CloudFormation templates for reproducible deployments
- **Security First**: Vulnerability scanning, secrets management, SSL/TLS
- **Monitoring**: CloudWatch dashboards, logs, and alerting

## 🏃‍♂️ Quick Start

### Local Development
```bash
# Clone the repository
git clone https://github.com/your-username/mediasoup-video-call.git
cd mediasoup-video-call

# Start the application with Docker
.\start.ps1
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Admin Dashboard**: http://localhost:8080 (Nginx proxy)

### Production Deployment on AWS
For complete AWS deployment with GHCR:

```bash
# 1. Set up GHCR credentials for AWS
.\scripts\setup-ghcr.ps1 -GitHubToken "ghp_xxxx" -GitHubUsername "your-username"

# 2. Set up AWS infrastructure
.\scripts\aws-setup.ps1 -Region us-east-1 -CreateSecrets -SetupMonitoring -CreateECR

# 3. Deploy to staging
.\scripts\deploy.ps1 -Environment staging

# 4. Deploy to production
git checkout production
git push origin production
```

📖 **Deployment guides**: 
- [GHCR Deployment Guide](./docs/GHCR_DEPLOYMENT_GUIDE.md) - GitHub Container Registry setup
- [AWS Deployment Guide](./docs/AWS_DEPLOYMENT_GUIDE.md) - Complete AWS infrastructure

## 🛠️ Technology Stack

### Frontend (`./videocall/`)
- **Framework**: Next.js 15.5.2 with App Router
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS with responsive design
- **State Management**: Zustand for client-side state
- **WebRTC Client**: MediaSoup Client with device detection

### Backend (`./videocallbackend/`)
- **Runtime**: Node.js 20+ with Express.js
- **WebRTC Server**: MediaSoup 3.x for media routing
- **Real-time Communication**: Socket.IO for signaling
- **Database**: PostgreSQL 15 with connection pooling
- **Cache**: Redis for session and room management

### Mobile App (`./VideoCallApp/`)
- **Framework**: React Native with TypeScript
- **Navigation**: React Navigation 6
- **WebRTC**: React Native WebRTC
- **State Management**: Context API with hooks

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for development
- **Production**: AWS ECS Fargate with Application Load Balancer
- **Database**: Amazon RDS PostgreSQL with automated backups
- **Cache**: Amazon ElastiCache Redis cluster
- **SSL**: AWS Certificate Manager with automatic renewal

## 📁 Project Structure

```
├── videocall/                 # Next.js Frontend Application
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # Reusable React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # MediaSoup client services
│   │   └── types/            # TypeScript type definitions
│   └── Dockerfile            # Production container configuration
│
├── videocallbackend/         # Express.js Backend Application
│   ├── src/
│   │   ├── config/           # MediaSoup and server configuration
│   │   ├── services/         # Core business logic services
│   │   ├── routes/           # API route handlers
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
