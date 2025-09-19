# Docker Development Environment

This Docker setup provides a complete development environment for the MediaSoup Video Call application with all necessary services.

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed and running
- Windows PowerShell (for the scripts)

### Start Development Environment

```powershell
# Start all services
.\start-dev.ps1
```

This will start:

- **Frontend** (Next.js) on port 3002
- **Backend** (Express + MediaSoup) on port 3001
- **TURN Server** on port 3478
- **Redis** on port 6379
- **PostgreSQL** on port 5433
- **Development Tools** (Redis Insight, Adminer)

### Stop Development Environment

```powershell
# Stop all services
.\stop-dev.ps1
```

## 🛠️ Services Overview

| Service       | Port | Purpose                   | Access URL                  |
| ------------- | ---- | ------------------------- | --------------------------- |
| Frontend      | 3002 | Next.js Video Call UI     | http://localhost:3002       |
| Backend       | 3001 | Socket.IO + MediaSoup API | http://localhost:3001       |
| TURN Server   | 3478 | WebRTC relay server       | turn:localhost:3478         |
| Redis         | 6379 | Session storage           | redis://localhost:6379      |
| PostgreSQL    | 5433 | Database                  | postgresql://localhost:5433 |
| Redis Insight | 8001 | Redis GUI                 | http://localhost:8001       |
| Adminer       | 8080 | Database GUI              | http://localhost:8080       |
| Nginx Proxy   | 80   | Development proxy         | http://localhost            |

## 🔧 Development Commands

### View Logs

```powershell
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f frontend
docker-compose -f docker-compose.dev.yml logs -f backend
```

### Restart Services

```powershell
# Restart specific service
docker-compose -f docker-compose.dev.yml restart frontend
docker-compose -f docker-compose.dev.yml restart backend
```

### Access Container Shell

```powershell
# Frontend container
docker-compose -f docker-compose.dev.yml exec frontend sh

# Backend container
docker-compose -f docker-compose.dev.yml exec backend sh
```

### Rebuild Services

```powershell
# Rebuild and restart
docker-compose -f docker-compose.dev.yml up --build -d
```

## 🌐 Testing Multi-Tab Functionality

1. **Start the environment**: `.\start-dev.ps1`
2. **Open frontend**: http://localhost:3002
3. **Create a meeting** in one tab
4. **Copy the meeting URL** and open it in another tab
5. **Verify** that the first tab shows the "Meeting switched" message

## 🔍 Debugging

### Check Service Health

```powershell
# Check all container status
docker-compose -f docker-compose.dev.yml ps

# Check specific service health
docker inspect --format='{{.State.Health.Status}}' mediasoup-frontend-dev
```

### Database Access

- **Adminer**: http://localhost:8080
  - Server: `postgres`
  - Username: `mediasoup`
  - Password: `mediasoup_password`
  - Database: `mediasoup`

### Redis Access

- **Redis Insight**: http://localhost:8001
- **Connection**: `redis://localhost:6379`

## 🐛 Troubleshooting

### Port Conflicts

If you get port conflict errors:

```powershell
# Check what's using the ports
netstat -ano | findstr ":3001 :3002 :6379 :5433"

# Stop the conflicting processes or use different ports
```

### Container Won't Start

```powershell
# Check logs for errors
docker-compose -f docker-compose.dev.yml logs [service-name]

# Rebuild from scratch
docker-compose -f docker-compose.dev.yml down --rmi all
docker-compose -f docker-compose.dev.yml up --build -d
```

### Permission Issues

```powershell
# Run PowerShell as Administrator if needed
# Or set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📁 File Structure

```
mediasoup-video-call/
├── docker-compose.dev.yml     # Development services
├── .env.dev                   # Environment variables template
├── start-dev.ps1             # Start script
├── stop-dev.ps1              # Stop script
├── videocall/                 # Frontend (Next.js)
│   └── Dockerfile.dev
├── videocallbackend/         # Backend (Express)
│   └── Dockerfile.dev
├── turn-server/              # TURN server
├── nginx/                    # Nginx configuration
└── coturn/                   # Alternative TURN config
```

## 🔄 Hot Reload

Both frontend and backend support hot reload:

- **Frontend**: File changes trigger automatic rebuild
- **Backend**: Uses ts-node-dev for automatic restart
- **Volumes**: Source code is mounted for live editing

## 📈 Performance Tips

1. **Increase Docker memory** allocation in Docker Desktop settings
2. **Use WSL2 backend** on Windows for better performance
3. **Close unused containers** to free up resources
4. **Monitor resource usage** with Docker Desktop dashboard

## 🤝 Team Development

Each developer can:

1. Clone the repository
2. Run `.\start-dev.ps1`
3. Start coding immediately

All services will be consistent across different machines.
