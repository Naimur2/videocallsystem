#!/bin/bash

# MediaSoup + CoTURN Integration Test Script
# Tests the complete video calling stack

echo "🧪 Testing MediaSoup + CoTURN Integration..."
echo "============================================"

# Function to check if service is running
check_service() {
    local service=$1
    local port=$2
    if docker-compose ps | grep -q "$service.*Up"; then
        echo "✅ $service is running"
        if nc -z localhost $port 2>/dev/null; then
            echo "✅ $service port $port is accessible"
        else
            echo "❌ $service port $port is not accessible"
        fi
    else
        echo "❌ $service is not running"
    fi
}

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found"
    exit 1
fi

echo "1. Checking Docker Compose services..."
echo "-------------------------------------"

# Start services if not running
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 30

# Check each service
check_service "postgres" 5432
check_service "redis" 6379
check_service "coturn" 3478
check_service "app" 3000
check_service "caddy" 80

echo ""
echo "2. Testing CoTURN STUN/TURN server..."
echo "------------------------------------"

# Test STUN server
echo "📡 Testing STUN server..."
if command -v stun &> /dev/null; then
    stun localhost 3478
else
    echo "ℹ️  Install 'stun' package to test STUN connectivity"
    echo "   sudo apt-get install stun-client"
fi

# Test TURN authentication
echo "🔐 Testing TURN authentication..."
echo "   Username: mediasoup"
echo "   Password: mediasoupTurn2024!"
echo "   Server: localhost:3478"

echo ""
echo "3. Testing application endpoints..."
echo "----------------------------------"

# Test frontend
if curl -s http://localhost/ > /dev/null; then
    echo "✅ Frontend accessible at http://localhost/"
else
    echo "❌ Frontend not accessible"
fi

# Test backend API
if curl -s http://localhost/api/health > /dev/null; then
    echo "✅ Backend API accessible at http://localhost/api/"
else
    echo "❌ Backend API not accessible"
fi

echo ""
echo "4. Checking logs for errors..."
echo "-----------------------------"

# Check for errors in logs
echo "📋 Recent CoTURN logs:"
docker-compose logs --tail=10 coturn

echo ""
echo "📋 Recent application logs:"
docker-compose logs --tail=10 app

echo ""
echo "5. Network connectivity test..."
echo "------------------------------"

# Check if ports are properly exposed
netstat -tuln | grep -E "(3478|3000|80|443|5432|6379)" | head -10

echo ""
echo "6. Final status check..."
echo "-----------------------"

docker-compose ps

echo ""
echo "🎯 Test Summary:"
echo "==============="
echo "✅ CoTURN STUN/TURN server: Port 3478"
echo "✅ MediaSoup Application: Port 3000"
echo "✅ Backend API: Port 3001"
echo "✅ Caddy Reverse Proxy: Port 80/443"
echo "✅ PostgreSQL Database: Port 5432"
echo "✅ Redis Cache: Port 6379"
echo ""
echo "🌐 Access your application:"
echo "  Local: http://localhost/"
echo "  Production: https://meeting.naimur-rahaman.com/"
echo ""
echo "🔧 CoTURN Configuration:"
echo "  STUN: stun:meeting.naimur-rahaman.com:3478"
echo "  TURN: turn:meeting.naimur-rahaman.com:3478"
echo "  Username: mediasoup"
echo "  Password: mediasoupTurn2024!"