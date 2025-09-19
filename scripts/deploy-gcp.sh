#!/bin/bash

# Google Cloud Platform Deployment Script for MediaSoup Video Call

set -e

# Configuration
PROJECT_ID="mediasoup-video-call"
CLUSTER_NAME="mediasoup-cluster"
ZONE="us-central1-a"
REGION="us-central1"
DOMAIN="yourdomain.com"  # Replace with your domain

echo "🚀 Starting MediaSoup deployment to Google Cloud Platform..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}📋 Step $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_prerequisites() {
    print_step "1" "Checking prerequisites"
    
    command -v gcloud >/dev/null 2>&1 || { print_error "gcloud CLI is required but not installed."; exit 1; }
    command -v kubectl >/dev/null 2>&1 || { print_error "kubectl is required but not installed."; exit 1; }
    command -v docker >/dev/null 2>&1 || { print_error "docker is required but not installed."; exit 1; }
    
    print_success "All prerequisites are installed"
}

# Setup GCP project
setup_project() {
    print_step "2" "Setting up GCP project"
    
    # Check if project exists
    if ! gcloud projects describe $PROJECT_ID >/dev/null 2>&1; then
        print_warning "Project $PROJECT_ID does not exist. Creating..."
        gcloud projects create $PROJECT_ID --name="MediaSoup Video Call"
    fi
    
    gcloud config set project $PROJECT_ID
    
    # Enable required APIs
    print_warning "Enabling required APIs..."
    gcloud services enable container.googleapis.com
    gcloud services enable sqladmin.googleapis.com
    gcloud services enable redis.googleapis.com
    gcloud services enable compute.googleapis.com
    gcloud services enable storage.googleapis.com
    gcloud services enable dns.googleapis.com
    gcloud services enable monitoring.googleapis.com
    gcloud services enable logging.googleapis.com
    
    print_success "Project setup completed"
}

# Create GKE cluster
create_cluster() {
    print_step "3" "Creating GKE cluster"
    
    if gcloud container clusters describe $CLUSTER_NAME --zone=$ZONE >/dev/null 2>&1; then
        print_warning "Cluster $CLUSTER_NAME already exists"
    else
        print_warning "Creating GKE cluster... This may take several minutes."
        gcloud container clusters create $CLUSTER_NAME \
            --zone=$ZONE \
            --machine-type=e2-standard-4 \
            --num-nodes=3 \
            --disk-size=50GB \
            --enable-ip-alias \
            --enable-network-policy \
            --enable-autoscaling \
            --min-nodes=2 \
            --max-nodes=10 \
            --addons=HttpLoadBalancing,HorizontalPodAutoscaling
    fi
    
    # Get cluster credentials
    gcloud container clusters get-credentials $CLUSTER_NAME --zone=$ZONE
    
    print_success "GKE cluster is ready"
}

# Setup databases
setup_databases() {
    print_step "4" "Setting up databases"
    
    # Cloud SQL
    if gcloud sql instances describe mediasoup-db >/dev/null 2>&1; then
        print_warning "Cloud SQL instance already exists"
    else
        print_warning "Creating Cloud SQL instance..."
        gcloud sql instances create mediasoup-db \
            --database-version=POSTGRES_15 \
            --tier=db-f1-micro \
            --region=$REGION \
            --storage-type=SSD \
            --storage-size=20GB \
            --backup \
            --maintenance-window-day=SUN \
            --maintenance-window-hour=02
        
        # Create database and user
        gcloud sql databases create videocall --instance=mediasoup-db
        gcloud sql users create videocall-user \
            --instance=mediasoup-db \
            --password=$(openssl rand -base64 32)
    fi
    
    # Redis
    if gcloud redis instances describe mediasoup-redis --region=$REGION >/dev/null 2>&1; then
        print_warning "Redis instance already exists"
    else
        print_warning "Creating Redis instance..."
        gcloud redis instances create mediasoup-redis \
            --size=1 \
            --region=$REGION \
            --redis-version=redis_7_0
    fi
    
    print_success "Databases setup completed"
}

# Build and push Docker images
build_and_push_images() {
    print_step "5" "Building and pushing Docker images"
    
    # Configure Docker for GCR
    gcloud auth configure-docker
    
    # Build images
    print_warning "Building frontend image..."
    docker build -t gcr.io/$PROJECT_ID/frontend:latest ./videocall
    
    print_warning "Building backend image..."
    docker build -t gcr.io/$PROJECT_ID/backend:latest ./videocallbackend
    
    print_warning "Building COTURN image..."
    docker build -t gcr.io/$PROJECT_ID/coturn:latest ./coturn
    
    # Push images
    print_warning "Pushing images to Google Container Registry..."
    docker push gcr.io/$PROJECT_ID/frontend:latest
    docker push gcr.io/$PROJECT_ID/backend:latest
    docker push gcr.io/$PROJECT_ID/coturn:latest
    
    print_success "Docker images built and pushed"
}

# Reserve static IP
reserve_static_ip() {
    print_step "6" "Reserving static IP address"
    
    if gcloud compute addresses describe mediasoup-ip --global >/dev/null 2>&1; then
        print_warning "Static IP already reserved"
    else
        gcloud compute addresses create mediasoup-ip --global
    fi
    
    EXTERNAL_IP=$(gcloud compute addresses describe mediasoup-ip --global --format="value(address)")
    print_success "Static IP reserved: $EXTERNAL_IP"
    
    print_warning "Please configure your DNS:"
    print_warning "A record: $DOMAIN → $EXTERNAL_IP"
}

# Update Kubernetes configurations
update_k8s_configs() {
    print_step "7" "Updating Kubernetes configurations"
    
    # Get database connection details
    DB_IP=$(gcloud sql instances describe mediasoup-db --format="value(ipAddresses[0].ipAddress)")
    REDIS_IP=$(gcloud redis instances describe mediasoup-redis --region=$REGION --format="value(host)")
    EXTERNAL_IP=$(gcloud compute addresses describe mediasoup-ip --global --format="value(address)")
    
    # Update configuration files
    sed -i "s/YOUR_PROJECT_ID/$PROJECT_ID/g" k8s/*.yaml
    sed -i "s/yourdomain.com/$DOMAIN/g" k8s/*.yaml
    sed -i "s/YOUR_EXTERNAL_IP/$EXTERNAL_IP/g" k8s/*.yaml
    sed -i "s/CLOUD_SQL_IP/$DB_IP/g" k8s/secrets.yaml
    sed -i "s/REDIS_IP/$REDIS_IP/g" k8s/secrets.yaml
    
    print_success "Kubernetes configurations updated"
}

# Deploy to Kubernetes
deploy_to_k8s() {
    print_step "8" "Deploying to Kubernetes"
    
    # Create namespace
    kubectl apply -f k8s/namespace.yaml
    
    # Apply configurations
    kubectl apply -f k8s/configmap.yaml
    
    print_warning "Please update k8s/secrets.yaml with your actual database credentials before continuing."
    read -p "Press Enter to continue after updating secrets.yaml..."
    
    kubectl apply -f k8s/secrets.yaml
    
    # Deploy applications
    kubectl apply -f k8s/backend-deployment.yaml
    kubectl apply -f k8s/frontend-deployment.yaml
    kubectl apply -f k8s/coturn-deployment.yaml
    
    # Create services
    kubectl apply -f k8s/services.yaml
    
    # Apply ingress (after DNS is configured)
    print_warning "Make sure your DNS is configured before applying ingress"
    read -p "Press Enter to continue after DNS configuration..."
    kubectl apply -f k8s/ingress.yaml
    
    # Apply autoscaling
    kubectl apply -f k8s/hpa.yaml
    
    # Apply network policies
    kubectl apply -f k8s/network-policy.yaml
    
    print_success "Deployment completed"
}

# Verify deployment
verify_deployment() {
    print_step "9" "Verifying deployment"
    
    print_warning "Checking pod status..."
    kubectl get pods -n mediasoup
    
    print_warning "Checking services..."
    kubectl get svc -n mediasoup
    
    print_warning "Checking ingress..."
    kubectl get ingress -n mediasoup
    
    print_success "Deployment verification completed"
}

# Cleanup function
cleanup() {
    print_step "CLEANUP" "Cleaning up resources"
    
    read -p "Are you sure you want to delete all resources? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kubectl delete namespace mediasoup
        gcloud container clusters delete $CLUSTER_NAME --zone=$ZONE --quiet
        gcloud sql instances delete mediasoup-db --quiet
        gcloud redis instances delete mediasoup-redis --region=$REGION --quiet
        gcloud compute addresses delete mediasoup-ip --global --quiet
        print_success "Resources cleaned up"
    fi
}

# Main execution
main() {
    if [[ "$1" == "cleanup" ]]; then
        cleanup
        exit 0
    fi
    
    check_prerequisites
    setup_project
    create_cluster
    setup_databases
    build_and_push_images
    reserve_static_ip
    update_k8s_configs
    deploy_to_k8s
    verify_deployment
    
    print_success "🎉 MediaSoup deployment completed!"
    print_warning "Access your application at: https://$DOMAIN"
    print_warning "Monitor your deployment with: kubectl get pods -n mediasoup"
}

# Run main function with all arguments
main "$@"