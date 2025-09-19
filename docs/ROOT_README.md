# MediaSoup Video Call Application

A complete video calling application built with MediaSoup, Next.js, and Socket.IO, featuring Google Meet-like functionality.

## 🚀 Quick Start

### Running Both Frontend and Backend Together

```bash
# Install all dependencies for both projects
npm run install:all

# Start both frontend and backend servers concurrently
npm run dev
```

This will start:
- **Backend Server**: http://localhost:3001 (API + Socket.IO)
- **Frontend Server**: http://localhost:3000 (Next.js App)

### Running Servers Individually

```bash
# Backend only (port 3001)
npm run backend:only

# Frontend only (port 3000)
npm run frontend:only
```

### Other Available Commands

```bash
# Install dependencies for both projects
npm run install:all

# Build both projects for production
npm run build

# Start production servers (after build)
npm run start

# Clean build artifacts and node_modules
npm run clean

# Pretty output with colors and prefixes
npm run dev:pretty
```

## 📁 Project Structure

```
mediasoup-video-call/
├── videocallbackend/          # Node.js/Express backend
│   ├── src/                   # Backend source code
│   ├── package.json           # Backend dependencies
│   └── .env                   # Backend environment variables
├── videocall/                 # Next.js frontend
│   ├── src/                   # Frontend source code
│   ├── package.json           # Frontend dependencies
│   └── .env.local             # Frontend environment variables
├── VideoCallApp/              # React Native mobile app
├── turn-server/               # TURN server for WebRTC
├── package.json               # Root package.json with concurrently scripts
└── docker-compose.yml         # Docker services
```

## 🔧 Configuration

### Environment Variables

**Backend (videocallbackend/.env):**
```
PORT=3001
CORS_ORIGINS=http://localhost:3000
NODE_ENV=development
```

**Frontend (videocall/.env.local):**
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=MediaSoup Video Call
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 🌟 Features

- ✅ Google Meet-like interface
- ✅ Pre-join screen with device selection
- ✅ Enhanced control panel with all meeting controls
- ✅ Participant management panel
- ✅ Advanced settings panel
- ✅ Real-time video/audio communication
- ✅ Screen sharing capabilities
- ✅ Chat functionality
- ✅ Hand raise feature
- ✅ Host controls (mute, remove, spotlight participants)

## 🛠️ Development

The setup uses `concurrently` to run both servers simultaneously with proper process management:

- **Kill on Fail**: If one server crashes, both will be stopped
- **Color-coded Output**: Backend (blue) and Frontend (magenta) outputs are differentiated
- **Process Prefixes**: Clear labeling of which server is producing which output

## 📚 API Documentation

When the backend is running, visit:
- **Swagger UI**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/api/v1/health

## 🔌 WebRTC & Socket.IO

The application uses:
- **MediaSoup**: For WebRTC media handling
- **Socket.IO**: For real-time signaling
- **TURN Server**: For NAT traversal (if configured)

## 📱 Mobile App

The `VideoCallApp/` directory contains a React Native version of the application.

## 🐳 Docker Support

Use the included `docker-compose.yml` for containerized deployment:

```bash
docker-compose up
```
