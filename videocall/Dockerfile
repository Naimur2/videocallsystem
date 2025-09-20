# Production Build# Build arguments for Next.js environment variables
ARG NEXT_PUBLIC_BACKEND_URL=https://localhost/api
ARG NEXT_PUBLIC_SOCKET_URL=https://localhost
ARG NEXT_PUBLIC_TURN_SERVER_HOST=localhostkerfile for Next.js MediaSoup Frontend
FROM node:20-alpine AS builder

# Install system dependencies
RUN apk add --no-cache curl libc6-compat

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build arguments for Next.js public environment variables
ARG NEXT_PUBLIC_BACKEND_URL=https://meet.naimur-rahaman.comm/api
ARG NEXT_PUBLIC_SOCKET_URL=https://meet.naimur-rahaman.comm
ARG NEXT_PUBLIC_TURN_SERVER_HOST=meet.naimur-rahaman.comm
ARG NEXT_PUBLIC_TURN_USERNAME=mediasoup
ARG NEXT_PUBLIC_TURN_PASSWORD=mediasoup123

# Set environment variables for build
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_TURN_SERVER_HOST=$NEXT_PUBLIC_TURN_SERVER_HOST
ENV NEXT_PUBLIC_TURN_USERNAME=$NEXT_PUBLIC_TURN_USERNAME
ENV NEXT_PUBLIC_TURN_PASSWORD=$NEXT_PUBLIC_TURN_PASSWORD
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Production runtime
FROM node:20-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set runtime environment
ENV PORT=3000
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start production server
CMD ["node", "server.js"]
