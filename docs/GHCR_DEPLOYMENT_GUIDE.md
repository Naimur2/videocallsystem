# GitHub Container Registry (GHCR) Deployment Guide

This guide explains how to deploy your MediaSoup video calling application using **GitHub Container Registry (GHCR)** instead of AWS ECR for container image storage.

## 🌟 Benefits of Using GHCR

- **Free for public repositories**: No storage costs for public container images
- **Integrated with GitHub**: Seamless integration with GitHub Actions and repositories
- **Better Developer Experience**: Direct integration with your source code
- **Multi-platform Support**: Supports both AMD64 and ARM64 architectures
- **Package Permissions**: Fine-grained access control tied to repository permissions

## 🚀 Quick Setup

### 1. **GitHub Token Setup**
Create a GitHub Personal Access Token with the required permissions:

```bash
# Go to: https://github.com/settings/tokens/new
# Required scopes:
# - read:packages (to pull images)
# - write:packages (to push images) 
# - repo (if repository is private)
```

### 2. **Configure GHCR Credentials in AWS**
Run the setup script to store GHCR credentials in AWS Secrets Manager:

```powershell
# Store GHCR credentials for ECS to pull images
.\scripts\setup-ghcr.ps1 -GitHubToken "ghp_xxxxxxxxxxxx" -GitHubUsername "your-username"
```

### 3. **Update GitHub Repository Secrets**
Add these secrets to your GitHub repository:

```
AWS_ACCESS_KEY_ID: <your-aws-access-key>
AWS_SECRET_ACCESS_KEY: <your-aws-secret-key>
AWS_REGION: us-east-1
AWS_ACCOUNT_ID: <your-aws-account-id>
```

### 4. **Deploy with GitHub Actions**
Push your code to trigger the automated deployment:

```bash
# Deploy to staging
git push origin main

# Deploy to production  
git checkout production
git push origin production
```

## 🏗️ Architecture Overview

### Image Storage Flow
```
GitHub Repository → GitHub Actions → GHCR → AWS ECS
```

1. **Source Code**: Stored in GitHub repository
2. **CI/CD Pipeline**: GitHub Actions builds and tests
3. **Container Registry**: Images pushed to GHCR
4. **Deployment**: ECS pulls images from GHCR using stored credentials

### Container Image Names
- **Frontend**: `ghcr.io/your-username/mediasoup-frontend:latest`
- **Backend**: `ghcr.io/your-username/mediasoup-backend:latest`

## 🔧 Configuration Details

### GitHub Actions Workflow
The updated workflow (`.github/workflows/deploy.yml`) now:

- **Authenticates with GHCR** using `GITHUB_TOKEN`
- **Builds multi-platform images** (AMD64 + ARM64)
- **Uses build caching** for faster builds
- **Tags images properly** with commit SHA and environment
- **Deploys to AWS ECS** with GHCR image references

### ECS Task Definitions
ECS tasks are configured to pull from GHCR using:

```json
{
  "repositoryCredentials": {
    "credentialsParameter": "arn:aws:secretsmanager:region:account:secret:ghcr-credentials"
  }
}
```

### Environment Variables
Key environment variables for GHCR deployment:

```bash
# GitHub Container Registry
REGISTRY=ghcr.io
IMAGE_NAME_FRONTEND=mediasoup-frontend
IMAGE_NAME_BACKEND=mediasoup-backend

# AWS Configuration  
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
```

## 📦 Container Image Management

### Image Tagging Strategy
Images are tagged with multiple tags for flexibility:

- **Latest**: `ghcr.io/owner/app:latest` (default branch)
- **Branch**: `ghcr.io/owner/app:main` or `ghcr.io/owner/app:production`
- **Commit SHA**: `ghcr.io/owner/app:main-abc123`
- **Environment**: `ghcr.io/owner/app:staging` or `ghcr.io/owner/app:production`

### Image Lifecycle Management
GHCR provides automatic image lifecycle management:

- **Retention Policy**: Keep last 10 production images
- **Cleanup**: Remove untagged images after 1 day
- **Size Optimization**: Multi-stage builds reduce image size

## 🔐 Security Configuration

### Repository Permissions
Configure repository permissions for GHCR access:

```bash
# Make packages public (optional)
gh api -X PATCH /user/packages/container/mediasoup-frontend/visibility \
  -f visibility=public

# Or keep private with team access
gh api -X PUT /orgs/your-org/packages/container/mediasoup-frontend/restores/1
```

### AWS IAM Permissions
The ECS task execution role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:region:account:secret:ghcr-credentials*"
    }
  ]
}
```

### Network Security
ECS tasks need outbound HTTPS access to pull from GHCR:

- **Outbound HTTPS (443)**: To `ghcr.io` and `docker.io`
- **Outbound HTTP (80)**: For package downloads
- **VPC Configuration**: Ensure NAT Gateway or public subnets for internet access

## 🚀 Deployment Commands

### Local Development with GHCR Images
```bash
# Set environment variables
export GITHUB_REPOSITORY_OWNER=your-username
export POSTGRES_PASSWORD=your-secure-password
export REDIS_PASSWORD=your-redis-password
export JWT_SECRET=your-jwt-secret
export SESSION_SECRET=your-session-secret

# Run with GHCR images
docker-compose -f docker-compose.ghcr.yml up -d
```

### Manual Image Operations
```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u your-username --password-stdin

# Pull specific image
docker pull ghcr.io/your-username/mediasoup-frontend:latest

# Tag and push custom image
docker tag my-local-image ghcr.io/your-username/mediasoup-frontend:custom
docker push ghcr.io/your-username/mediasoup-frontend:custom
```

### AWS ECS Operations
```bash
# Update ECS service with new image
aws ecs update-service \
  --cluster mediasoup-prod-cluster \
  --service mediasoup-frontend-prod \
  --force-new-deployment

# Check deployment status
aws ecs describe-services \
  --cluster mediasoup-prod-cluster \
  --services mediasoup-frontend-prod
```

## 🔍 Monitoring and Debugging

### GHCR Package Monitoring
Monitor your packages in the GitHub UI:

- **Package Page**: `https://github.com/users/USERNAME/packages/container/PACKAGE`
- **Download Stats**: View pull statistics and usage
- **Vulnerability Scanning**: GitHub automatically scans for vulnerabilities

### ECS Deployment Debugging
Common issues and solutions:

#### 1. **Image Pull Errors**
```bash
# Check ECS task logs
aws logs tail /ecs/mediasoup-frontend-prod --follow

# Common error: "repository does not exist or may require 'docker login'"
# Solution: Verify GHCR credentials in Secrets Manager
```

#### 2. **Authentication Failures**
```bash
# Test secret retrieval
aws secretsmanager get-secret-value --secret-id ghcr-credentials

# Verify IAM permissions
aws iam get-role-policy --role-name ecsTaskExecutionRole --policy-name ghcr-access
```

#### 3. **Network Connectivity**
```bash
# Test GHCR connectivity from ECS subnet
curl -I https://ghcr.io/v2/

# Check VPC configuration for internet access
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=vpc-xxxxx"
```

## 💰 Cost Optimization

### GHCR Pricing
- **Public repositories**: Free unlimited storage and bandwidth
- **Private repositories**: 
  - 500MB storage free
  - 1GB bandwidth free per month
  - Additional usage charged by GitHub

### AWS Cost Savings
Using GHCR eliminates AWS ECR costs:
- **ECR Storage**: $0.10 per GB-month saved
- **ECR Data Transfer**: Varies by region
- **Typical Savings**: $10-50+ per month depending on usage

### Optimization Tips
1. **Use multi-stage builds** to minimize image size
2. **Enable build caching** to reduce build times
3. **Clean up old images** regularly
4. **Use public repositories** when possible for free storage

## 🔄 Migration from ECR to GHCR

### Step-by-Step Migration
1. **Setup GHCR credentials** using the setup script
2. **Update GitHub Actions workflow** (already done)
3. **Update ECS task definitions** to reference GHCR images
4. **Test deployment** with staging environment
5. **Migrate production** once validated
6. **Clean up ECR resources** to save costs

### Rollback Plan
Keep ECR as backup during migration:
```bash
# Build and push to both registries
docker tag app:latest 123456789012.dkr.ecr.region.amazonaws.com/app:latest
docker tag app:latest ghcr.io/username/app:latest

docker push 123456789012.dkr.ecr.region.amazonaws.com/app:latest
docker push ghcr.io/username/app:latest
```

## 📊 Performance Comparison

### Build Times
- **GHCR**: ~3-5 minutes with caching
- **ECR**: ~4-6 minutes with caching
- **Advantage**: GHCR slightly faster due to GitHub integration

### Deployment Speed
- **GHCR**: ~2-3 minutes for image pull + deploy
- **ECR**: ~1-2 minutes for image pull + deploy  
- **Trade-off**: Slightly slower pulls, but better integration

### Reliability
- **GHCR**: 99.9% uptime, GitHub infrastructure
- **ECR**: 99.99% uptime, AWS infrastructure
- **Consideration**: Both are enterprise-grade reliable

## 🎯 Best Practices

### 1. **Repository Organization**
```
ghcr.io/organization/mediasoup-frontend
ghcr.io/organization/mediasoup-backend
ghcr.io/organization/mediasoup-mobile
```

### 2. **Tagging Strategy**
```bash
# Environment-based tags
ghcr.io/org/app:staging-v1.2.3
ghcr.io/org/app:production-v1.2.3

# Feature branch tags  
ghcr.io/org/app:feature-auth-v1.2.3

# Latest stable
ghcr.io/org/app:latest
```

### 3. **Security Practices**
- Use **least-privilege tokens** with minimal required scopes
- **Rotate tokens regularly** (every 6-12 months)
- **Monitor package access** in GitHub audit logs
- **Enable vulnerability scanning** for all images

### 4. **CI/CD Integration**
- **Cache Docker layers** for faster builds
- **Use matrix builds** for multi-platform support
- **Implement health checks** before deployment
- **Set up notifications** for failed deployments

---

## 🔧 Troubleshooting

### Common Issues

#### Issue: "Package not found"
**Solution**: Check repository visibility and token permissions
```bash
# Make package public
gh api -X PATCH /user/packages/container/PACKAGE/visibility -f visibility=public
```

#### Issue: "Authentication required"
**Solution**: Verify GHCR credentials in AWS Secrets Manager
```bash
aws secretsmanager get-secret-value --secret-id ghcr-credentials --region us-east-1
```

#### Issue: "Image pull timeout"
**Solution**: Check ECS subnet internet connectivity
```bash
# Test from ECS task
curl -v https://ghcr.io/v2/
```

### Support Resources
- **GitHub Support**: [GitHub Container Registry Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- **AWS Support**: [ECS Task Definition Guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html)
- **Community**: [GitHub Community Discussions](https://github.com/community/community/discussions)

---

**🎉 Your MediaSoup application is now ready for production deployment with GitHub Container Registry!**

For additional help, refer to the main [AWS Deployment Guide](./AWS_DEPLOYMENT_GUIDE.md) for infrastructure setup and the [README.md](../README.md) for general information.