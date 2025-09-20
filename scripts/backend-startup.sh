#!/bin/sh
# backend-startup.sh - Wait for dependencies then start backend

set -e

echo "🚀 Backend startup script - waiting for dependencies..."

# Wait for PostgreSQL
echo "📊 Waiting for PostgreSQL..."
until nc -z postgres 5432; do
  echo "🔄 PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Wait for Redis
echo "🗄️ Waiting for Redis..."
until nc -z redis 6379; do
  echo "🔄 Redis is unavailable - sleeping"
  sleep 2
done
echo "✅ Redis is ready!"

# Wait for eTURN STUN/TURN service
echo "🌐 Waiting for eTURN..."
until nc -z eturnal 3478; do
  echo "🔄 eTURN is unavailable - sleeping"
  sleep 2
done
echo "✅ eTURN is ready!"

echo "🎯 All dependencies ready! Starting backend..."

# Start the backend application
exec "$@"