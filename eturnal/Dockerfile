# eTURN (eturnal) STUN/TURN Server
# Modern, efficient alternative to CoTURN
# Optimized for AWS EC2 t2.large

FROM debian:12-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Download and install eturnal
ARG ETURNAL_VERSION=1.12.0
RUN wget -O eturnal.deb \
    "https://github.com/processone/eturnal/releases/download/${ETURNAL_VERSION}/eturnal_${ETURNAL_VERSION}-1_amd64.deb" \
    && dpkg -i eturnal.deb \
    && apt-get -f install -y \
    && rm eturnal.deb

# Create directories for configuration and logs
RUN mkdir -p /etc/eturnal \
    && mkdir -p /var/log/eturnal \
    && mkdir -p /var/lib/eturnal

# Copy configuration
COPY eturnal.yml /etc/eturnal/eturnal.yml

# Set proper permissions
RUN chown -R eturnal:eturnal /etc/eturnal /var/log/eturnal /var/lib/eturnal

# Health check using netcat to test STUN port
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD nc -u -z localhost 3478 || (echo "Health check failed - eTURN not responding on port 3478" && exit 1)

# Switch to eturnal user for security
USER eturnal

# Create startup script with error logging
USER root
RUN echo '#!/bin/bash' > /usr/local/bin/eturnal-start.sh && \
    echo 'set -e' >> /usr/local/bin/eturnal-start.sh && \
    echo 'echo "[$(date)] Starting eTURN with debugging..."' >> /usr/local/bin/eturnal-start.sh && \
    echo 'echo "[$(date)] Configuration check..."' >> /usr/local/bin/eturnal-start.sh && \
    echo 'eturnal eval "eturnal:get_config()."' >> /usr/local/bin/eturnal-start.sh && \
    echo 'echo "[$(date)] Starting eTURN foreground process..."' >> /usr/local/bin/eturnal-start.sh && \
    echo 'exec eturnal foreground' >> /usr/local/bin/eturnal-start.sh && \
    chmod +x /usr/local/bin/eturnal-start.sh

USER eturnal

# Expose STUN/TURN ports
EXPOSE 3478/udp 3478/tcp 5349/tcp 5349/udp

# Expose relay port range (smaller range for t2.large)
EXPOSE 49152-49171/udp

# Start eturnal with enhanced logging
CMD ["/usr/local/bin/eturnal-start.sh"]