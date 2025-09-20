#!/bin/sh
# wait-for-services.sh - Wait for database and eTURN services before starting backend

set -e

host="$1"
port="$2"
shift 2
cmd="$@"

echo "⏳ Waiting for service at $host:$port..."

until nc -z "$host" "$port"; do
  echo "🔄 Service $host:$port is unavailable - sleeping"
  sleep 2
done

echo "✅ Service $host:$port is available!"

if [ -n "$cmd" ]; then
  exec $cmd
fi