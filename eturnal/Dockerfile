# eTURN (eturnal) STUN/TURN Server
# Using official eTURN Docker image with environment configuration
# Optimized for AWS EC2 t2.large

FROM eturnal/eturnal:1.12.1

# Simple health check that checks if eturnal process is running
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD pgrep -f eturnal > /dev/null || exit 1

# Expose STUN/TURN ports
EXPOSE 3478/udp 3478/tcp 5349/tcp 5349/udp

# Expose relay port range (smaller range for t2.large)
EXPOSE 49152-49171/udp

# Use official image defaults - configuration via environment variables