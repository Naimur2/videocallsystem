# Cloudflare Tunnel + Metered TURN Hybrid Setup Guide

## Overview
This hybrid approach combines the best of both worlds:
- **Cloudflare Tunnel**: Secure external access without port forwarding or VPS
- **Metered TURN Servers**: Professional WebRTC connectivity for reliable video calls
- **Local Development**: Full control over your application stack

## Architecture

```
Internet Users
     ↓
Cloudflare Tunnel (meet.naimur-rahaman.comm)
     ↓
Nginx Proxy (Port 80)
     ↓
├── Frontend (Next.js on Port 3000)
└── Backend (Express.js on Port 3001)
     ↓
MediaSoup WebRTC
     ↓
Metered TURN Servers (standard.relay.metered.ca)
```

## Key Benefits

### 1. **No VPS/Hosting Costs**
- Run everything locally on your development machine
- No monthly hosting fees for basic testing and development
- Scale to cloud hosting only when needed

### 2. **Production-Grade WebRTC**
- Metered TURN servers ensure connectivity behind NAT/firewalls
- Professional ICE server configuration
- Reliable video calls for users worldwide

### 3. **Secure External Access**
- Cloudflare tunnel provides encrypted access
- No need to open firewall ports
- Built-in DDoS protection from Cloudflare

### 4. **Easy Development**
- Full access to logs and debugging
- Hot reload during development
- No deployment delays for testing

## Quick Start

### 1. **One-Command Startup**
```powershell
# Start everything (backend, frontend, tunnel)
.\start-hybrid.ps1

# Start without tunnel (local only)
.\start-hybrid.ps1 -SkipTunnel

# Start in background mode
.\start-hybrid.ps1 -Background
```

### 2. **Check Status**
```powershell
# View service status
.\start-hybrid.ps1 -Status

# Stop all services
.\start-hybrid.ps1 -Stop
```

### 3. **Access Your App**
- **Local**: http://localhost:3000
- **External**: https://meet.naimur-rahaman.comm
- **TURN Test**: http://localhost:3000/turn-test

## Configuration Details

### Automatic Environment Setup
The hybrid script automatically configures:

**Backend (.env)**:
```env
NODE_ENV=development
PORT=3001
CORS_ORIGIN=https://meet.naimur-rahaman.comm
TURN_SERVER_HOST=standard.relay.metered.ca
TURN_SERVER_PORT=80
TURN_USERNAME=0f1eee4f1c2a872fbb855d62
TURN_PASSWORD=q6s07WgG7GLIq6WM
```

**Frontend (.env.local)**:
```env
NEXT_PUBLIC_BACKEND_URL=https://meet.naimur-rahaman.comm/api
NEXT_PUBLIC_SOCKET_URL=https://meet.naimur-rahaman.comm
NEXT_PUBLIC_TURN_SERVER_HOST=standard.relay.metered.ca
NEXT_PUBLIC_TURN_USERNAME=0f1eee4f1c2a872fbb855d62
NEXT_PUBLIC_TURN_PASSWORD=q6s07WgG7GLIq6WM
```

### Nginx Routing
- `/` → Frontend (Next.js)
- `/api` → Backend (Express.js) 
- `/socket.io` → Backend (Socket.IO)
- TURN traffic → Directly to Metered servers (bypasses nginx)

### MediaSoup Integration
- **Local MediaSoup**: Handles SFU logic and media routing
- **Metered TURN**: Provides ICE servers for WebRTC connectivity
- **Cloudflare Tunnel**: Routes signaling traffic securely

## Testing the Setup

### 1. **Service Health Check**
```powershell
# Check if all services are running
.\start-hybrid.ps1 -Status
```

### 2. **TURN Server Test**
```powershell
# Visit the TURN test page
Start-Process "http://localhost:3000/turn-test"
```

### 3. **Multi-User Test**
1. Start the hybrid setup: `.\start-hybrid.ps1`
2. Open external URL: https://meet.naimur-rahaman.comm
3. Create a room and note the room ID
4. Open the same room in a different browser/device
5. Test video/audio sharing between participants

### 4. **Network Connectivity Test**
```javascript
// Run in browser console to test TURN servers
const pc = new RTCPeerConnection({
  iceServers: [
    {
      urls: "turn:standard.relay.metered.ca:80",
      username: "0f1eee4f1c2a872fbb855d62",
      credential: "q6s07WgG7GLIq6WM"
    }
  ]
});

pc.onicecandidate = (event) => {
  if (event.candidate && event.candidate.candidate.includes('relay')) {
    console.log('✅ TURN server working!');
  }
};

pc.createDataChannel('test');
pc.createOffer().then(offer => pc.setLocalDescription(offer));
```

## Troubleshooting

### Common Issues

#### 1. **Cloudflare Tunnel Not Starting**
```powershell
# Check if cloudflared is installed
cloudflared --version

# Check tunnel token
.\start-cloudflare-tunnel.ps1 -Status
```

#### 2. **Backend Not Accessible**
- Check if port 3001 is free: `netstat -ano | findstr :3001`
- Verify CORS settings in backend .env
- Check nginx routing configuration

#### 3. **Frontend Build Errors**
```powershell
# Clean and reinstall dependencies
cd videocall
Remove-Item node_modules -Recurse -Force
Remove-Item .next -Recurse -Force
bun install
```

#### 4. **TURN Servers Not Working**
- Test Metered credentials in browser console
- Check network firewall settings
- Verify environment variables are loaded

#### 5. **Video Calls Not Connecting**
- Check browser console for WebRTC errors
- Verify both participants can access the external URL
- Test with different browsers/networks
- Check MediaSoup backend logs

### Debug Mode

#### Enable Verbose Logging
```powershell
# Backend with debug
cd videocallbackend
$env:DEBUG="mediasoup*"
bun run dev

# Frontend with debug
cd videocall
$env:DEBUG="*"
bun run dev
```

#### Check Service Logs
```powershell
# View running processes
Get-Process | Where-Object {$_.ProcessName -eq "node"}

# Check network connections
netstat -ano | findstr -i listen
```

## Cost Analysis

### Development Phase (Free)
- **Cloudflare Tunnel**: Free tier (no bandwidth limits for development)
- **Metered TURN**: Pay-per-use (minimal cost for testing)
- **Local Hosting**: Your own hardware
- **Total**: ~$2-5/month for development testing

### Production Scaling Options

#### Option 1: Continue Hybrid
- **Cloudflare Tunnel**: Free/Pro ($20/month for advanced features)
- **Metered TURN**: ~$10-50/month based on usage
- **Local Hardware**: Your existing setup
- **Total**: ~$10-70/month

#### Option 2: Scale to Cloud
- **Heroku**: ~$15/month (basic dynos + add-ons)
- **Google Cloud**: ~$30-100/month (GKE cluster)
- **AWS**: ~$25-80/month (ECS/EKS)
- **Metered TURN**: ~$10-50/month

## Security Considerations

### 1. **Cloudflare Protection**
- DDoS protection included
- SSL/TLS encryption enforced
- Rate limiting configured in nginx

### 2. **TURN Server Security**
- Credentials are visible in client code (normal for TURN)
- Configure domain restrictions in Metered dashboard
- Monitor usage to prevent abuse

### 3. **Local Security**
- Backend only accessible via tunnel
- No direct port exposure to internet
- Environment variables properly configured

## Performance Optimization

### 1. **Nginx Optimization**
- Connection pooling enabled
- Gzip compression configured
- Static asset caching
- Keep-alive connections

### 2. **MediaSoup Settings**
- Optimized for local development
- Bandwidth settings tuned for cable/fiber internet
- Multiple ICE server endpoints

### 3. **Cloudflare Settings**
- HTTP/2 enabled by default
- Edge caching for static assets
- Global CDN distribution

## Next Steps

1. **Test the Setup**: Run `.\start-hybrid.ps1` and test video calls
2. **Monitor Usage**: Check Metered dashboard for TURN usage
3. **Optimize Settings**: Adjust MediaSoup configuration based on testing
4. **Scale When Ready**: Move to cloud hosting if needed
5. **Add Features**: Implement recording, screen sharing, etc.

This hybrid setup gives you the best of both worlds - the simplicity of local development with the reliability of professional infrastructure for WebRTC connectivity!