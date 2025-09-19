# Enhanced Tunnel Solutions for MediaSoup Video Call

This document describes the enhanced tunnel solutions that provide better stability and fixed URLs for external access to your MediaSoup video call application.

## 🎯 Problem Solved

The original `tunnle.js` using tunnelmole created URLs that changed with each restart, requiring manual Docker configuration updates. The enhanced solutions provide:

- **Fixed URLs** (with ngrok/cloudflared)
- **Automatic Docker configuration updates**
- **Multiple tunnel provider options**
- **Better error handling and monitoring**
- **Persistent URL storage**

## 🚀 Quick Start

### Option 1: Interactive Launcher (Recommended)

```powershell
.\start-tunnel.ps1
```

### Option 2: Direct PowerShell Script

```powershell
# Auto-select best provider
.\enhanced-tunnel.ps1

# Use specific provider
.\enhanced-tunnel.ps1 -Provider ngrok
.\enhanced-tunnel.ps1 -Provider cloudflared
.\enhanced-tunnel.ps1 -Provider tunnelmole

# Use ngrok with custom subdomain
.\enhanced-tunnel.ps1 -Provider ngrok -Subdomain mediasoup-videocall
```

### Option 3: Node.js Enhanced Script

```powershell
node enhanced-tunnel.js
```

## 📋 Tunnel Provider Comparison

| Provider        | Stability  | Fixed URL | Setup Required    | Free Tier           |
| --------------- | ---------- | --------- | ----------------- | ------------------- |
| **ngrok**       | ⭐⭐⭐⭐⭐ | ✅ Yes    | Account + Install | 1 concurrent tunnel |
| **cloudflared** | ⭐⭐⭐⭐⭐ | ✅ Yes    | Install only      | Unlimited           |
| **tunnelmole**  | ⭐⭐⭐     | ❌ No     | None              | Unlimited           |

## 🔧 Installation Requirements

### ngrok (Recommended for production)

1. Download from: https://ngrok.com/download
2. Create free account at: https://ngrok.com/signup
3. Install and authenticate:
   ```powershell
   ngrok authtoken YOUR_TOKEN
   ```

### cloudflared (Alternative stable option)

1. Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
2. No account required for basic tunneling

### tunnelmole (Already included)

- No additional setup required
- URLs change with each restart

## 📁 Files Created

| File                  | Purpose                                   |
| --------------------- | ----------------------------------------- |
| `enhanced-tunnel.ps1` | PowerShell script with multiple providers |
| `enhanced-tunnel.js`  | Node.js script with advanced features     |
| `start-tunnel.ps1`    | Interactive tunnel launcher               |
| `.tunnel-url`         | Stores current tunnel URL                 |

## 🔄 How It Works

1. **Start Tunnel**: Script tries providers in order of stability
2. **Auto-Update Docker**: Updates `docker-compose.prod.yml` with new URL
3. **Save URL**: Stores URL for reuse across restarts
4. **Monitor Health**: Checks tunnel connectivity
5. **Graceful Shutdown**: Cleans up processes on exit

## 📖 Usage Examples

### Development Workflow

```powershell
# 1. Start Docker services
docker-compose -f docker-compose.prod.yml up -d

# 2. Start tunnel (auto-updates Docker config)
.\enhanced-tunnel.ps1

# 3. Share the provided URL with external users
# 4. When done, Ctrl+C stops tunnel, containers keep running
```

### Production Setup with ngrok

```powershell
# Get fixed subdomain (requires ngrok account)
.\enhanced-tunnel.ps1 -Provider ngrok -Subdomain mediasoup-prod

# URL will be: https://mediasoup-prod.ngrok-free.app
# This URL stays the same across restarts!
```

### Cloudflare Alternative

```powershell
# Very stable, no account needed
.\enhanced-tunnel.ps1 -Provider cloudflared

# URL format: https://xyz-abc-123.trycloudflare.com
```

## 🛠️ Troubleshooting

### "ngrok not found"

- Download and install ngrok from https://ngrok.com/download
- Add to system PATH or run from ngrok directory

### "cloudflared not found"

- Download from Cloudflare's installation guide
- Add to system PATH

### "Tunnel established but can't connect"

- Check if Docker containers are running: `docker-compose -f docker-compose.prod.yml ps`
- Verify nginx is proxying correctly
- Check firewall/antivirus blocking connections

### "Docker config not updating"

- Ensure `docker-compose.prod.yml` exists
- Check file permissions
- Run PowerShell as Administrator if needed

## 🔍 Advanced Features

### Custom Configuration

```powershell
# Skip Docker auto-update
.\enhanced-tunnel.ps1 -SkipDockerUpdate

# Use different port
.\enhanced-tunnel.ps1 -Port 8080
```

### URL Persistence

The `.tunnel-url` file stores your last tunnel URL. If using ngrok with a fixed subdomain, you can reuse the same URL across sessions.

### Health Monitoring

The enhanced scripts monitor tunnel health and display status updates every minute.

## 🔒 Security Notes

- **ngrok**: Requires account but offers password protection
- **cloudflared**: No account needed, very secure
- **tunnelmole**: Public URLs, use with caution for sensitive data

## 📞 Support

For issues with:

- **Docker setup**: Check `docker-compose.prod.yml` configuration
- **Tunnel providers**: Refer to provider documentation
- **MediaSoup connection**: Check backend logs with `docker logs mediasoup-backend-prod`

## 🎉 Benefits

✅ **Fixed URLs**: No more manual Docker updates  
✅ **Multiple Options**: Choose best provider for your needs  
✅ **Auto-Configuration**: Scripts handle Docker updates  
✅ **Better Monitoring**: Health checks and status updates  
✅ **Persistent Storage**: Remember URLs across sessions  
✅ **Error Handling**: Graceful failures with helpful messages
