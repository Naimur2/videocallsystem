FROM coturn/coturn:4.6.2-alpine

# Install additional packages
RUN apk add --no-cache \
    openssl \
    ca-certificates \
    netcat-openbsd

# Create coturn user and directories
RUN addgroup -g 1000 coturn && \
    adduser -u 1000 -G coturn -s /bin/sh -D coturn

RUN mkdir -p /var/lib/coturn /var/log/coturn /var/run/coturn && \
    chown -R coturn:coturn /var/lib/coturn /var/log/coturn /var/run/coturn

# Copy configuration
COPY turnserver.conf /etc/coturn/turnserver.conf

# Set permissions
RUN chown coturn:coturn /etc/coturn/turnserver.conf && \
    chmod 640 /etc/coturn/turnserver.conf

# Create volumes
VOLUME ["/var/lib/coturn", "/var/log/coturn"]

# Expose ports
EXPOSE 3478/udp 3478/tcp 5349/tcp 5349/udp 49152-65535/udp

# Switch to coturn user
USER coturn

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD nc -u -z localhost 3478 || exit 1

# Start TURN server
CMD ["turnserver", "-c", "/etc/coturn/turnserver.conf", "--pidfile="]