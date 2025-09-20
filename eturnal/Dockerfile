# eTURN (eturnal) STUN/TURN Server
# Using official eTURN Docker image - much simpler and more reliable!
# Optimized for AWS EC2 t2.large

FROM eturnal/eturnal:1.12.1

# Switch to root to configure
USER root

# Copy our configuration
COPY eturnal.yml /etc/eturnal/eturnal.yml

# Set proper permissions
RUN chown -R eturnal:eturnal /etc/eturnal/eturnal.yml

# Simple health check that checks if eturnal process is running
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD pgrep eturnal > /dev/null || exit 1

# Switch back to eturnal user for security
USER eturnal

# Expose STUN/TURN ports
EXPOSE 3478/udp 3478/tcp 5349/tcp 5349/udp

# Expose relay port range (smaller range for t2.large)
EXPOSE 49152-49171/udp

# Start eturnal (official image handles this automatically)
CMD ["eturnal", "foreground"]