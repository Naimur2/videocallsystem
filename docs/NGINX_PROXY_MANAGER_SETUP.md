# Nginx Proxy Manager Setup Guide for MediaSoup Video Call

## 🚀 **What is Nginx Proxy Manager?**

Nginx Proxy Manager (NPM) provides a beautiful web interface for managing Nginx reverse proxy configurations with:
- **Visual proxy host management** - No manual config files
- **Automatic SSL certificates** - Let's Encrypt integration
- **Access control** - IP restrictions, basic auth
- **Custom domains** - Easy subdomain routing
- **WebSocket support** - Perfect for our Socket.IO connections

## 📋 **Setup Steps**

### 1. **Start with Nginx Proxy Manager**

```powershell
# Stop current setup
cd h:\mediasoup-video-call
docker-compose down -v

# Start with NPM configuration
docker-compose -f docker-compose.npm.yml up -d
```

### 2. **Access NPM Admin Interface**

- **URL**: `http://localhost:81`
- **Default Login**:
  - Email: `admin@example.com`
  - Password: `changeme`

⚠️ **IMPORTANT**: Change the default password immediately!

### 3. **Create Directory Structure**

```powershell
# Create required directories
New-Item -ItemType Directory -Force -Path ".\data\nginx-proxy-manager"
New-Item -ItemType Directory -Force -Path ".\data\letsencrypt"
New-Item -ItemType Directory -Force -Path ".\data\npm-db"
```

### 4. **Configure Proxy Hosts in NPM Web Interface**

#### **A. Frontend Proxy Host**
1. Go to **Hosts > Proxy Hosts**
2. Click **Add Proxy Host**
3. **Details Tab**:
   - Domain Names: `localhost` or your domain
   - Scheme: `http`
   - Forward Hostname/IP: `videocall-frontend`
   - Forward Port: `3000`
   - ✅ Cache Assets
   - ✅ Block Common Exploits
   - ✅ Websockets Support

#### **B. Backend API Proxy Host**
1. Click **Add Proxy Host**
2. **Details Tab**:
   - Domain Names: `localhost/api` or `yourdomain.com/api`
   - Scheme: `http`
   - Forward Hostname/IP: `videocall-backend`
   - Forward Port: `3001`
   - ✅ Block Common Exploits
   - ✅ Websockets Support

#### **C. Advanced Configuration**
In the **Advanced** tab, add this custom Nginx config:

```nginx
# WebSocket upgrade headers
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_cache_bypass $http_upgrade;

# MediaSoup specific headers
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

# Increase timeouts for long-running connections
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

## 🔧 **Integration with Cloudflare Tunnel**

### **Option 1: Direct NPM Integration**
```powershell
# Point Cloudflare tunnel to NPM
cloudflared tunnel --url http://localhost:80
```

### **Option 2: Custom Domain Setup**
1. **In NPM**: Create proxy hosts for your custom domain
2. **SSL Certificates**: NPM will automatically generate Let's Encrypt certificates
3. **Cloudflare Tunnel**: Point to your domain instead of localhost

## 📊 **Key Benefits for Our Video Call App**

### **1. Simplified Routing**
- **Before**: Manual nginx.conf editing
- **After**: Visual web interface

### **2. SSL Management**
- **Automatic certificates** for custom domains
- **Force SSL redirect** options
- **Certificate renewal** handled automatically

### **3. Enhanced Security**
- **IP Access Control** - Restrict by IP ranges
- **Basic Authentication** - Add login protection
- **Custom Headers** - Enhanced security headers

### **4. Better Monitoring**
- **Real-time logs** in web interface
- **Traffic statistics** per proxy host
- **Error tracking** and alerts

## 🚨 **Important Notes for MediaSoup**

### **WebSocket Configuration**
Ensure these settings are enabled for Socket.IO:
- ✅ **Websockets Support** in proxy host settings
- ✅ **Custom Nginx config** with proper upgrade headers

### **Port Forwarding**
- **Frontend**: `videocall-frontend:3000`
- **Backend**: `videocall-backend:3001`
- **Admin Panel**: `localhost:81`

### **CORS Configuration**
Update backend CORS to include NPM:
```typescript
CORS_ORIGINS=http://localhost:80,http://localhost:81,https://yourdomain.com
```

## 🔄 **Migration Commands**

```powershell
# 1. Backup current setup
docker-compose -f docker-compose.yml down -v
Copy-Item docker-compose.yml docker-compose.backup.yml

# 2. Start NPM setup
docker-compose -f docker-compose.npm.yml up -d

# 3. Verify services
docker-compose -f docker-compose.npm.yml ps

# 4. Access NPM admin
Start-Process "http://localhost:81"
```

## 🎯 **Next Steps**

1. **Replace docker-compose.yml** with NPM version
2. **Configure proxy hosts** through web interface
3. **Test video calling** functionality
4. **Set up custom domains** if needed
5. **Configure SSL certificates** for production

This setup will give you much more control and easier management of your reverse proxy configuration! 🚀