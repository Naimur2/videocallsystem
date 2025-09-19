# MediaSoup Video Call with COTURN - Deployment Guide

This guide covers the complete deployment of the MediaSoup video calling application with COTURN server integration and ngrok tunnel support.

## 🏗️ Architecture Overview

### Services
- **Frontend**: Next.js application (port 3000)
- **Backend**: Express.js API with MediaSoup (port 3001)
- **PostgreSQL**: Database (port 5432)
- **Redis**: Cache and session storage (port 6379)
- **COTURN**: TURN/STUN server for NAT traversal (ports 3478, 5349, 49152-65535)
- **Nginx**: Reverse proxy (port 80)

### NAT Traversal
- **STUN**: For discovering public IP addresses
- **TURN**: For relaying media traffic through server when direct connection fails
- **ICE**: For establishing the best possible connection path

## 🚀 Quick Deployment

### Prerequisites
1. Docker and Docker Compose installed
2. ngrok account and installed ngrok client
3. Ports available: 80, 3000, 3001, 3478, 5349, 49152-65535

### Deployment Steps

1. **Prepare the environment**:
   ```bash
   ./deploy.sh [ngrok-url] [external-ip]
   ```
   Example:
   ```bash
   ./deploy.sh satisfaction-budget-symbols-happens.trycloudflare.com 103.168.206.12
   ```

2. **Start ngrok tunnel**:
   ```powershell
   # On Windows PowerShell
   ./start-ngrok.ps1
   ```
   Or manually:
   ```bash
   ngrok http --url=satisfaction-budget-symbols-happens.trycloudflare.com 80
   ```

3. **Deploy the application**:
   ```bash
   ./start-production.sh
   ```

4. **Access the application**:
   - Web interface: https://satisfaction-budget-symbols-happens.trycloudflare.com
   - Ngrok dashboard: http://localhost:4040

## 🔧 Manual Setup

If you prefer manual setup or need customization:

### 1. Environment Configuration

Create `.env` file:
```env
NGROK_URL=your-ngrok-url.ngrok-free.app
EXTERNAL_IP=your-public-ip
POSTGRES_DB=videocall
POSTGRES_USER=videocall
POSTGRES_PASSWORD=videocall123
TURN_SERVER_HOST=your-ngrok-url.ngrok-free.app
TURN_SERVER_PORT=3478
TURN_USERNAME=mediasoup
TURN_PASSWORD=mediasoup123
```

### 2. Docker Compose

Start services:
```bash
# Basic deployment
docker compose up --build -d

# Production deployment with overrides
docker compose -f docker-compose.yml -f docker-compose.prod.override.yml up --build -d
```

### 3. COTURN Server

The COTURN server is automatically configured with:
- **STUN**: `stun:your-domain:3478`
- **TURN**: `turn:your-domain:3478` (username: mediasoup, password: mediasoup123)
- **Ports**: 49152-65535 for media relay

## 🛠️ Configuration Details

### COTURN Server Settings
Located in `coturn/turnserver.conf`:
- External IP is set via environment variable
- User credentials: mediasoup/mediasoup123
- Relay ports: 49152-65535
- Authentication via shared secret

### MediaSoup Integration
- Backend uses COTURN for ICE server configuration
- Frontend gets ICE servers from backend
- Automatic fallback to Google STUN servers

### Ngrok Configuration
- HTTP tunnel to port 80
- Nginx handles routing to frontend/backend
- TURN server accessible through ngrok domain

## 📋 Port Configuration

### Required Ports
- **80**: HTTP (nginx reverse proxy)
- **3000**: Frontend (internal)
- **3001**: Backend API (internal)
- **3478**: STUN/TURN server (TCP/UDP)
- **5349**: TURN over TLS (TCP/UDP)
- **5432**: PostgreSQL (internal)
- **6379**: Redis (internal)
- **20000-20100**: MediaSoup RTP (UDP)
- **49152-65535**: COTURN relay ports (UDP)

### Docker Port Mapping
All necessary ports are automatically mapped in docker-compose.yml

## 🔍 Troubleshooting

### Common Issues

1. **Connection Failed**:
   - Check if ngrok tunnel is running
   - Verify firewall allows required ports
   - Check Docker containers are running: `docker compose ps`

2. **Media Not Working**:
   - Verify COTURN server is accessible
   - Check browser permissions for camera/microphone
   - Review browser console for WebRTC errors

3. **ICE Connection Errors**:
   - Confirm external IP is correctly set
   - Verify TURN credentials are correct
   - Check COTURN logs: `docker compose logs coturn`

### Debugging Commands

```bash
# View all service logs
docker compose logs -f

# Check specific service
docker compose logs -f coturn
docker compose logs -f backend
docker compose logs -f frontend

# Test COTURN server
curl -v http://your-domain:3478

# Check container status
docker compose ps

# Restart services
docker compose restart [service_name]
```

## 🔒 Security Considerations

### Production Deployment
1. **Change default passwords**:
   - Database password
   - TURN server credentials
   - Shared secrets

2. **Enable TLS**:
   - Configure proper SSL certificates
   - Update COTURN for TLS mode
   - Secure WebSocket connections

3. **Firewall Configuration**:
   - Restrict access to internal ports
   - Allow only necessary external ports
   - Configure rate limiting

4. **Resource Limits**:
   - Set Docker memory/CPU limits
   - Configure COTURN user quotas
   - Monitor connection counts

## 🎯 Performance Optimization

### MediaSoup Workers
Adjust worker count in backend configuration:
```javascript
// videocallbackend/src/services/mediasoupService.ts
await mediaSoupService.init(2); // Increase worker count for more users
```

### COTURN Optimization
- Adjust relay port range based on expected users
- Configure bandwidth limits per user
- Enable connection logging for monitoring

### Database Optimization
- Configure connection pooling
- Set up database monitoring
- Regular maintenance and backups

## 📊 Monitoring

### Health Checks
- Backend health: `/api/v1/health`
- Frontend: Check if page loads
- Database: Connection test
- Redis: Connection test
- COTURN: Port accessibility test

### Metrics to Monitor
- WebSocket connections
- Media stream quality
- TURN server usage
- Database performance
- Memory and CPU usage

## 🔄 Updates and Maintenance

### Regular Tasks
1. **Update Dependencies**:
   ```bash
   cd videocall && bun update
   cd ../videocallbackend && bun update
   ```

2. **Database Maintenance**:
   - Regular backups
   - Clean old sessions
   - Monitor disk usage

3. **Log Rotation**:
   - Configure log rotation for COTURN
   - Monitor log file sizes
   - Archive old logs

### Backup Strategy
- Database dumps
- Configuration files
- Docker volumes
- SSL certificates (if used)

## 🆘 Emergency Recovery

### Quick Recovery Steps
1. **Stop all services**:
   ```bash
   docker compose down --volumes
   ```

2. **Clean Docker system**:
   ```bash
   docker system prune -a
   ```

3. **Restore from backup**:
   - Restore database
   - Restore configuration files
   - Rebuild containers

4. **Restart services**:
   ```bash
   ./start-production.sh
   ```

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review Docker and COTURN logs
3. Test individual components
4. Verify network connectivity

---

**Note**: This setup is optimized for ngrok deployment. For production deployment on dedicated servers, additional security and performance configurations are recommended.
