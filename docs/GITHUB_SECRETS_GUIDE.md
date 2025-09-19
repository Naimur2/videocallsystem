# GitHub Secrets Configuration Guide

This guide explains how to configure GitHub repository secrets for the MediaSoup Video Call application's CI/CD pipeline.

## 🔐 Required GitHub Secrets

The GitHub Actions workflow requires various secrets to be configured in your repository settings. Navigate to **Settings > Secrets and Variables > Actions** in your GitHub repository to add these secrets.

### AWS Configuration Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `AWS_ACCESS_KEY_ID` | AWS Access Key for deployment | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS deployment region | `us-east-1` |
| `AWS_ACCOUNT_ID` | Your AWS Account ID | `123456789012` |

### Database Configuration Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `DATABASE_URL_STAGING` | PostgreSQL connection string for staging | `postgresql://user:pass@staging-db.region.rds.amazonaws.com:5432/mediasoup` |
| `DATABASE_URL_PRODUCTION` | PostgreSQL connection string for production | `postgresql://user:pass@prod-db.region.rds.amazonaws.com:5432/mediasoup` |
| `REDIS_URL_STAGING` | Redis connection string for staging | `redis://staging-redis.cache.amazonaws.com:6379` |
| `REDIS_URL_PRODUCTION` | Redis connection string for production | `redis://prod-redis.cache.amazonaws.com:6379` |

### Application Security Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `JWT_SECRET` | Secret key for JWT token signing | `your-super-secret-jwt-key-here-make-it-long-and-random` |
| `SESSION_SECRET` | Secret key for session management | `your-session-secret-key-here-also-make-it-long` |

### MediaSoup Configuration Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `MEDIASOUP_ANNOUNCED_IP_STAGING` | Public IP/domain for staging MediaSoup | `staging-alb-123456789.us-east-1.elb.amazonaws.com` |
| `MEDIASOUP_ANNOUNCED_IP_PRODUCTION` | Public IP/domain for production MediaSoup | `prod-alb-987654321.us-east-1.elb.amazonaws.com` |
| `RTC_MIN_PORT` | Minimum UDP port for WebRTC | `40000` |
| `RTC_MAX_PORT` | Maximum UDP port for WebRTC | `49999` |

### TURN/STUN Server Configuration

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `TURN_USERNAME` | TURN server username | `mediasoup-user` |
| `TURN_CREDENTIAL` | TURN server password | `your-secure-turn-password` |
| `TURN_SERVER_URL` | TURN server URL | `turn:your-turn-server.com:3478` |
| `STUN_SERVER_URL` | STUN server URL | `stun:stun.l.google.com:19302` |

### Frontend Configuration Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `NEXT_PUBLIC_API_URL_STAGING` | Backend API URL for staging frontend | `https://staging-api.yourdomain.com` |
| `NEXT_PUBLIC_API_URL_PRODUCTION` | Backend API URL for production frontend | `https://api.yourdomain.com` |
| `NEXT_PUBLIC_SOCKET_URL_STAGING` | Socket.IO URL for staging frontend | `https://staging-api.yourdomain.com` |
| `NEXT_PUBLIC_SOCKET_URL_PRODUCTION` | Socket.IO URL for production frontend | `https://api.yourdomain.com` |
| `NEXT_PUBLIC_TURN_SERVER_URL` | Public TURN server URL for frontend | `turn:your-turn-server.com:3478` |
| `NEXT_PUBLIC_STUN_SERVER_URL` | Public STUN server URL for frontend | `stun:stun.l.google.com:19302` |

## 🚀 Quick Setup Commands

### 1. **Set up secrets using GitHub CLI:**
```bash
# AWS Configuration
gh secret set AWS_ACCESS_KEY_ID --body "AKIAIOSFODNN7EXAMPLE"
gh secret set AWS_SECRET_ACCESS_KEY --body "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
gh secret set AWS_REGION --body "us-east-1"
gh secret set AWS_ACCOUNT_ID --body "123456789012"

# Database URLs (replace with your actual values)
gh secret set DATABASE_URL_STAGING --body "postgresql://user:pass@staging-db.region.rds.amazonaws.com:5432/mediasoup"
gh secret set DATABASE_URL_PRODUCTION --body "postgresql://user:pass@prod-db.region.rds.amazonaws.com:5432/mediasoup"
gh secret set REDIS_URL_STAGING --body "redis://staging-redis.cache.amazonaws.com:6379"
gh secret set REDIS_URL_PRODUCTION --body "redis://prod-redis.cache.amazonaws.com:6379"

# Application Secrets (generate secure random values)
gh secret set JWT_SECRET --body "$(openssl rand -base64 32)"
gh secret set SESSION_SECRET --body "$(openssl rand -base64 32)"

# MediaSoup Configuration
gh secret set MEDIASOUP_ANNOUNCED_IP_STAGING --body "staging-alb.us-east-1.elb.amazonaws.com"
gh secret set MEDIASOUP_ANNOUNCED_IP_PRODUCTION --body "prod-alb.us-east-1.elb.amazonaws.com"
gh secret set RTC_MIN_PORT --body "40000"
gh secret set RTC_MAX_PORT --body "49999"

# TURN/STUN Configuration
gh secret set TURN_USERNAME --body "mediasoup-user"
gh secret set TURN_CREDENTIAL --body "$(openssl rand -base64 16)"
gh secret set TURN_SERVER_URL --body "turn:your-turn-server.com:3478"
gh secret set STUN_SERVER_URL --body "stun:stun.l.google.com:19302"

# Frontend URLs
gh secret set NEXT_PUBLIC_API_URL_STAGING --body "https://staging-api.yourdomain.com"
gh secret set NEXT_PUBLIC_API_URL_PRODUCTION --body "https://api.yourdomain.com"
gh secret set NEXT_PUBLIC_SOCKET_URL_STAGING --body "https://staging-api.yourdomain.com"
gh secret set NEXT_PUBLIC_SOCKET_URL_PRODUCTION --body "https://api.yourdomain.com"
gh secret set NEXT_PUBLIC_TURN_SERVER_URL --body "turn:your-turn-server.com:3478"
gh secret set NEXT_PUBLIC_STUN_SERVER_URL --body "stun:stun.l.google.com:19302"
```

### 2. **Generate secure secrets using PowerShell:**
```powershell
# Generate JWT and Session secrets
$JwtSecret = [System.Web.Security.Membership]::GeneratePassword(32, 0)
$SessionSecret = [System.Web.Security.Membership]::GeneratePassword(32, 0)
$TurnCredential = [System.Web.Security.Membership]::GeneratePassword(16, 0)

Write-Host "JWT_SECRET: $JwtSecret"
Write-Host "SESSION_SECRET: $SessionSecret"
Write-Host "TURN_CREDENTIAL: $TurnCredential"
```

### 3. **Set up secrets through GitHub Web UI:**
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Click **Secrets and variables** > **Actions**
4. Click **New repository secret**
5. Add each secret from the table above

## 🔧 Environment-Specific Configuration

### Staging Environment
- Uses secrets with `_STAGING` suffix for environment-specific values
- Connects to staging AWS resources
- Uses staging database and Redis instances
- Points to staging load balancer URLs

### Production Environment
- Uses secrets with `_PRODUCTION` suffix for environment-specific values
- Connects to production AWS resources
- Uses production database and Redis instances
- Points to production load balancer URLs

### Shared Secrets
Some secrets are shared between environments:
- `JWT_SECRET` and `SESSION_SECRET` (for consistency)
- `TURN_USERNAME`, `TURN_CREDENTIAL` (if using same TURN server)
- `RTC_MIN_PORT`, `RTC_MAX_PORT` (MediaSoup port range)

## 🛡️ Security Best Practices

### 1. **Secret Rotation**
```bash
# Rotate secrets periodically (every 3-6 months)
gh secret set JWT_SECRET --body "$(openssl rand -base64 32)"
gh secret set SESSION_SECRET --body "$(openssl rand -base64 32)"
```

### 2. **AWS IAM Best Practices**
- Use dedicated IAM user for GitHub Actions
- Apply least-privilege permissions
- Enable MFA for the IAM user
- Regularly audit access keys

### 3. **Database Security**
- Use strong passwords for database users
- Enable SSL/TLS for database connections
- Restrict database access to specific IP ranges
- Use AWS RDS encryption at rest

### 4. **Environment Isolation**
- Use separate AWS accounts for staging/production
- Use different database instances
- Implement network isolation with VPCs
- Use separate TURN server credentials

## 🚨 Troubleshooting

### Common Issues

#### 1. **"Context access might be invalid" warnings**
These are lint warnings from GitHub Actions and don't affect functionality. They occur because the linter cannot verify that secrets exist.

**Solution**: Ensure all required secrets are set in repository settings.

#### 2. **AWS Authentication Failures**
```
Error: Unable to locate credentials
```

**Solution**: 
- Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set
- Check IAM user has required permissions
- Ensure AWS account ID is correct

#### 3. **Database Connection Errors**
```
Error: connection to server at "..." failed
```

**Solution**:
- Verify database URLs are correct
- Check database security groups allow ECS access
- Ensure database is running and accessible

#### 4. **Frontend Build Failures**
```
Error: Missing environment variable NEXT_PUBLIC_API_URL
```

**Solution**:
- Ensure all `NEXT_PUBLIC_*` secrets are set
- Check URLs are properly formatted (include https://)
- Verify domain names resolve correctly

### Validation Commands

#### Check secret configuration:
```bash
# List all secrets (names only, values are hidden)
gh secret list

# Test AWS credentials
aws sts get-caller-identity

# Test database connection
psql $DATABASE_URL_STAGING -c "SELECT version();"
```

#### Verify build process:
```bash
# Test local build with environment variables
export NODE_ENV=staging
export NEXT_PUBLIC_API_URL=https://staging-api.yourdomain.com
npm run build
```

## 📋 Secret Checklist

Before deploying, ensure all these secrets are configured:

### AWS Infrastructure (Required)
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_REGION`
- [ ] `AWS_ACCOUNT_ID`

### Database Configuration (Required)
- [ ] `DATABASE_URL_STAGING`
- [ ] `DATABASE_URL_PRODUCTION`
- [ ] `REDIS_URL_STAGING`
- [ ] `REDIS_URL_PRODUCTION`

### Application Security (Required)
- [ ] `JWT_SECRET`
- [ ] `SESSION_SECRET`

### MediaSoup Configuration (Required)
- [ ] `MEDIASOUP_ANNOUNCED_IP_STAGING`
- [ ] `MEDIASOUP_ANNOUNCED_IP_PRODUCTION`
- [ ] `RTC_MIN_PORT`
- [ ] `RTC_MAX_PORT`

### TURN/STUN Configuration (Optional but Recommended)
- [ ] `TURN_USERNAME`
- [ ] `TURN_CREDENTIAL`
- [ ] `TURN_SERVER_URL`
- [ ] `STUN_SERVER_URL`

### Frontend Configuration (Required)
- [ ] `NEXT_PUBLIC_API_URL_STAGING`
- [ ] `NEXT_PUBLIC_API_URL_PRODUCTION`
- [ ] `NEXT_PUBLIC_SOCKET_URL_STAGING`
- [ ] `NEXT_PUBLIC_SOCKET_URL_PRODUCTION`
- [ ] `NEXT_PUBLIC_TURN_SERVER_URL`
- [ ] `NEXT_PUBLIC_STUN_SERVER_URL`

## 🎯 Next Steps

After configuring all secrets:

1. **Test the pipeline**: Push to `main` branch to trigger staging deployment
2. **Verify deployment**: Check AWS ECS services are running
3. **Test the application**: Verify frontend and backend connectivity
4. **Production deployment**: Push to `production` branch when ready

---

**📚 Related Documentation:**
- [GHCR Deployment Guide](./GHCR_DEPLOYMENT_GUIDE.md)
- [AWS Deployment Guide](./AWS_DEPLOYMENT_GUIDE.md)
- [Main README](../README.md)

**🔒 Remember**: Never commit secrets to your repository. Always use GitHub Secrets for sensitive configuration!