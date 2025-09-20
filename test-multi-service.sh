#!/usr/bin/env bash

# Multi-Service Deployment Test Script
# Tests the new GHCR-based multi-service architecture

set -e

echo "🧪 Multi-Service Architecture Test Script"
echo "=========================================="

# Configuration
COMPOSE_FILE="docker-compose.yml"
DEV_OVERRIDE="docker-compose.dev.yml"
PROJECT_NAME="videocallsystem-test"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Test functions
test_compose_config() {
    log_info "Testing Docker Compose configuration..."
    
    if docker compose -f $COMPOSE_FILE config --quiet; then
        log_success "Compose configuration is valid"
    else
        log_error "Compose configuration has errors"
        return 1
    fi
}

test_image_availability() {
    log_info "Checking GHCR image availability..."
    
    local images=(
        "ghcr.io/naimur2/videocallsystem-frontend:latest"
        "ghcr.io/naimur2/videocallsystem-backend:latest" 
        "ghcr.io/naimur2/videocallsystem-eturnal:latest"
        "ghcr.io/naimur2/videocallsystem-app:latest"
    )
    
    for image in "${images[@]}"; do
        log_info "Checking $image..."
        if docker pull $image > /dev/null 2>&1; then
            log_success "✓ $image available"
        else
            log_warning "⚠ $image not available (will be built on first workflow run)"
        fi
    done
}

test_service_startup() {
    log_info "Testing service startup..."
    
    # Start core services (without custom images that might not exist yet)
    log_info "Starting infrastructure services..."
    docker compose -f $COMPOSE_FILE up -d postgres redis
    
    # Wait for infrastructure
    log_info "Waiting for infrastructure to be ready..."
    sleep 10
    
    # Check infrastructure health
    if docker compose -f $COMPOSE_FILE exec -T postgres pg_isready -U mediasoup > /dev/null 2>&1; then
        log_success "✓ PostgreSQL is ready"
    else
        log_error "✗ PostgreSQL failed to start"
        return 1
    fi
    
    if docker compose -f $COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
        log_success "✓ Redis is ready" 
    else
        log_error "✗ Redis failed to start"
        return 1
    fi
}

test_development_setup() {
    log_info "Testing development environment setup..."
    
    # Test with development overrides
    if docker compose -f $COMPOSE_FILE -f $DEV_OVERRIDE config --quiet; then
        log_success "✓ Development configuration is valid"
    else
        log_error "✗ Development configuration has errors"
        return 1
    fi
}

test_networking() {
    log_info "Testing service networking..."
    
    # Check if services can communicate
    local network_name="${PROJECT_NAME}_default"
    
    if docker network ls | grep -q $network_name; then
        log_success "✓ Docker network created"
    else
        log_warning "⚠ Custom network not found, using default"
    fi
}

test_volumes() {
    log_info "Testing volume creation..."
    
    local volumes=(
        "${PROJECT_NAME}_postgres_data"
        "${PROJECT_NAME}_redis_data"
        "${PROJECT_NAME}_nginx_logs"
        "${PROJECT_NAME}_eturnal_data"
    )
    
    for volume in "${volumes[@]}"; do
        if docker volume ls | grep -q $(echo $volume | sed "s/${PROJECT_NAME}_//"); then
            log_success "✓ Volume $volume exists"
        else
            log_info "Volume $volume will be created on startup"
        fi
    done
}

cleanup() {
    log_info "Cleaning up test environment..."
    docker compose -f $COMPOSE_FILE down --remove-orphans --volumes 2>/dev/null || true
    docker system prune -f > /dev/null 2>&1 || true
    log_success "Cleanup completed"
}

run_full_test() {
    log_info "Running comprehensive multi-service test..."
    
    # Cleanup first
    cleanup
    
    # Run all tests
    test_compose_config || return 1
    test_development_setup || return 1
    test_image_availability
    test_service_startup || return 1
    test_networking
    test_volumes
    
    log_success "All tests completed successfully!"
    
    # Show final status
    echo ""
    echo "📊 Final Status:"
    docker compose -f $COMPOSE_FILE ps
    
    echo ""
    echo "🔍 Service Health:"
    docker compose -f $COMPOSE_FILE exec -T postgres pg_isready -U mediasoup || echo "PostgreSQL: Not ready"
    docker compose -f $COMPOSE_FILE exec -T redis redis-cli ping || echo "Redis: Not ready"
    
    echo ""
    echo "📋 Volume Status:"
    docker volume ls | grep videocallsystem || echo "No volumes created yet"
    
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Push code to trigger image builds: git push origin main"
    echo "2. Monitor build workflow: https://github.com/YOUR_ORG/videocallsystem/actions"
    echo "3. Deploy with images: docker compose -f $COMPOSE_FILE up -d"
    echo "4. Access services:"
    echo "   - Frontend: http://localhost:3000 (dev mode)"
    echo "   - Backend: http://localhost:8080 (dev mode)" 
    echo "   - Database: localhost:5432 (dev mode)"
}

# Main execution
case "${1:-full}" in
    "config")
        test_compose_config
        ;;
    "images")
        test_image_availability
        ;;
    "startup")
        test_service_startup
        ;;
    "cleanup")
        cleanup
        ;;
    "full"|*)
        run_full_test
        ;;
esac

echo ""
log_success "Test script completed!"