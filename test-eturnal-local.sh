#!/bin/bash
# Local Testing Script for eTURN Migration
# Test the new eTURN setup locally before deployment

echo "🧪 Testing MediaSoup with eTURN locally..."
echo "================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker compose down --remove-orphans || true
docker system prune -f || true

echo "📋 Building and starting services..."
docker compose up -d postgres redis

echo "⏳ Waiting for database services..."
sleep 15

echo "🔄 Starting eTURN..."
docker compose up -d eturnal

echo "⏳ Waiting for eTURN to be healthy..."
for i in {1..12}; do
    if docker compose ps eturnal | grep -q "healthy"; then
        echo "✅ eTURN is healthy!"
        break
    elif docker compose ps eturnal | grep -q "unhealthy"; then
        echo "❌ eTURN failed health check!"
        docker compose logs eturnal
        exit 1
    else
        echo "⏳ eTURN still starting... ($i/12)"
        sleep 5
    fi
done

echo "🔄 Starting backend..."
docker compose up -d backend

echo "⏳ Waiting for backend to be healthy..."
for i in {1..24}; do
    if docker compose ps backend | grep -q "healthy"; then
        echo "✅ Backend is healthy!"
        break
    elif docker compose ps backend | grep -q "unhealthy"; then
        echo "❌ Backend failed health check!"
        docker compose logs backend
        exit 1
    else
        echo "⏳ Backend still starting... ($i/24)"
        sleep 10
    fi
done

echo "🌐 Starting frontend and proxy..."
docker compose up -d frontend caddy

echo "📊 Final status:"
docker compose ps

echo ""
echo "🎉 Local test completed!"
echo "🌐 Frontend: http://localhost"
echo "🔧 Backend API: http://localhost:3001/api/v1/health"
echo "📡 eTURN: UDP ports 49152-49171"

echo ""
echo "🧪 Testing backend health endpoint..."
curl -s http://localhost:3001/api/v1/health | jq . || echo "Health check endpoint test failed"

echo ""
echo "📋 Resource usage:"
docker stats --no-stream

echo ""
echo "🔍 To view logs:"
echo "  docker compose logs eturnal"
echo "  docker compose logs backend"
echo "  docker compose logs frontend"