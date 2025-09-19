import * as mediasoupClient from "mediasoup-client";
import { Socket } from "socket.io-client";
import { getTurnConfiguration } from "../config/turnConfig";

export interface CreateTransportOptions {
  producing: boolean;
  consuming: boolean;
  sctpCapabilities?: any;
}

export interface ProduceOptions {
  kind: "audio" | "video";
  track: MediaStreamTrack;
  codecOptions?: any;
  encodings?: RTCRtpEncodingParameters[];
  appData?: any;
}

export interface ConsumeParams {
  id: string;
  producerId: string;
  kind: "audio" | "video";
  rtpParameters: any;
}

class MediaSoupClientService {
  private device?: mediasoupClient.types.Device;
  private socket?: Socket;
  private sendTransport?: mediasoupClient.types.Transport;
  private receiveTransport?: mediasoupClient.types.Transport;
  private producers = new Map<string, mediasoupClient.types.Producer>();
  private consumers = new Map<string, mediasoupClient.types.Consumer>();

  async initializeDevice(rtpCapabilities: any): Promise<void> {
    console.log("[MediaSoup] Initializing device");
    
    if (!this.device) {
      this.device = new mediasoupClient.Device();
    }
    
    if (!this.device.loaded) {
      await this.device.load({ routerRtpCapabilities: rtpCapabilities });
      console.log("[MediaSoup] Device loaded successfully");
    }
  }

  getRtpCapabilities(): any {
    return this.device?.rtpCapabilities;
  }

  getSendTransport(): mediasoupClient.types.Transport | undefined {
    return this.sendTransport;
  }

  getReceiveTransport(): mediasoupClient.types.Transport | undefined {
    return this.receiveTransport;
  }

  setSocket(socket: Socket): void {
    this.socket = socket;
    console.log("[MediaSoup] Socket set");
  }

  async createTransports(): Promise<void> {
    if (!this.device || !this.socket) {
      throw new Error("Device or socket not initialized");
    }

    console.log("[MediaSoup] Creating transports");

    // Create send transport
    await this.createSendTransport();
    
    // Create receive transport
    await this.createReceiveTransport();
    
    console.log("[MediaSoup] Transports created successfully");
  }

  private async createSendTransport(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("[MediaSoup] EMIT -> createWebRtcTransport (producing: true)");
      this.socket!.emit("createWebRtcTransport", {
        producing: true,
        consuming: false,
        sctpCapabilities: this.device!.sctpCapabilities
      }, (response: any) => {
        if (response.error) {
          console.error("[MediaSoup] Send transport creation failed:", response.error);
          reject(new Error(response.error));
          return;
        }

        try {
          const turnConfig = getTurnConfiguration();
          
          this.sendTransport = this.device!.createSendTransport({
            id: response.id,
            iceParameters: response.iceParameters,
            iceCandidates: response.iceCandidates,
            dtlsParameters: response.dtlsParameters,
            sctpParameters: response.sctpParameters,
            // Use Metered TURN servers with fallback to server-provided
            iceServers: response.iceServers || turnConfig.iceServers
          });

          // Handle transport events
          this.sendTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
            console.log("[MediaSoup] EMIT -> connectWebRtcTransport (sendTransport)");
            this.socket!.emit("connectWebRtcTransport", {
              transportId: this.sendTransport!.id,
              dtlsParameters
            }, (response: any) => {
              if (response.error) {
                errback(new Error(response.error));
              } else {
                callback();
              }
            });
          });

          this.sendTransport.on("produce", (params: any, callback, errback) => {
            console.log("[MediaSoup] EMIT -> produce (sendTransport)", { kind: params.kind });
            this.socket!.emit("produce", {
              transportId: this.sendTransport!.id,
              kind: params.kind,
              rtpParameters: params.rtpParameters,
              appData: params.appData // Include appData for identifying stream type
            }, (response: any) => {
              if (response.error) {
                errback(new Error(response.error));
              } else {
                callback({ id: response.id });
              }
            });
          });

          console.log("[MediaSoup] Send transport created");
          resolve();
        } catch (error) {
          console.error("[MediaSoup] Send transport setup failed:", error);
          reject(error);
        }
      });
    });
  }

  private async createReceiveTransport(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("[MediaSoup] EMIT -> createWebRtcTransport (consuming: true)");
      this.socket!.emit("createWebRtcTransport", {
        producing: false,
        consuming: true,
        sctpCapabilities: this.device!.sctpCapabilities
      }, (response: any) => {
        if (response.error) {
          console.error("[MediaSoup] Receive transport creation failed:", response.error);
          reject(new Error(response.error));
          return;
        }

        try {
          const turnConfig = getTurnConfiguration();
          
          this.receiveTransport = this.device!.createRecvTransport({
            id: response.id,
            iceParameters: response.iceParameters,
            iceCandidates: response.iceCandidates,
            dtlsParameters: response.dtlsParameters,
            sctpParameters: response.sctpParameters,
            // Use Metered TURN servers with fallback to server-provided
            iceServers: response.iceServers || turnConfig.iceServers
          });

          // Handle transport events
          this.receiveTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
            console.log("[MediaSoup] EMIT -> connectWebRtcTransport (recvTransport)");
            this.socket!.emit("connectWebRtcTransport", {
              transportId: this.receiveTransport!.id,
              dtlsParameters
            }, (response: any) => {
              if (response.error) {
                console.error("[MediaSoup] Receive transport connect failed:", response.error);
                errback(new Error(response.error));
              } else {
                console.log("[MediaSoup] ✅ Receive transport connected successfully");
                callback();
              }
            });
          });

          this.receiveTransport.on("connectionstatechange", (state) => {
            console.log(`[MediaSoup] 🔄 Receive transport connection state changed: ${state}`);
          });

          this.receiveTransport.on("icegatheringstatechange", (state) => {
            console.log(`[MediaSoup] 🧊 Receive transport ICE gathering state changed: ${state}`);
          });

          console.log("[MediaSoup] Receive transport created");
          resolve();
        } catch (error) {
          console.error("[MediaSoup] Receive transport setup failed:", error);
          reject(error);
        }
      });
    });
  }

  async startProducingMedia(stream: MediaStream): Promise<void> {
    if (!this.sendTransport) {
      throw new Error("Send transport not created");
    }

    console.log("[MediaSoup] Starting media production");

    try {
      // Produce video track if available and not already producing
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && !this.producers.has("video")) {
        const videoProducer = await this.sendTransport.produce({
          track: videoTrack,
          encodings: [
            { maxBitrate: 100000 },
            { maxBitrate: 300000 },
            { maxBitrate: 900000 }
          ]
        });
        this.producers.set("video", videoProducer);
        console.log("[MediaSoup] Video producer created");
      } else if (videoTrack) {
        console.log("[MediaSoup] Video producer already exists");
      }

      // Produce audio track if available and not already producing
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack && !this.producers.has("audio")) {
        const audioProducer = await this.sendTransport.produce({
          track: audioTrack
        });
        this.producers.set("audio", audioProducer);
        console.log("[MediaSoup] Audio producer created");
      } else if (audioTrack) {
        console.log("[MediaSoup] Audio producer already exists");
      }

      console.log("[MediaSoup] Media production started successfully");
    } catch (error) {
      console.error("[MediaSoup] Failed to start producing media:", error);
      throw error;
    }
  }

  async startProducingVideo(stream: MediaStream): Promise<void> {
    if (!this.sendTransport) {
      throw new Error("Send transport not created");
    }

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      throw new Error("No video track available");
    }

    if (this.producers.has("video")) {
      console.log("[MediaSoup] Video producer already exists");
      return;
    }

    try {
      const videoProducer = await this.sendTransport.produce({
        track: videoTrack,
        encodings: [
          { maxBitrate: 100000 },
          { maxBitrate: 300000 },
          { maxBitrate: 900000 }
        ]
      });
      this.producers.set("video", videoProducer);
      console.log("[MediaSoup] Video producer created");
    } catch (error) {
      console.error("[MediaSoup] Failed to create video producer:", error);
      throw error;
    }
  }

  async startProducingAudio(stream: MediaStream): Promise<void> {
    if (!this.sendTransport) {
      throw new Error("Send transport not created");
    }

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) {
      throw new Error("No audio track available");
    }

    if (this.producers.has("audio")) {
      console.log("[MediaSoup] Audio producer already exists");
      return;
    }

    try {
      const audioProducer = await this.sendTransport.produce({
        track: audioTrack
      });
      this.producers.set("audio", audioProducer);
      console.log("[MediaSoup] Audio producer created");
    } catch (error) {
      console.error("[MediaSoup] Failed to create audio producer:", error);
      throw error;
    }
  }

  async consume(params: ConsumeParams): Promise<mediasoupClient.types.Consumer> {
    if (!this.receiveTransport) {
      throw new Error("Receive transport not created");
    }

    console.log("[MediaSoup] Creating consumer:", params);

    const consumer = await this.receiveTransport.consume({
      id: params.id,
      producerId: params.producerId,
      kind: params.kind,
      rtpParameters: params.rtpParameters
    });

    // CRITICAL: Store consumer but DON'T resume here
    // Resume will be handled by the Zustand store to avoid double resume
    this.consumers.set(params.producerId, consumer);
    
    console.log("[MediaSoup] Consumer created (paused), resume will be handled by store:", consumer.id);

    return consumer;
  }

  async closeProducer(kind: string): Promise<void> {
    const producer = this.producers.get(kind);
    if (producer && !producer.closed) {
      producer.close();
      this.producers.delete(kind);
      console.log(`[MediaSoup] ${kind} producer closed`);
    }
  }

  async startProducingScreenShare(stream: MediaStream): Promise<void> {
    if (!this.sendTransport) {
      throw new Error("Send transport not created");
    }

    console.log("[MediaSoup] Starting screen share production");

    try {
      // Produce video track for screen sharing
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const screenProducer = await this.sendTransport.produce({
          track: videoTrack,
          encodings: [
            { maxBitrate: 1000000 }, // Higher bitrate for screen sharing
            { maxBitrate: 2000000 },
            { maxBitrate: 3000000 }
          ],
          appData: { mediaSource: 'screen' } // Identify this as screen share
        });
        this.producers.set("screen", screenProducer);
        console.log("[MediaSoup] Screen share producer created");
      }

      // Optionally produce audio for screen sharing with audio
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const screenAudioProducer = await this.sendTransport.produce({
          track: audioTrack,
          appData: { mediaSource: 'screen-audio' }
        });
        this.producers.set("screen-audio", screenAudioProducer);
        console.log("[MediaSoup] Screen share audio producer created");
      }

      console.log("[MediaSoup] Screen share production started successfully");
    } catch (error) {
      console.error("[MediaSoup] Failed to start producing screen share:", error);
      throw error;
    }
  }

  async stopProducingScreenShare(): Promise<void> {
    console.log("[MediaSoup] Stopping screen share production");

    try {
      // Close screen video producer
      const screenProducer = this.producers.get("screen");
      if (screenProducer && !screenProducer.closed) {
        screenProducer.close();
        this.producers.delete("screen");
        console.log("[MediaSoup] Screen share video producer closed");
      }

      // Close screen audio producer
      const screenAudioProducer = this.producers.get("screen-audio");
      if (screenAudioProducer && !screenAudioProducer.closed) {
        screenAudioProducer.close();
        this.producers.delete("screen-audio");
        console.log("[MediaSoup] Screen share audio producer closed");
      }

      console.log("[MediaSoup] Screen share production stopped successfully");
    } catch (error) {
      console.error("[MediaSoup] Failed to stop screen share production:", error);
      throw error;
    }
  }

  cleanup(): void {
    console.log("[MediaSoup] Cleaning up");
    
    // Close all producers
    this.producers.forEach(producer => {
      if (!producer.closed) {
        producer.close();
      }
    });
    this.producers.clear();

    // Close all consumers
    this.consumers.forEach(consumer => {
      if (!consumer.closed) {
        consumer.close();
      }
    });
    this.consumers.clear();

    // Close transports
    if (this.sendTransport && !this.sendTransport.closed) {
      this.sendTransport.close();
    }
    if (this.receiveTransport && !this.receiveTransport.closed) {
      this.receiveTransport.close();
    }

    this.sendTransport = undefined;
    this.receiveTransport = undefined;
  }

  dispose(): void {
    this.cleanup();
    this.device = undefined;
    this.socket = undefined;
  }
}

const mediaSoupClientService = new MediaSoupClientService();
export default mediaSoupClientService;
