# Metered TURN Server Integration - Deployment Guide

## Overview
This guide explains how to deploy the MediaSoup Video Call application with Metered TURN server integration for reliable WebRTC connectivity on Heroku and other cloud platforms.

## Metered TURN Server Configuration

### Credentials
- **Host**: standard.relay.metered.ca
- **Username**: 0f1eee4f1c2a872fbb855d62
- **Password**: q6s07WgG7GLIq6WM
- **Ports**: 80 (UDP/TCP), 443 (TURNS/TLS)

### Integration Points
All configuration files have been updated with these credentials:

1. **Backend Configuration**: `videocallbackend/.env`
2. **Heroku App Config**: `app.json`
3. **MediaSoup Heroku Config**: `videocallbackend/src/config/mediasoup.heroku.ts`
4. **Frontend Environment**: `videocall/.env.local`
5. **Deployment Script**: `scripts/deploy-heroku.ps1`

## Quick Deployment Options

### Option 1: Automated Heroku Deployment
```powershell
# Navigate to project root
cd h:\mediasoup-video-call

# Run automated deployment script
.\scripts\deploy-heroku.ps1
```

### Option 2: Manual Heroku Deployment
```powershell
# 1. Create Heroku app
heroku create your-app-name

# 2. Add required add-ons
heroku addons:create heroku-postgresql:essential-0
heroku addons:create heroku-redis:mini

# 3. Set environment variables
heroku config:set TURN_SERVER_HOST=standard.relay.metered.ca
heroku config:set TURN_SERVER_PORT=80
heroku config:set TURN_USERNAME=0f1eee4f1c2a872fbb855d62
heroku config:set TURN_PASSWORD=q6s07WgG7GLIq6WM

# 4. Deploy
git add .
git commit -m "Deploy with Metered TURN integration"
git push heroku main
```

### Option 3: One-Click Deploy
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/your-username/mediasoup-video-call)

The `app.json` file is pre-configured with Metered TURN credentials.

## Testing TURN Server Integration

### 1. Local Development Test
```powershell
# Start local development servers
cd videocallbackend; bun run dev
# In new terminal:
cd videocall; bun run dev

# Open browser and navigate to:
# http://localhost:3000/turn-test
```

### 2. Production Deployment Test
```powershell
# After deployment, test TURN connectivity
# Visit: https://your-app-name.herokuapp.com/turn-test
```

### 3. Manual WebRTC Test
1. Open browser console
2. Run the following code:
```javascript
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
  if (event.candidate) {
    console.log('ICE Candidate:', event.candidate.candidate);
    if (event.candidate.candidate.includes('relay')) {
      console.log('✅ TURN server is working!');
    }
  }
};

pc.createDataChannel('test');
pc.createOffer().then(offer => pc.setLocalDescription(offer));
```

## Configuration Files Updated

### 1. Backend Environment (videocallbackend/.env)
```env
TURN_SERVER_HOST=standard.relay.metered.ca
TURN_SERVER_PORT=80
TURN_USERNAME=0f1eee4f1c2a872fbb855d62
TURN_PASSWORD=q6s07WgG7GLIq6WM
```

### 2. Heroku App Configuration (app.json)
```json
{
  "env": {
    "TURN_SERVER_HOST": {
      "value": "standard.relay.metered.ca"
    },
    "TURN_USERNAME": {
      "value": "0f1eee4f1c2a872fbb855d62"
    },
    "TURN_PASSWORD": {
      "value": "q6s07WgG7GLIq6WM"
    }
  }
}
```

### 3. Frontend Environment (videocall/.env.local)
```env
NEXT_PUBLIC_TURN_SERVER_HOST=standard.relay.metered.ca
NEXT_PUBLIC_TURN_USERNAME=0f1eee4f1c2a872fbb855d62
NEXT_PUBLIC_TURN_PASSWORD=q6s07WgG7GLIq6WM
```

### 4. MediaSoup Configuration (videocallbackend/src/config/mediasoup.heroku.ts)
Comprehensive ICE server configuration with multiple TURN endpoints:
- UDP: `turn:standard.relay.metered.ca:80`
- TCP: `turn:standard.relay.metered.ca:80?transport=tcp`
- TURNS: `turns:standard.relay.metered.ca:443?transport=tcp`

### 5. Frontend TURN Service (videocall/src/config/turnConfig.ts)
Client-side TURN configuration with connectivity testing utilities.

## Verification Steps

### 1. Check Backend TURN Integration
```bash
# Verify MediaSoup config includes TURN servers
grep -r "standard.relay.metered.ca" videocallbackend/src/config/
```

### 2. Check Frontend TURN Integration
```bash
# Verify frontend can access TURN configuration
grep -r "NEXT_PUBLIC_TURN" videocall/
```

### 3. Test Real Video Call
1. Deploy to Heroku using one of the methods above
2. Open the app URL in two different browsers/devices
3. Join the same room
4. Enable camera/microphone
5. Verify video streams are visible between participants

## Troubleshooting

### TURN Server Not Working
1. Check browser console for ICE candidate logs
2. Verify no relay candidates are generated
3. Check environment variables are set correctly
4. Test with manual WebRTC code (provided above)

### Video Call Not Working
1. Check browser console for MediaSoup errors
2. Verify backend is receiving TURN configuration
3. Check that participants can see each other's video tiles
4. Ensure camera/microphone permissions are granted

### Heroku Deployment Issues
1. Check Heroku logs: `heroku logs --tail`
2. Verify environment variables: `heroku config`
3. Ensure all add-ons are provisioned: `heroku addons`
4. Check build logs for any compilation errors

## Performance Optimization

### 1. MediaSoup Configuration
- Reduced port ranges for Heroku compatibility
- Optimized bandwidth settings for cloud deployment
- TCP-focused transport configuration

### 2. TURN Server Optimization
- Multiple TURN endpoints (UDP, TCP, TURNS)
- Fallback to different ports (80, 443)
- Comprehensive ICE server configuration

### 3. Connection Reliability
- STUN servers for NAT detection
- Multiple relay options for network diversity
- Proper error handling and reconnection logic

## Cost Considerations

### Metered TURN Service
- Pay-per-use model based on bandwidth
- No monthly fees for low usage
- Automatic scaling for high traffic

### Heroku Hosting
- Basic tier: ~$7/month for backend
- Essential PostgreSQL: ~$5/month
- Mini Redis: ~$3/month
- **Total**: ~$15/month for basic deployment

## Security Notes

1. **Credential Security**: TURN credentials are included in client code
2. **Domain Restrictions**: Configure Metered dashboard for domain restrictions
3. **Rate Limiting**: Monitor usage to prevent abuse
4. **HTTPS Only**: Ensure all traffic uses HTTPS in production

## Next Steps

1. **Deploy**: Use automated script or manual deployment
2. **Test**: Verify TURN connectivity and video calls work
3. **Monitor**: Check Metered dashboard for usage statistics
4. **Scale**: Upgrade Heroku dynos if needed for traffic
5. **Optimize**: Fine-tune MediaSoup settings based on usage patterns

The application is now fully configured with Metered TURN server integration and ready for cloud deployment with reliable WebRTC connectivity.