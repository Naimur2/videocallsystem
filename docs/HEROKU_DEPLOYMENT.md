# Heroku Deployment Guide for MediaSoup Video Call

## Important Considerations for MediaSoup on Heroku

### ⚠️ **Critical Limitations**

1. **UDP Port Restrictions**: Heroku doesn't support custom UDP ports for WebRTC
2. **Ephemeral File System**: No persistent storage for recordings
3. **Dyno Sleeping**: Free/hobby dynos sleep after 30 minutes of inactivity
4. **Port Binding**: Only supports HTTP/HTTPS on port assigned by Heroku

### 🔧 **Solutions for MediaSoup on Heroku**

1. **Use TURN Server**: External TURN server for WebRTC relay
2. **TCP Fallback**: Configure MediaSoup for TCP-only mode
3. **External Services**: Use external providers for TURN/STUN
4. **Database Add-ons**: Heroku Postgres and Redis

## Architecture Overview

```
Internet → Heroku Load Balancer → Web Dyno (Frontend + Backend)
                                       ↓
                               Heroku Postgres + Redis
                                       ↓
                            External TURN Server (Twilio/Xirsys)
```

## Step 1: Prepare Application for Heroku

### 1.1 Create Heroku Configuration Files

#### `Procfile` (Root directory)
```
web: npm start
release: npm run db:migrate
```

#### `app.json` (For Heroku Button deployment)
```json
{
  "name": "MediaSoup Video Call",
  "description": "Real-time video calling application with MediaSoup WebRTC",
  "repository": "https://github.com/yourusername/mediasoup-video-call",
  "logo": "https://your-logo-url.com/logo.png",
  "keywords": ["video", "webrtc", "mediasoup", "nodejs", "nextjs"],
  "image": "heroku/nodejs",
  "addons": [
    "heroku-postgresql:mini",
    "heroku-redis:mini"
  ],
  "env": {
    "NODE_ENV": "production",
    "MEDIASOUP_LISTEN_IP": "0.0.0.0",
    "MEDIASOUP_ANNOUNCED_IP": {
      "description": "Public IP for WebRTC (will be set automatically)",
      "required": false
    },
    "TURN_SERVER_HOST": {
      "description": "External TURN server hostname (e.g., Twilio/Xirsys)",
      "required": true
    },
    "TURN_SERVER_PORT": {
      "description": "TURN server port (usually 3478)",
      "value": "3478"
    },
    "TURN_USERNAME": {
      "description": "TURN server username",
      "required": true
    },
    "TURN_PASSWORD": {
      "description": "TURN server password",
      "required": true
    }
  },
  "formation": {
    "web": {
      "quantity": 1,
      "size": "standard-1x"
    }
  },
  "buildpacks": [
    {
      "url": "heroku/nodejs"
    }
  ]
}
```

#### `package.json` (Root directory - Combined app)
```json
{
  "name": "mediasoup-video-call-heroku",
  "version": "1.0.0",
  "description": "MediaSoup Video Call Application for Heroku",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd videocall && npm install && npm run build",
    "build:backend": "cd videocallbackend && npm install && npm run build",
    "dev": "node server.js",
    "db:migrate": "echo 'Database migration placeholder'",
    "heroku-postbuild": "npm run build"
  },
  "dependencies": {
    "express": "^4.18.2",
    "express-static-gzip": "^2.1.7",
    "path": "^0.12.7"
  },
  "engines": {
    "node": "20.x",
    "npm": "10.x"
  },
  "keywords": ["video", "webrtc", "mediasoup", "heroku"],
  "author": "Your Name",
  "license": "MIT"
}
```

### 1.2 Create Heroku Server (Combined Frontend + Backend)

#### `server.js` (Root directory)
```javascript
const express = require('express');
const path = require('path');
const compression = require('express-static-gzip');

const app = express();
const PORT = process.env.PORT || 3000;

// Import backend server
const backendApp = require('./videocallbackend/dist/app');

// Serve compressed static files for frontend
app.use(compression(path.join(__dirname, 'videocall/out'), {
  enableBrotli: true,
  orderPreference: ['br', 'gz']
}));

// API routes (backend)
app.use('/api', backendApp);
app.use('/socket.io', backendApp);

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'videocall/out/index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MediaSoup app running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 Backend API: http://localhost:${PORT}/api`);
});
```

## Step 2: Modify MediaSoup Configuration for Heroku

### 2.1 Update Backend MediaSoup Config

#### `videocallbackend/src/config/mediasoup.heroku.ts`
```typescript
import { RtpCodecCapability, TransportListenIp, WorkerLogLevel } from "mediasoup/node/lib/types";

export const mediasoupConfig = {
  // Worker settings
  worker: {
    rtcMinPort: parseInt(process.env.RTC_MIN_PORT || '40000'),
    rtcMaxPort: parseInt(process.env.RTC_MAX_PORT || '40099'), // Smaller range
    logLevel: (process.env.MEDIASOUP_LOG_LEVEL as WorkerLogLevel) || 'warn',
    logTags: [
      'info',
      'ice',
      'dtls',
      'rtp',
      'srtp',
      'rtcp',
    ],
  },

  // Router settings
  router: {
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000,
        },
      },
      {
        kind: 'video',
        mimeType: 'video/h264',
        clockRate: 90000,
        parameters: {
          'packetization-mode': 1,
          'profile-level-id': '4d0032',
          'level-asymmetry-allowed': 1,
          'x-google-start-bitrate': 1000,
        },
      },
    ] as RtpCodecCapability[],
  },

  // WebRTC transport settings for Heroku
  webRtcTransport: {
    listenIps: [
      {
        ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
        announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || undefined,
      },
    ] as TransportListenIp[],
    maxIncomingBitrate: 1500000,
    initialAvailableOutgoingBitrate: 1000000,
    minimumAvailableOutgoingBitrate: 600000,
    maxSctpMessageSize: 262144,
    // Use TCP for Heroku compatibility
    enableUdp: false,
    enableTcp: true,
    preferUdp: false,
    preferTcp: true,
  },

  // Plain transport settings (for recording, etc.)
  plainTransport: {
    listenIp: {
      ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
      announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || undefined,
    } as TransportListenIp,
    maxSctpMessageSize: 262144,
  },
};
```

### 2.2 Update Environment Variables for Heroku

#### `.env.heroku` (Example environment)
```env
# Heroku Configuration
NODE_ENV=production
PORT=3000

# Database (Heroku will provide these)
DATABASE_URL=postgres://username:password@hostname:port/database
REDIS_URL=redis://username:password@hostname:port

# MediaSoup Configuration for Heroku
MEDIASOUP_LISTEN_IP=0.0.0.0
MEDIASOUP_ANNOUNCED_IP=  # Will be set by Heroku
RTC_MIN_PORT=40000
RTC_MAX_PORT=40099
MEDIASOUP_LOG_LEVEL=warn

# External TURN Server (Required for Heroku)
TURN_SERVER_HOST=turn.example.com
TURN_SERVER_PORT=3478
TURN_USERNAME=your-turn-username
TURN_PASSWORD=your-turn-password

# CORS
CORS_ORIGIN=https://your-app-name.herokuapp.com
ALLOWED_ORIGINS=https://your-app-name.herokuapp.com,https://*.herokuapp.com

# Frontend URLs
NEXT_PUBLIC_BACKEND_URL=https://your-app-name.herokuapp.com/api
NEXT_PUBLIC_SOCKET_URL=https://your-app-name.herokuapp.com
NEXT_PUBLIC_TURN_SERVER_HOST=turn.example.com
NEXT_PUBLIC_TURN_SERVER_PORT=3478
NEXT_PUBLIC_TURN_USERNAME=your-turn-username
NEXT_PUBLIC_TURN_PASSWORD=your-turn-password
```

## Step 3: External TURN Server Options

### Option 1: Twilio TURN Service
```javascript
// TURN configuration for Twilio
const turnConfig = {
  iceServers: [
    {
      urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
      username: process.env.TWILIO_TURN_USERNAME,
      credential: process.env.TWILIO_TURN_CREDENTIAL,
    },
    {
      urls: 'turn:global.turn.twilio.com:3478?transport=udp',
      username: process.env.TWILIO_TURN_USERNAME,
      credential: process.env.TWILIO_TURN_CREDENTIAL,
    },
    {
      urls: 'turn:global.turn.twilio.com:443?transport=tcp',
      username: process.env.TWILIO_TURN_USERNAME,
      credential: process.env.TWILIO_TURN_CREDENTIAL,
    }
  ]
};
```

### Option 2: Xirsys TURN Service
```javascript
// TURN configuration for Xirsys
const turnConfig = {
  iceServers: [
    {
      urls: 'turn:us-turn.xirsys.com:80?transport=tcp',
      username: process.env.XIRSYS_USERNAME,
      credential: process.env.XIRSYS_CREDENTIAL,
    },
    {
      urls: 'turn:us-turn.xirsys.com:3478?transport=tcp',
      username: process.env.XIRSYS_USERNAME,
      credential: process.env.XIRSYS_CREDENTIAL,
    }
  ]
};
```

### Option 3: Self-hosted TURN on DigitalOcean/AWS
```bash
# Deploy COTURN on a separate VPS
docker run -d --name=coturn \
  --net=host \
  -v /etc/coturn:/etc/coturn \
  coturn/coturn:latest \
  -n \
  --log-file=stdout \
  --external-ip=YOUR_VPS_IP \
  --listening-port=3478 \
  --relay-device=eth0 \
  --user=mediasoup:mediasoup123 \
  --realm=turn.yourdomain.com
```

## Step 4: Deployment Scripts

### 4.1 PowerShell Deployment Script

#### `scripts/deploy-heroku.ps1`
```powershell
param(
    [string]$AppName = "mediasoup-video-call",
    [string]$Region = "us",
    [string]$TurnServerHost = "",
    [string]$TurnUsername = "",
    [string]$TurnPassword = ""
)

Write-Host "🚀 Deploying MediaSoup Video Call to Heroku..." -ForegroundColor Blue

# Check prerequisites
function Test-Prerequisites {
    try {
        heroku --version | Out-Null
        git --version | Out-Null
        Write-Host "✅ Prerequisites checked" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Missing required tools. Please install Heroku CLI and Git." -ForegroundColor Red
        exit 1
    }
}

# Create Heroku app
function New-HerokuApp {
    Write-Host "📱 Creating Heroku app: $AppName" -ForegroundColor Yellow
    
    $appExists = heroku apps:info $AppName 2>$null
    if (!$appExists) {
        heroku create $AppName --region=$Region
        Write-Host "✅ Heroku app created" -ForegroundColor Green
    } else {
        Write-Host "⚠️  App $AppName already exists" -ForegroundColor Yellow
    }
}

# Add Heroku add-ons
function Add-HerokuAddons {
    Write-Host "🔌 Adding Heroku add-ons..." -ForegroundColor Yellow
    
    # PostgreSQL
    heroku addons:create heroku-postgresql:mini -a $AppName
    
    # Redis
    heroku addons:create heroku-redis:mini -a $AppName
    
    Write-Host "✅ Add-ons configured" -ForegroundColor Green
}

# Set environment variables
function Set-HerokuConfig {
    Write-Host "⚙️  Setting environment variables..." -ForegroundColor Yellow
    
    heroku config:set NODE_ENV=production -a $AppName
    heroku config:set MEDIASOUP_LISTEN_IP=0.0.0.0 -a $AppName
    heroku config:set RTC_MIN_PORT=40000 -a $AppName
    heroku config:set RTC_MAX_PORT=40099 -a $AppName
    heroku config:set MEDIASOUP_LOG_LEVEL=warn -a $AppName
    
    if ($TurnServerHost) {
        heroku config:set TURN_SERVER_HOST=$TurnServerHost -a $AppName
        heroku config:set TURN_USERNAME=$TurnUsername -a $AppName
        heroku config:set TURN_PASSWORD=$TurnPassword -a $AppName
        heroku config:set NEXT_PUBLIC_TURN_SERVER_HOST=$TurnServerHost -a $AppName
        heroku config:set NEXT_PUBLIC_TURN_USERNAME=$TurnUsername -a $AppName
        heroku config:set NEXT_PUBLIC_TURN_PASSWORD=$TurnPassword -a $AppName
    }
    
    $appUrl = "https://$AppName.herokuapp.com"
    heroku config:set CORS_ORIGIN=$appUrl -a $AppName
    heroku config:set NEXT_PUBLIC_BACKEND_URL="$appUrl/api" -a $AppName
    heroku config:set NEXT_PUBLIC_SOCKET_URL=$appUrl -a $AppName
    
    Write-Host "✅ Environment variables set" -ForegroundColor Green
}

# Deploy to Heroku
function Deploy-ToHeroku {
    Write-Host "🚀 Deploying to Heroku..." -ForegroundColor Yellow
    
    # Initialize git if needed
    if (!(Test-Path ".git")) {
        git init
        git add .
        git commit -m "Initial commit for Heroku deployment"
    }
    
    # Add Heroku remote
    heroku git:remote -a $AppName
    
    # Deploy
    git push heroku main
    
    Write-Host "✅ Deployment completed" -ForegroundColor Green
}

# Scale dynos
function Set-HerokuScale {
    Write-Host "📈 Scaling dynos..." -ForegroundColor Yellow
    
    heroku ps:scale web=1 -a $AppName
    
    Write-Host "✅ Dynos scaled" -ForegroundColor Green
}

# Open app
function Open-HerokuApp {
    Write-Host "🌐 Opening app in browser..." -ForegroundColor Yellow
    heroku open -a $AppName
}

# Main execution
Test-Prerequisites

if (!$TurnServerHost) {
    Write-Host "⚠️  No TURN server specified. You'll need to configure one for WebRTC to work behind NAT." -ForegroundColor Yellow
    Write-Host "Consider using Twilio, Xirsys, or deploying your own COTURN server." -ForegroundColor Yellow
}

New-HerokuApp
Add-HerokuAddons
Set-HerokuConfig
Deploy-ToHeroku
Set-HerokuScale

Write-Host "🎉 MediaSoup Video Call deployed to Heroku!" -ForegroundColor Green
Write-Host "📱 App URL: https://$AppName.herokuapp.com" -ForegroundColor Cyan
Write-Host "📊 Monitor: heroku logs --tail -a $AppName" -ForegroundColor Cyan

Open-HerokuApp
```

### 4.2 Package.json for Combined App

#### Update root `package.json`:
```json
{
  "name": "mediasoup-video-call-heroku",
  "version": "1.0.0",
  "description": "MediaSoup Video Call Application for Heroku",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js",
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "cd videocallbackend && npm install --legacy-peer-deps && npm run build",
    "build:frontend": "cd videocall && npm install --legacy-peer-deps && npm run build",
    "heroku-postbuild": "npm run build",
    "test": "echo 'No tests specified'",
    "db:migrate": "echo 'Database migrations would run here'"
  },
  "dependencies": {
    "express": "^4.18.2",
    "express-static-gzip": "^2.1.7",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "helmet": "^7.1.0"
  },
  "engines": {
    "node": "20.x",
    "npm": "10.x"
  },
  "keywords": ["video", "webrtc", "mediasoup", "heroku", "nodejs", "nextjs"],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/mediasoup-video-call.git"
  }
}
```

## Step 5: Quick Deployment Commands

### One-Click Deploy
```powershell
# Run the deployment script
cd h:\mediasoup-video-call
.\scripts\deploy-heroku.ps1 -AppName "your-app-name" -TurnServerHost "turn.example.com" -TurnUsername "username" -TurnPassword "password"
```

### Manual Deployment
```powershell
# Install Heroku CLI first: https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Add add-ons
heroku addons:create heroku-postgresql:mini
heroku addons:create heroku-redis:mini

# Set config vars
heroku config:set NODE_ENV=production
heroku config:set MEDIASOUP_LISTEN_IP=0.0.0.0
heroku config:set TURN_SERVER_HOST=your-turn-server.com
heroku config:set TURN_USERNAME=username
heroku config:set TURN_PASSWORD=password

# Deploy
git init
git add .
git commit -m "Deploy to Heroku"
heroku git:remote -a your-app-name
git push heroku main

# Scale
heroku ps:scale web=1

# Open
heroku open
```

## Limitations and Alternatives

### Heroku Limitations for MediaSoup:
1. **No UDP support** - Must use TCP or external TURN
2. **Ephemeral filesystem** - No file storage for recordings
3. **30-second request timeout** - May affect long-running operations
4. **Dyno sleeping** - Free tier sleeps after 30 minutes

### Better Alternatives for MediaSoup:
1. **DigitalOcean App Platform** - Better for real-time apps
2. **Railway** - Modern Heroku alternative with UDP support
3. **Render** - Good for Node.js apps with WebSocket support
4. **Google Cloud Run** - Serverless with custom containers

## Cost Comparison (Monthly)

| Platform | Basic | Production | High Traffic |
|----------|--------|------------|--------------|
| **Heroku** | $7-25 | $50-200 | $200-500 |
| **Railway** | $5-20 | $30-150 | $150-400 |
| **DigitalOcean** | $12-50 | $40-200 | $200-600 |
| **Google Cloud** | $10-30 | $50-300 | $300-1000 |

**Recommendation**: For MediaSoup specifically, consider **Railway** or **DigitalOcean App Platform** as they better support WebRTC requirements.

Would you like me to create deployment guides for these alternatives as well?