# Quick Google Cloud Deployment Guide

## Prerequisites
1. **Google Cloud Account** with billing enabled
2. **Domain name** (required for SSL certificates)
3. **Tools installed:**
   - gcloud CLI: https://cloud.google.com/sdk/docs/install
   - kubectl: https://kubernetes.io/docs/tasks/tools/
   - Docker: https://docs.docker.com/get-docker/

## Quick Start (PowerShell)

### 1. Configure your domain
```powershell
# Edit the deployment script with your domain
$Domain = "yourdomain.com"  # Replace with your actual domain
```

### 2. Run the deployment script
```powershell
# Make script executable and run
cd h:\mediasoup-video-call
.\scripts\deploy-gcp.ps1 -Domain "yourdomain.com" -ProjectId "your-project-id"
```

### 3. Configure DNS
When prompted, configure your domain's DNS:
```
A record: yourdomain.com → [EXTERNAL_IP_PROVIDED]
```

### 4. Update secrets
Edit `k8s/secrets.yaml` with actual database credentials:
```yaml
stringData:
  DATABASE_URL: "postgresql://videocall-user:YOUR_PASSWORD@DB_IP:5432/videocall"
  REDIS_URL: "redis://REDIS_IP:6379"
```

### 5. Manual steps during deployment
The script will pause for:
1. **Updating secrets.yaml** - Add your database password
2. **DNS configuration** - Point your domain to the external IP
3. **SSL certificate provisioning** - Wait for Google managed certificates

## Alternative: Manual Deployment

### Step 1: Setup GCP
```powershell
# Authenticate
gcloud auth login
gcloud auth application-default login

# Create project
gcloud projects create your-project-id
gcloud config set project your-project-id

# Enable APIs
gcloud services enable container.googleapis.com sqladmin.googleapis.com redis.googleapis.com
```

### Step 2: Create Infrastructure
```powershell
# Create GKE cluster
gcloud container clusters create mediasoup-cluster \
  --zone=us-central1-a \
  --machine-type=e2-standard-4 \
  --num-nodes=3

# Create databases
gcloud sql instances create mediasoup-db --database-version=POSTGRES_15 --tier=db-f1-micro --region=us-central1
gcloud redis instances create mediasoup-redis --size=1 --region=us-central1
```

### Step 3: Build and Deploy
```powershell
# Build images
docker build -t gcr.io/your-project-id/frontend:latest ./videocall
docker build -t gcr.io/your-project-id/backend:latest ./videocallbackend
docker build -t gcr.io/your-project-id/coturn:latest ./coturn

# Push images
gcloud auth configure-docker
docker push gcr.io/your-project-id/frontend:latest
docker push gcr.io/your-project-id/backend:latest
docker push gcr.io/your-project-id/coturn:latest

# Deploy to Kubernetes
kubectl apply -f k8s/
```

## Monitoring Your Deployment

### Check pod status
```powershell
kubectl get pods -n mediasoup
kubectl logs -f deployment/mediasoup-backend -n mediasoup
```

### Check services and ingress
```powershell
kubectl get svc -n mediasoup
kubectl get ingress -n mediasoup
kubectl describe ingress mediasoup-ingress -n mediasoup
```

### Check SSL certificate status
```powershell
kubectl get managedcertificate -n mediasoup
kubectl describe managedcertificate mediasoup-ssl-cert -n mediasoup
```

## Troubleshooting

### Common Issues

1. **SSL Certificate "Failed"**
   - Verify DNS is pointing to the correct IP
   - Wait up to 60 minutes for certificate provisioning
   - Check domain ownership verification

2. **Backend pods failing**
   - Check database connection strings in secrets
   - Verify Cloud SQL proxy configuration
   - Check MediaSoup port configuration

3. **COTURN connection issues**
   - Verify LoadBalancer external IP is accessible
   - Check firewall rules for UDP ports
   - Verify TURN server configuration

### Debug Commands
```powershell
# Pod logs
kubectl logs -f pod/POD_NAME -n mediasoup

# Execute into pod
kubectl exec -it pod/POD_NAME -n mediasoup -- /bin/sh

# Check events
kubectl get events -n mediasoup --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n mediasoup
kubectl top nodes
```

## Cost Optimization

### Development Environment
- Use preemptible nodes: Add `--preemptible` to cluster creation
- Reduce node count: `--num-nodes=1`
- Use smaller machine types: `--machine-type=e2-medium`

### Production Environment
- Enable autoscaling: `--enable-autoscaling --min-nodes=2 --max-nodes=10`
- Use persistent disks with snapshots
- Enable Cloud CDN for static assets

## Cleanup
```powershell
# Remove all resources
.\scripts\deploy-gcp.ps1 -Action cleanup

# Or manually
kubectl delete namespace mediasoup
gcloud container clusters delete mediasoup-cluster --zone=us-central1-a
gcloud sql instances delete mediasoup-db
gcloud redis instances delete mediasoup-redis --region=us-central1
```

## Estimated Costs (Monthly)
- **Development**: $50-100
- **Production**: $200-500
- **High Traffic**: $500-1000+

*Costs depend on usage, scaling, and resource allocation.*