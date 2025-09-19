# Google Cloud Platform Deployment Guide

## Overview
This guide covers deploying the MediaSoup video call application to Google Cloud Platform using:
- **Google Kubernetes Engine (GKE)** for container orchestration
- **Cloud SQL** for PostgreSQL database
- **Memorystore** for Redis cache
- **Cloud Load Balancer** with SSL certificates
- **Cloud Storage** for static assets and recordings

## Architecture Overview

```
Internet → Cloud Load Balancer → GKE Cluster
                                     ↓
                    Frontend Pod ← → Backend Pod
                         ↓               ↓
                 Cloud Storage    Cloud SQL + Memorystore
                                     ↓
                              COTURN Pod (UDP/TCP)
```

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed and authenticated
3. **kubectl** installed
4. **Docker** installed locally

## Step 1: Setup Google Cloud Project

```bash
# Create new project
gcloud projects create mediasoup-video-call --name="MediaSoup Video Call"

# Set project
gcloud config set project mediasoup-video-call

# Enable required APIs
gcloud services enable container.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable dns.googleapis.com
```

## Step 2: Create GKE Cluster

```bash
# Create GKE cluster with specific configuration for MediaSoup
gcloud container clusters create mediasoup-cluster \
  --zone=us-central1-a \
  --machine-type=e2-standard-4 \
  --num-nodes=3 \
  --disk-size=50GB \
  --enable-ip-alias \
  --enable-network-policy \
  --enable-autoscaling \
  --min-nodes=2 \
  --max-nodes=10 \
  --addons=HttpLoadBalancing,HorizontalPodAutoscaling

# Get cluster credentials
gcloud container clusters get-credentials mediasoup-cluster --zone=us-central1-a
```

## Step 3: Setup Database and Cache

### Cloud SQL (PostgreSQL)
```bash
# Create Cloud SQL instance
gcloud sql instances create mediasoup-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=20GB \
  --backup \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=02

# Create database
gcloud sql databases create videocall --instance=mediasoup-db

# Create user
gcloud sql users create videocall-user \
  --instance=mediasoup-db \
  --password=YOUR_SECURE_PASSWORD
```

### Memorystore (Redis)
```bash
# Create Redis instance
gcloud redis instances create mediasoup-redis \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0
```

## Step 4: Setup Container Registry

```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Build and push images
docker build -t gcr.io/mediasoup-video-call/frontend:latest ./videocall
docker build -t gcr.io/mediasoup-video-call/backend:latest ./videocallbackend
docker build -t gcr.io/mediasoup-video-call/coturn:latest ./coturn

docker push gcr.io/mediasoup-video-call/frontend:latest
docker push gcr.io/mediasoup-video-call/backend:latest
docker push gcr.io/mediasoup-video-call/coturn:latest
```

## Step 5: Kubernetes Configurations

Create these YAML files:

### 5.1 Namespace
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: mediasoup
```

### 5.2 ConfigMap
```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mediasoup-config
  namespace: mediasoup
data:
  NODE_ENV: "production"
  CORS_ORIGIN: "https://yourdomain.com"
  MEDIASOUP_LISTEN_IP: "0.0.0.0"
  TURN_SERVER_HOST: "coturn-service"
  TURN_SERVER_PORT: "3478"
  TURN_USERNAME: "mediasoup"
  TURN_PASSWORD: "mediasoup123"
```

### 5.3 Secrets
```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: mediasoup-secrets
  namespace: mediasoup
type: Opaque
data:
  DATABASE_URL: <base64-encoded-connection-string>
  REDIS_URL: <base64-encoded-redis-url>
```

### 5.4 Backend Deployment
```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mediasoup-backend
  namespace: mediasoup
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mediasoup-backend
  template:
    metadata:
      labels:
        app: mediasoup-backend
    spec:
      containers:
      - name: backend
        image: gcr.io/mediasoup-video-call/backend:latest
        ports:
        - containerPort: 3201
        - containerPort: 44444
          protocol: UDP
        - containerPort: 40000
          protocol: UDP
        - containerPort: 40199
          protocol: UDP
        env:
        - name: PORT
          value: "3201"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: mediasoup-secrets
              key: DATABASE_URL
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: mediasoup-secrets
              key: REDIS_URL
        envFrom:
        - configMapRef:
            name: mediasoup-config
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

### 5.5 Frontend Deployment
```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mediasoup-frontend
  namespace: mediasoup
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mediasoup-frontend
  template:
    metadata:
      labels:
        app: mediasoup-frontend
    spec:
      containers:
      - name: frontend
        image: gcr.io/mediasoup-video-call/frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_BACKEND_URL
          value: "https://yourdomain.com/api"
        - name: NEXT_PUBLIC_SOCKET_URL
          value: "https://yourdomain.com"
        resources:
          requests:
            memory: "256Mi"
            cpu: "125m"
          limits:
            memory: "512Mi"
            cpu: "250m"
```

### 5.6 COTURN Deployment
```yaml
# k8s/coturn-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mediasoup-coturn
  namespace: mediasoup
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mediasoup-coturn
  template:
    metadata:
      labels:
        app: mediasoup-coturn
    spec:
      containers:
      - name: coturn
        image: gcr.io/mediasoup-video-call/coturn:latest
        ports:
        - containerPort: 3478
          protocol: UDP
        - containerPort: 3478
          protocol: TCP
        - containerPort: 5349
          protocol: UDP
        - containerPort: 5349
          protocol: TCP
        - containerPort: 49152
          protocol: UDP
        - containerPort: 65535
          protocol: UDP
        env:
        - name: TURN_USERNAME
          value: "mediasoup"
        - name: TURN_PASSWORD
          value: "mediasoup123"
```

### 5.7 Services
```yaml
# k8s/services.yaml
apiVersion: v1
kind: Service
metadata:
  name: mediasoup-backend-service
  namespace: mediasoup
spec:
  selector:
    app: mediasoup-backend
  ports:
  - name: http
    port: 3201
    targetPort: 3201
  - name: webrtc-udp
    port: 44444
    targetPort: 44444
    protocol: UDP
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: mediasoup-frontend-service
  namespace: mediasoup
spec:
  selector:
    app: mediasoup-frontend
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: coturn-service
  namespace: mediasoup
spec:
  selector:
    app: mediasoup-coturn
  ports:
  - name: turn-udp
    port: 3478
    targetPort: 3478
    protocol: UDP
  - name: turn-tcp
    port: 3478
    targetPort: 3478
    protocol: TCP
  type: LoadBalancer
```

### 5.8 Ingress with SSL
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mediasoup-ingress
  namespace: mediasoup
  annotations:
    kubernetes.io/ingress.global-static-ip-name: "mediasoup-ip"
    networking.gke.io/managed-certificates: "mediasoup-ssl-cert"
    kubernetes.io/ingress.class: "gce"
spec:
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /api/*
        pathType: ImplementationSpecific
        backend:
          service:
            name: mediasoup-backend-service
            port:
              number: 3201
      - path: /*
        pathType: ImplementationSpecific
        backend:
          service:
            name: mediasoup-frontend-service
            port:
              number: 3000
---
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: mediasoup-ssl-cert
  namespace: mediasoup
spec:
  domains:
    - yourdomain.com
```

## Step 6: Deploy to GKE

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply configurations
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# Deploy applications
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/coturn-deployment.yaml

# Create services
kubectl apply -f k8s/services.yaml

# Reserve static IP
gcloud compute addresses create mediasoup-ip --global

# Apply ingress
kubectl apply -f k8s/ingress.yaml
```

## Step 7: Domain and DNS Setup

```bash
# Get the external IP
gcloud compute addresses describe mediasoup-ip --global

# Configure your domain's DNS to point to this IP
# A record: yourdomain.com → [EXTERNAL_IP]
```

## Step 8: Monitoring and Logging

### Setup Monitoring
```bash
# Enable Google Cloud Operations
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com

# Install monitoring agent (optional)
kubectl apply -f https://raw.githubusercontent.com/GoogleCloudPlatform/k8s-stackdriver/master/resources/local-ssd/stackdriver-metadata-agent-cluster-role.yaml
```

### Resource Monitoring
```yaml
# k8s/hpa.yaml - Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: mediasoup-backend-hpa
  namespace: mediasoup
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: mediasoup-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Step 9: Security Best Practices

1. **Network Policies**:
```yaml
# k8s/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: mediasoup-network-policy
  namespace: mediasoup
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: mediasoup
  egress:
  - {}
```

2. **Pod Security**:
```yaml
# Add to deployment specs
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 2000
```

## Step 10: Backup and Disaster Recovery

```bash
# Setup automated backups for Cloud SQL
gcloud sql instances patch mediasoup-db \
  --backup-start-time=02:00 \
  --enable-bin-log

# Setup scheduled snapshots for persistent disks
gcloud compute resource-policies create snapshot-schedule daily-backup \
  --region=us-central1 \
  --max-retention-days=7 \
  --on-source-disk-delete=keep-auto-snapshots \
  --daily-schedule \
  --start-time=03:00
```

## Cost Optimization Tips

1. **Use Preemptible Nodes** for development:
```bash
gcloud container node-pools create preemptible-pool \
  --cluster=mediasoup-cluster \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --preemptible \
  --num-nodes=2
```

2. **Enable Cluster Autoscaling**:
```bash
gcloud container clusters update mediasoup-cluster \
  --zone=us-central1-a \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=5
```

3. **Use Cloud CDN** for static assets:
```bash
gcloud compute backend-buckets create frontend-bucket \
  --gcs-bucket-name=your-static-assets-bucket
```

## Estimated Monthly Costs

- **GKE Cluster**: $150-300 (depending on node count)
- **Cloud SQL**: $25-50 (db-f1-micro)
- **Memorystore**: $30-60 (1GB Redis)
- **Load Balancer**: $20-30
- **Storage**: $5-15
- **Total**: ~$230-455/month

## Troubleshooting

### Common Issues:

1. **MediaSoup UDP Issues**:
   - Ensure UDP ports are properly exposed
   - Check firewall rules for WebRTC traffic

2. **SSL Certificate Issues**:
   - Verify domain ownership
   - Check DNS propagation

3. **Database Connection Issues**:
   - Verify Cloud SQL proxy configuration
   - Check network policies

### Debugging Commands:
```bash
# Check pod status
kubectl get pods -n mediasoup

# View logs
kubectl logs -f deployment/mediasoup-backend -n mediasoup

# Check services
kubectl get svc -n mediasoup

# Describe ingress
kubectl describe ingress mediasoup-ingress -n mediasoup
```

## Production Checklist

- [ ] SSL certificates configured
- [ ] Database backups enabled
- [ ] Monitoring and alerting setup
- [ ] Resource limits configured
- [ ] Network policies applied
- [ ] Security contexts defined
- [ ] Horizontal Pod Autoscaler configured
- [ ] Load testing completed
- [ ] Disaster recovery plan documented

This deployment provides a production-ready, scalable MediaSoup video call application on Google Cloud Platform.