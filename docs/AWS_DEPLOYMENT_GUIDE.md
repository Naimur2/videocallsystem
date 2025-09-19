# MediaSoup Video Call - AWS Deployment Guide

A production-ready real-time video calling application built with MediaSoup WebRTC, Next.js, and Express.js, deployed on AWS using modern DevOps practices.

## 🏗️ Architecture Overview

### Infrastructure
- **Frontend**: Next.js application running in AWS ECS Fargate
- **Backend**: Express.js + MediaSoup WebRTC server in AWS ECS Fargate
- **Database**: Amazon RDS PostgreSQL
- **Cache**: Amazon ElastiCache Redis
- **Load Balancer**: Application Load Balancer with SSL termination
- **Container Registry**: Amazon ECR
- **CI/CD**: GitHub Actions with automated testing and deployment

### Network Architecture
- **VPC** with public and private subnets across 2 AZs
- **Public Subnets**: ALB and NAT Gateways
- **Private Subnets**: ECS tasks, RDS, and ElastiCache
- **Security Groups**: Restrictive ingress/egress rules
- **UDP Port Range**: 40000-49999 for MediaSoup WebRTC traffic

## 🚀 Quick Start Deployment

### Prerequisites
- AWS Account with appropriate permissions
- AWS CLI configured (`aws configure`)
- Docker installed
- Node.js 20+ installed
- PowerShell (Windows) or Bash (Linux/Mac)

### 1. Repository Setup
```bash
git clone <your-repo-url>
cd mediasoup-video-call
```

### 2. AWS Infrastructure Setup
```powershell
# Run the setup script to create AWS resources
.\scripts\setup.ps1 -Region us-east-1 -CreateSecrets -SetupMonitoring
```

This script will:
- Create ECR repositories for Docker images
- Generate and store secure secrets in AWS Parameter Store
- Create S3 bucket for deployment artifacts
- Set up CloudWatch monitoring dashboard

### 3. GitHub Repository Configuration
Add the following secrets to your GitHub repository:

**Repository Settings > Secrets and Variables > Actions:**
```
AWS_ACCESS_KEY_ID: <your-aws-access-key-id>
AWS_SECRET_ACCESS_KEY: <your-aws-secret-access-key>
AWS_REGION: us-east-1
```

### 4. Environment Configuration
Copy and configure environment variables:
```bash
cp .env.example .env
# Edit .env with your actual values
```

Key configurations to update:
- `MEDIASOUP_ANNOUNCED_IP`: Your public IP or domain
- `TURN_USERNAME` and `TURN_CREDENTIAL`: Your TURN server credentials
- Database and Redis endpoints (after infrastructure deployment)

### 5. Deploy Infrastructure
```powershell
# Deploy CloudFormation infrastructure
.\scripts\deploy.ps1 -Environment staging -Region us-east-1
```

### 6. Trigger CI/CD Pipeline
```bash
# Create production branch for production deployments
git checkout -b production
git push origin production

# Or push to main for staging deployment
git push origin main
```

The GitHub Actions pipeline will:
1. Run tests and security scans
2. Build Docker images
3. Push to ECR
4. Deploy to ECS
5. Run health checks

## 🔧 Detailed Configuration

### AWS Resources Created

#### CloudFormation Stack Resources
- **VPC**: 10.0.0.0/16 with 2 public and 2 private subnets
- **ALB**: Internet-facing with SSL termination
- **ECS Cluster**: Fargate capacity providers
- **RDS**: PostgreSQL 15 with automated backups
- **ElastiCache**: Redis cluster for session management
- **ECR**: Container registries for frontend and backend
- **Security Groups**: Least-privilege access controls

#### ECS Services Configuration
```yaml
# Backend Service
CPU: 512 units (0.5 vCPU)
Memory: 1024 MB (1 GB)
Ports: 3001 (HTTP), 40000-49999 (UDP)
Health Check: /api/v1/health

# Frontend Service  
CPU: 256 units (0.25 vCPU)
Memory: 512 MB
Ports: 3000 (HTTP)
Health Check: /api/health
```

### Environment Variables Configuration

#### Production Environment Variables
The following environment variables are managed through AWS Parameter Store:

**Database Configuration:**
- `/staging|production/mediasoup/database/password`
- `/staging|production/mediasoup/redis/password`

**Security Configuration:**
- `/staging|production/mediasoup/jwt/secret`
- `/staging|production/mediasoup/session/secret`

**MediaSoup Configuration:**
```bash
MEDIASOUP_LISTEN_IP=0.0.0.0
MEDIASOUP_ANNOUNCED_IP=<your-alb-domain>
RTC_MIN_PORT=40000
RTC_MAX_PORT=49999
```

### Domain and SSL Configuration

#### 1. Register Domain or Use Existing
If you have a domain (e.g., `mediasoup.yourdomain.com`):

#### 2. Create Route 53 Hosted Zone
```bash
aws route53 create-hosted-zone --name yourdomain.com --caller-reference $(date +%s)
```

#### 3. Request SSL Certificate
```bash
aws acm request-certificate \
  --domain-name mediasoup.yourdomain.com \
  --validation-method DNS \
  --region us-east-1
```

#### 4. Update CloudFormation Parameters
```powershell
.\scripts\deploy.ps1 -Environment production -DomainName mediasoup.yourdomain.com -CertificateArn <certificate-arn>
```

## 🛡️ Security Best Practices

### Network Security
- **Private Subnets**: Database and cache in private subnets
- **Security Groups**: Restrictive rules with minimal required access
- **SSL/TLS**: End-to-end encryption with AWS Certificate Manager
- **VPC Flow Logs**: Network traffic monitoring

### Application Security
- **Secrets Management**: AWS Parameter Store for sensitive data
- **IAM Roles**: Least-privilege access for ECS tasks
- **Container Security**: Regular vulnerability scanning with Trivy
- **Rate Limiting**: API rate limiting to prevent abuse

### MediaSoup Security
- **TURN Server**: Secure TURN server with authentication
- **WebRTC**: ICE consent timeout and secure transport
- **Port Management**: Restricted UDP port range (40000-49999)

## 📊 Monitoring and Logging

### CloudWatch Monitoring
- **ECS Metrics**: CPU, memory, and task health
- **ALB Metrics**: Request count, latency, and error rates
- **RDS Metrics**: Database performance and connections
- **Custom Metrics**: Application-specific metrics

### CloudWatch Logs
- **Application Logs**: ECS task logs with structured logging
- **Access Logs**: ALB access logs for request tracking
- **Error Tracking**: Centralized error logging and alerting

### Health Checks
- **Frontend**: `/api/health` endpoint
- **Backend**: `/api/v1/health` endpoint with database connectivity check
- **Infrastructure**: ALB target group health checks

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
The `.github/workflows/deploy.yml` provides:

#### 1. Test Stage
- Unit tests for frontend and backend
- Code linting and formatting checks
- Build verification

#### 2. Security Stage
- Trivy vulnerability scanning
- Container image security analysis
- SARIF report upload to GitHub Security

#### 3. Build Stage
- Multi-stage Docker builds
- ECR authentication and image push
- Image tagging with commit SHA

#### 4. Deploy Stage
- ECS task definition updates
- Blue-green deployment with health checks
- Automatic rollback on failure

### Branch Strategy
- **main**: Deploys to staging environment
- **production**: Deploys to production environment
- **feature/***: Runs tests only (no deployment)

## 🚨 Troubleshooting

### Common Deployment Issues

#### 1. MediaSoup Connection Issues
**Problem**: Clients can't establish WebRTC connections
**Solution**: 
- Verify `MEDIASOUP_ANNOUNCED_IP` matches your ALB domain
- Check security group allows UDP ports 40000-49999
- Verify TURN server configuration

#### 2. Database Connection Errors
**Problem**: Backend can't connect to RDS
**Solution**:
- Check security group allows port 5432 from ECS security group
- Verify database endpoint in environment variables
- Check VPC DNS resolution

#### 3. SSL Certificate Issues
**Problem**: HTTPS not working or certificate errors
**Solution**:
- Verify certificate is validated and issued
- Check Route 53 DNS records point to ALB
- Ensure certificate ARN is correct in CloudFormation

#### 4. ECS Task Startup Failures
**Problem**: ECS tasks failing to start
**Solution**:
- Check CloudWatch logs for error messages
- Verify ECR image permissions
- Check task definition resource limits

### Debugging Commands

#### Check ECS Service Status
```bash
aws ecs describe-services --cluster mediasoup-staging-cluster --services mediasoup-backend-staging
```

#### View Application Logs
```bash
aws logs tail /ecs/mediasoup-backend --follow
```

#### Check ALB Health
```bash
aws elbv2 describe-target-health --target-group-arn <target-group-arn>
```

## 🔧 Maintenance

### Regular Tasks

#### 1. Update Dependencies
```bash
# Update Node.js dependencies
npm audit fix
npm update

# Rebuild and redeploy
git commit -am "Update dependencies"
git push origin main
```

#### 2. Database Maintenance
- Monitor RDS performance metrics
- Review backup retention and restore procedures
- Update PostgreSQL version as needed

#### 3. Security Updates
- Review Trivy scan results
- Update base Docker images
- Rotate secrets in Parameter Store

#### 4. Cost Optimization
- Review CloudWatch metrics for resource utilization
- Adjust ECS task sizes based on usage
- Implement auto-scaling policies

### Backup and Recovery

#### Database Backups
- **Automated Backups**: 7-day retention (configurable)
- **Manual Snapshots**: Before major updates
- **Point-in-Time Recovery**: Available for last 7 days

#### Application Backups
- **Container Images**: Versioned in ECR with lifecycle policies
- **Configuration**: Version controlled in Git
- **Secrets**: Backed up in Parameter Store

## 📈 Scaling

### Horizontal Scaling
- **ECS Auto Scaling**: CPU/memory-based scaling
- **ALB**: Automatically scales with load
- **RDS**: Read replicas for read-heavy workloads

### Vertical Scaling
- **ECS Task Definitions**: Increase CPU/memory allocations
- **RDS**: Scale instance class as needed
- **ElastiCache**: Scale node type for better performance

## 🌐 Multi-Region Deployment

For high availability across regions:

#### 1. Deploy Infrastructure in Multiple Regions
```powershell
.\scripts\deploy.ps1 -Environment production -Region us-west-2
```

#### 2. Set Up Cross-Region Replication
- **RDS**: Cross-region read replicas
- **S3**: Cross-region replication for artifacts
- **Route 53**: Health checks and failover routing

#### 3. Update DNS Configuration
- **Route 53**: Latency-based or geolocation routing
- **Health Checks**: Automated failover between regions

## 📞 Support

### Documentation
- **Application Architecture**: See `/docs` directory
- **API Documentation**: Available at `/api-docs` endpoint
- **MediaSoup Documentation**: [mediasoup.org](https://mediasoup.org)

### Monitoring and Alerts
- **CloudWatch Dashboards**: Application performance overview
- **SNS Alerts**: Critical error notifications
- **Health Checks**: Automated monitoring and alerting

---

## 🎯 Production Checklist

Before going live:

- [ ] Domain configured with SSL certificate
- [ ] Environment variables updated with production values
- [ ] Database backups configured and tested
- [ ] Monitoring and alerting set up
- [ ] Load testing completed
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Team trained on deployment procedures

---

**🚀 Your MediaSoup Video Call application is now ready for production deployment on AWS!**

For additional support or questions, refer to the troubleshooting section or check the application logs in CloudWatch.