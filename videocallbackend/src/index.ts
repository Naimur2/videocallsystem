import { createServer } from "http";
import { createApp } from "./app";
import { config } from "./config";
import mediaSoupService from "./services/mediasoupService";
import socketService from "./services/socketService";

// Create and start the server with MediaSoup and Socket.IO
const main = async (): Promise<void> => {
  try {
    console.log("🚀 Starting MediaSoup Video Call Backend...");

    // Add global error handlers
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Promise Rejection:', reason);
      console.error('Promise:', promise);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Initialize MediaSoup
    await mediaSoupService.init(1); // Start with 1 worker

    // Create Express app
    const app = createApp(config);

    // Create HTTP server
    const httpServer = createServer(app);

    // Create Socket.IO server with optimized configuration
    const { Server } = require("socket.io");
    const io = new Server(httpServer, {
      cors: {
        origin: config.allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
      },
      // Socket.IO v4+ Performance Optimizations
      transports: ['websocket'], // WebSocket-only, disable polling
      allowEIO3: false, // Disable legacy Engine.IO v3 compatibility
      pingTimeout: 60000, // Time to wait for ping response
      pingInterval: 25000, // Interval between pings
      upgradeTimeout: 10000, // Time to wait for transport upgrade
      maxHttpBufferSize: 1e6, // 1MB max buffer size for HTTP long-polling
      allowRequest: (req: any, callback: (err: Error | null, success: boolean) => void) => {
        // Optional: Add custom connection validation
        callback(null, true);
      },
      // Connection state recovery for reconnections
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true,
      },
      // Optimize for real-time performance
      serveClient: false, // Don't serve Socket.IO client files
      connectTimeout: 45000 // Connection timeout
    });

    // Initialize Socket.IO service with MediaSoup integration
    socketService.initialize(io);

    // Start server
    httpServer.listen(config.port, () => {
      console.log(`✅ Server is running on port ${config.port}`);
      console.log(
        `📚 API Documentation: http://localhost:${config.port}/api-docs`
      );
      console.log(
        `🏥 Health Check: http://localhost:${config.port}/api/v1/health`
      );
      console.log(`🔌 Socket.IO: ws://localhost:${config.port}`);
      console.log("🎥 MediaSoup workers initialized and ready for video calls");

      // Start periodic room cleanup (every 5 minutes)
      setInterval(() => {
        const cleaned =
          require("./services/roomService").roomService.cleanupInactiveRooms(
            0.5
          ); // 30 minutes
        if (cleaned > 0) {
          console.log(`🧹 Cleaned up ${cleaned} inactive rooms`);
        }
      }, 5 * 60 * 1000); // 5 minutes
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📴 Received ${signal}, shutting down gracefully...`);

      httpServer.close(async () => {
        console.log("🔌 HTTP server closed");

        // Cleanup MediaSoup resources
        await mediaSoupService.cleanup();
        console.log("🎥 MediaSoup resources cleaned up");

        console.log("✅ Server shutdown complete");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Error handling
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Promise Rejection:", { reason, promise });
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
