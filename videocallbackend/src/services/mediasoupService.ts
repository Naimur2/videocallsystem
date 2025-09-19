/**
 * Complete MediaSoup Service Implementation
 */

import * as mediasoup from "mediasoup";
import {
    Consumer,
    Producer,
    Router,
    WebRtcTransport,
    Worker
} from "mediasoup/node/lib/types";

// Import unified MediaSoup configuration
import config from "../config/mediasoup";

// Use the centralized configuration with proper tunnel IP settings
const mediasoupConfig = config;

class MediaSoupService {
  private static instance: MediaSoupService;
  private workers: Worker[] = [];
  private routers = new Map<string, Router>();
  private webRtcServers = new Map<Worker, mediasoup.types.WebRtcServer>();
  private routerToWorker = new Map<Router, Worker>(); // Track router-worker relationship
  private nextWorkerIndex = 0;

  private constructor() {}

  static getInstance(): MediaSoupService {
    if (!MediaSoupService.instance) {
      MediaSoupService.instance = new MediaSoupService();
    }
    return MediaSoupService.instance;
  }

  async init(numWorkers: number = 1): Promise<void> {
    console.log(`[MediaSoup] Initializing ${numWorkers} worker(s)...`);

    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        rtcMinPort: mediasoupConfig.worker.rtcMinPort,
        rtcMaxPort: mediasoupConfig.worker.rtcMaxPort,
        logLevel: mediasoupConfig.worker.logLevel,
        logTags: mediasoupConfig.worker.logTags,
      });

      worker.on("died", (error) => {
        console.error("[MediaSoup] Worker died:", error);
        setTimeout(() => process.exit(1), 2000);
      });

      this.workers.push(worker);
      console.log(`[MediaSoup] Worker ${worker.pid} created`);

      // Create WebRTC Server for this worker (MediaSoup demo pattern)
      if (mediasoupConfig.webRtcServer) {
        try {
          const webRtcServer = await worker.createWebRtcServer({
            listenInfos: mediasoupConfig.webRtcServer.listenInfos
          });
          
          this.webRtcServers.set(worker, webRtcServer);
          console.log(`[MediaSoup] WebRTC Server created for worker ${worker.pid}:`, {
            listenInfos: mediasoupConfig.webRtcServer.listenInfos
          });
        } catch (error) {
          console.error(`[MediaSoup] Failed to create WebRTC server for worker ${worker.pid}:`, error);
          // Continue without WebRTC server - fallback to individual transports
        }
      }
    }

    console.log(
      `[MediaSoup] ${this.workers.length} worker(s) initialized successfully`
    );
  }

  private getNextWorker(): Worker {
    const worker = this.workers[this.nextWorkerIndex];
    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
    return worker;
  }

  async createRouter(roomId: string): Promise<Router> {
    if (this.routers.has(roomId)) {
      return this.routers.get(roomId)!;
    }

    const worker = this.getNextWorker();
    const router = await worker.createRouter({
      mediaCodecs: mediasoupConfig.router.mediaCodecs,
    });

    router.observer.on("close", () => {
      console.log(`[MediaSoup] Router closed for room: ${roomId}`);
      this.routers.delete(roomId);
      this.routerToWorker.delete(router); // Clean up mapping
    });

    this.routers.set(roomId, router);
    this.routerToWorker.set(router, worker); // Track router-worker relationship
    console.log(`[MediaSoup] Router created for room: ${roomId}`);

    return router;
  }

  getRouter(roomId: string): Router | null {
    return this.routers.get(roomId) || null;
  }

  /**
   * Get existing router or create new one for a room
   */
  async getOrCreateRouter(roomId?: string): Promise<Router> {
    // If no roomId provided, use a default router for capabilities
    const routerKey = roomId || 'default';
    
    const existingRouter = this.routers.get(routerKey);
    if (existingRouter) {
      console.log(`[MediaSoup] Using existing router for ${routerKey}`);
      return existingRouter;
    }

    console.log(`[MediaSoup] Creating new router for ${routerKey}`);
    return await this.createRouter(routerKey);
  }

  async createWebRtcTransport(router: Router): Promise<{
    transport: WebRtcTransport;
    params: {
      id: string;
      iceParameters: any;
      iceCandidates: any[];
      dtlsParameters: any;
    };
  }> {
    // Get the worker for this router using our mapping
    const worker = this.routerToWorker.get(router);
    const webRtcServer = worker ? this.webRtcServers.get(worker) : undefined;

    const transportOptions: any = {
      listenIps: mediasoupConfig.webRtcTransport.listenInfos.map(info => ({
        ip: info.ip,
        announcedIp: info.announcedAddress
      })),
      enableUdp: mediasoupConfig.webRtcTransport.enableUdp,
      enableTcp: mediasoupConfig.webRtcTransport.enableTcp,
      preferUdp: mediasoupConfig.webRtcTransport.preferUdp,
      initialAvailableOutgoingBitrate:
        mediasoupConfig.webRtcTransport.initialAvailableOutgoingBitrate,
    };

    // Use WebRTC server if available (MediaSoup demo pattern)
    if (webRtcServer) {
      transportOptions.webRtcServer = webRtcServer;
      console.log(`[MediaSoup] Creating transport with WebRTC server`);
    } else {
      console.log(`[MediaSoup] Creating transport without WebRTC server (fallback)`);
    }

    const transport = await router.createWebRtcTransport(transportOptions);

    if (mediasoupConfig.webRtcTransport.maxIncomingBitrate) {
      await transport.setMaxIncomingBitrate(
        mediasoupConfig.webRtcTransport.maxIncomingBitrate
      );
    }

    return {
      transport,
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    };
  }

  async connectTransport(
    transport: WebRtcTransport,
    dtlsParameters: any
  ): Promise<void> {
    await transport.connect({ dtlsParameters });
  }

  async createProducer(
    transport: WebRtcTransport,
    rtpParameters: any,
    kind: "audio" | "video"
  ): Promise<Producer> {
    const producer = await transport.produce({
      kind,
      rtpParameters,
    });

    return producer;
  }

  async createConsumer(
    router: Router,
    transport: WebRtcTransport,
    producer: Producer,
    rtpCapabilities: any
  ): Promise<Consumer | null> {
    if (!router.canConsume({ producerId: producer.id, rtpCapabilities })) {
      console.warn(`[MediaSoup] Cannot consume producer ${producer.id}`);
      return null;
    }

    const consumer = await transport.consume({
      producerId: producer.id,
      rtpCapabilities,
      paused: true,
    });

    return consumer;
  }

  async closeRouter(roomId: string): Promise<void> {
    const router = this.routers.get(roomId);
    if (router) {
      router.close();
      this.routers.delete(roomId);
      console.log(`[MediaSoup] Router closed for room: ${roomId}`);
    }
  }

  getRouterRtpCapabilities(router: Router): any {
    return router.rtpCapabilities;
  }

  async getWorkerResourceUsage(): Promise<any[]> {
    const stats = [];
    for (const worker of this.workers) {
      const resourceUsage = await worker.getResourceUsage();
      stats.push({
        pid: worker.pid,
        ...resourceUsage,
      });
    }
    return stats;
  }

  async cleanup(): Promise<void> {
    console.log("[MediaSoup] Cleaning up resources...");

    for (const [roomId, router] of this.routers.entries()) {
      router.close();
      console.log(`[MediaSoup] Router closed for room: ${roomId}`);
    }
    this.routers.clear();

    for (const worker of this.workers) {
      worker.close();
      console.log(`[MediaSoup] Worker ${worker.pid} closed`);
    }
    this.workers = [];
  }
}

export { MediaSoupService };
export default MediaSoupService.getInstance();
