# MediaSoup Multi-Party Video Call - Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- PowerShell (Windows) or Bash (Linux/Mac)
- Node.js 18+ (for development)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### 1. System Check and Setup

```bash
# Run comprehensive system check
.\run-system-check.cmd

# Or manually
powershell -ExecutionPolicy Bypass -File "scripts\system-check.ps1"
```

### 2. Start with Cloudflare Tunnels

```bash
# Full automated setup
.\start-cloudflare-full.ps1

# Or with specific URLs
.\start-cloudflare-full.ps1 -HttpUrl "https://your-tunnel.trycloudflare.com" -TcpUrl "tcp://your-tcp-tunnel.trycloudflare.com:port"
```

## 🏗️ Architecture Overview

### Backend Components
- **MediaSoup Server**: Handles WebRTC media routing
- **Socket.IO Server**: Real-time communication
- **PostgreSQL**: User and room data storage
- **Redis**: Session management and caching
- **COTURN Server**: STUN/TURN server for NAT traversal
- **Nginx**: Reverse proxy and load balancing

### Frontend Components
- **Next.js Application**: React-based frontend
- **MediaSoup Client**: WebRTC client library
- **Socket.IO Client**: Real-time communication
- **Zustand Store**: State management
- **Tailwind CSS**: Styling framework

## 🔧 Configuration

### Environment Variables

#### Frontend (videocall/.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=https://your-tunnel.trycloudflare.com/api
NEXT_PUBLIC_SOCKET_URL=https://your-tunnel.trycloudflare.com
NEXT_PUBLIC_TURN_SERVER_HOST=your-turn-tunnel.trycloudflare.com
NEXT_PUBLIC_TURN_USERNAME=mediasoup
NEXT_PUBLIC_TURN_PASSWORD=mediasoup123
```

#### Backend (videocallbackend/.env)
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://videocall:videocall123@postgres:5432/videocall
REDIS_URL=redis://redis:6379
CORS_ORIGIN=https://your-tunnel.trycloudflare.com
ALLOWED_ORIGINS=https://your-tunnel.trycloudflare.com
MEDIASOUP_LISTEN_IP=0.0.0.0
MEDIASOUP_ANNOUNCED_IP=0.0.0.0
TURN_SERVER_HOST=your-turn-tunnel.trycloudflare.com
TURN_SERVER_PORT=443
TURN_USERNAME=mediasoup
TURN_PASSWORD=mediasoup123
```

### Docker Compose Configuration

The `docker-compose.clean.yml` file defines all services:

- **frontend**: Next.js app (port 3000)
- **backend**: Express.js API (port 3001)
- **postgres**: Database (port 5432)
- **redis**: Cache (port 6379)
- **coturn**: TURN server (port 3478)
- **nginx**: Reverse proxy (port 80)

## 🎯 MediaSoup Configuration

### Key Settings

1. **Worker Configuration**
   - RTC port range: 20000-20100
   - Log level: warn
   - Multi-core support enabled

2. **Router Media Codecs**
   - Audio: Opus (48kHz, stereo)
   - Video: VP8, VP9, H.264 (multiple profiles)
   - Optimized bitrate settings

3. **WebRTC Transport**
   - UDP and TCP support
   - TURN relay support
   - ICE connection management

## 🔍 Troubleshooting

### Common Issues

#### 1. Video Not Displaying
```javascript
// Check browser console for errors
// Enable debug logging
localStorage.setItem('debug', 'mediasoup*');

// Run system validation
systemValidator.runAllValidations();
```

#### 2. Connection Issues
- Verify Cloudflare tunnels are running
- Check Docker container status: `docker compose -f docker-compose.clean.yml ps`
- Monitor logs: `docker compose -f docker-compose.clean.yml logs -f`

#### 3. MediaSoup Consumer Issues
- Check RTP capabilities compatibility
- Verify transport connection states
- Monitor consumer pause/resume cycles

### Debug Tools

#### Browser Console Commands
```javascript
// System validation
systemValidator.runAllValidations();

// MediaSoup device info
mediaSoupClientService.getDeviceInfo();

// Video call store state
useVideoCallStore.getState();
```

#### Container Debugging
```bash
# Check specific container logs
docker logs videocall-backend
docker logs videocall-frontend
docker logs videocall-coturn

# Access container shell
docker exec -it videocall-backend sh
```

## 🔧 Development

### Local Development Setup

1. **Clone and Install**
   ```bash
   git clone <repository>
   cd mediasoup-video-call
   bun install
   ```

2. **Database Setup**
   ```bash
   docker compose up -d postgres redis
   cd videocallbackend
   bun run migrate
   ```

3. **Start Development Servers**
   ```bash
   # Frontend
   cd videocall
   bun run dev

   # Backend
   cd videocallbackend
   bun run dev
   ```

### Component Structure

#### Frontend Components
- `MeetingPage`: Main video call interface
- `VideoGrid`: Video layout management
- `AdvancedVideoTile`: Individual video tile with diagnostics
- `ChatSidebar`: Chat functionality
- `MeetingHeader`: Meeting info display
- `EnhancedControlPanel`: Media controls

#### Backend Services
- `MediaSoupService`: WebRTC media handling
- `SocketService`: Real-time communication
- `RoomService`: Room management
- `ParticipantService`: User management

## 📊 Performance Optimization

### MediaSoup Settings
- Optimal codec selection (VP8/VP9/H.264)
- Dynamic bitrate adaptation
- Simulcast support for multiple video qualities
- SVC (Scalable Video Coding) for bandwidth optimization

### Frontend Optimizations
- Component memoization
- Virtual scrolling for large participant lists
- Efficient state management with Zustand
- WebRTC connection pooling

### Backend Optimizations
- Worker process management
- Connection pooling for database
- Redis caching for session data
- Efficient room and participant management

## 🔐 Security Considerations

1. **TURN Server Authentication**
   - Secure credentials rotation
   - Time-limited auth tokens
   - IP whitelisting when possible

2. **WebRTC Security**
   - DTLS encryption enabled
   - SRTP for media encryption
   - ICE connection validation

3. **API Security**
   - CORS configuration
   - Rate limiting
   - Input validation
   - Session management

## 📈 Scaling

### Horizontal Scaling
- Multiple MediaSoup workers
- Load balancing across instances
- Distributed session storage with Redis
- Database replication

### Vertical Scaling
- Multi-core MediaSoup workers
- Optimized container resource allocation
- Memory and CPU monitoring
- Performance profiling

## 🌐 Deployment

### Production Deployment
1. Use named Cloudflare tunnels for stability
2. Configure SSL certificates
3. Set up monitoring and logging
4. Implement health checks
5. Configure backup strategies

### Monitoring
- Container health checks
- MediaSoup worker monitoring
- Connection quality metrics
- Error tracking and alerting

## 📚 Additional Resources

- [MediaSoup Documentation](https://mediasoup.org/)
- [WebRTC Specifications](https://webrtc.org/)
- [Socket.IO Documentation](https://socket.io/)
- [Cloudflare Tunnels Guide](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)

## 🤝 Contributing

1. Follow the coding instructions in `.github/instructions/`
2. Use consistent naming conventions
3. Follow DRY principles
4. Add comprehensive tests
5. Update documentation
6. Follow the component separation guidelines