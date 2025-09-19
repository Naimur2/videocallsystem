#!/bin/bash

# CoTURN Setup Script for MediaSoup Video Call
# This script sets up CoTURN server for WebRTC NAT traversal

echo "🔧 Setting up CoTURN for MediaSoup Video Call..."

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p coturn/logs
mkdir -p data/coturn

# Set permissions
echo "🔐 Setting permissions..."
chmod 755 coturn/
chmod 644 coturn/turnserver.conf
chmod 755 coturn/logs

# Generate SSL certificates (optional, for TLS)
echo "🔒 Generating SSL certificates (optional)..."
if [ ! -f coturn/turn_server_cert.pem ]; then
    openssl req -new -x509 -keyout coturn/turn_server_pkey.pem -out coturn/turn_server_cert.pem -days 365 -nodes \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=meeting.naimur-rahaman.com"
    echo "✅ SSL certificates generated"
else
    echo "ℹ️  SSL certificates already exist"
fi

# Create users database
echo "👥 Setting up users database..."
# This will be handled by the Docker container

echo "🚀 CoTURN setup complete!"
echo ""
echo "📋 Configuration Summary:"
echo "   - TURN/STUN Port: 3478 (TCP/UDP)"
echo "   - TLS Port: 5349 (TCP/UDP)"  
echo "   - Relay Ports: 49152-65535 (UDP)"
echo "   - Username: mediasoup"
echo "   - Password: mediasoupTurn2024!"
echo "   - Server: meeting.naimur-rahaman.com"
echo "   - External IP: 35.159.46.197"
echo ""
echo "🔓 Firewall Ports to Open:"
echo "   - 3478/tcp, 3478/udp (TURN/STUN)"
echo "   - 5349/tcp, 5349/udp (TURN/STUN over TLS)"
echo "   - 49152-65535/udp (TURN relay)"
echo ""
echo "🎯 To start CoTURN: docker-compose up -d coturn"