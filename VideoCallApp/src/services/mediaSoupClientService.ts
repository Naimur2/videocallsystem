import { Device } from 'mediasoup-client';
import { mediaDevices, MediaStream } from 'react-native-webrtc';
import { Socket } from 'socket.io-client';
import {
    ConsumerOptions,
    DtlsParameters,
    RtpCapabilities,
    TransportOptions,
} from '../types';

class MediaSoupClientService {
  private device: Device | null = null;
  private socket: Socket | null = null;
  private sendTransport: any = null;
  private recvTransport: any = null;
  private producers: Map<string, any> = new Map();
  private consumers: Map<string, any> = new Map();

  constructor() {
    console.log('[MediaSoupClientService] Initializing...');
  }

  setSocket(socket: Socket) {
    this.socket = socket;
    console.log('[MediaSoupClientService] Socket set');
  }

  async loadDevice(): Promise<void> {
    try {
      console.log('[MediaSoupClientService] Loading device...');

      if (!this.socket) {
        throw new Error('Socket not available');
      }

      // Get RTP capabilities from server
      const rtpCapabilities = await new Promise<RtpCapabilities>((resolve, reject) => {
        this.socket!.emit('getRouterRtpCapabilities', (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.rtpCapabilities);
          }
        });
      });

      console.log('[MediaSoupClientService] Got RTP capabilities:', rtpCapabilities);

      // Create MediaSoup device
      this.device = new Device();
      await this.device.load({routerRtpCapabilities: rtpCapabilities});

      console.log('[MediaSoupClientService] ✅ Device loaded successfully');
    } catch (error) {
      console.error('[MediaSoupClientService] ❌ Failed to load device:', error);
      throw error;
    }
  }

  async createTransports(): Promise<void> {
    try {
      if (!this.device || !this.socket) {
        throw new Error('Device or socket not available');
      }

      console.log('[MediaSoupClientService] Creating transports...');

      // Create send transport
      const sendTransportData = await new Promise<TransportOptions>((resolve, reject) => {
        this.socket!.emit('createWebRtcTransport', (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });

      this.sendTransport = this.device.createSendTransport(sendTransportData);

      // Create receive transport
      const recvTransportData = await new Promise<TransportOptions>((resolve, reject) => {
        this.socket!.emit('createWebRtcTransport', (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });

      this.recvTransport = this.device.createRecvTransport(recvTransportData);

      // Set up transport event handlers
      this.setupTransportEvents();

      console.log('[MediaSoupClientService] ✅ Transports created successfully');
    } catch (error) {
      console.error('[MediaSoupClientService] ❌ Failed to create transports:', error);
      throw error;
    }
  }

  private setupTransportEvents(): void {
    if (!this.socket) {return;}

    // Send transport events
    if (this.sendTransport) {
      this.sendTransport.on('connect', async ({dtlsParameters}: {dtlsParameters: DtlsParameters}, callback: Function, errback: Function) => {
        try {
          console.log('[MediaSoupClientService] Send transport connecting...');
          this.socket!.emit('connectTransport', {
            transportId: this.sendTransport.id,
            dtlsParameters,
          });
          callback();
        } catch (error) {
          console.error('[MediaSoupClientService] Send transport connect error:', error);
          errback(error);
        }
      });

      this.sendTransport.on('produce', async ({kind, rtpParameters}: any, callback: Function, errback: Function) => {
        try {
          console.log('[MediaSoupClientService] Producing:', kind);
          this.socket!.emit('produce', {
            transportId: this.sendTransport.id,
            kind,
            rtpParameters,
          }, (response: any) => {
            if (response.error) {
              errback(new Error(response.error));
            } else {
              callback({id: response.id});
            }
          });
        } catch (error) {
          console.error('[MediaSoupClientService] Produce error:', error);
          errback(error);
        }
      });
    }

    // Receive transport events
    if (this.recvTransport) {
      this.recvTransport.on('connect', async ({dtlsParameters}: {dtlsParameters: DtlsParameters}, callback: Function, errback: Function) => {
        try {
          console.log('[MediaSoupClientService] Receive transport connecting...');
          this.socket!.emit('connectTransport', {
            transportId: this.recvTransport.id,
            dtlsParameters,
          });
          callback();
        } catch (error) {
          console.error('[MediaSoupClientService] Receive transport connect error:', error);
          errback(error);
        }
      });
    }
  }

  async getUserMedia(constraints: any): Promise<MediaStream> {
    try {
      console.log('[MediaSoupClientService] Getting user media with constraints:', constraints);

      const stream = await mediaDevices.getUserMedia(constraints);

      console.log('[MediaSoupClientService] ✅ Got user media:', {
        id: stream.id,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
      });

      return stream;
    } catch (error) {
      console.error('[MediaSoupClientService] ❌ getUserMedia failed:', error);
      throw error;
    }
  }

  async enumerateDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await mediaDevices.enumerateDevices();
      console.log('[MediaSoupClientService] Available devices:', devices.length);
      return devices;
    } catch (error) {
      console.error('[MediaSoupClientService] ❌ enumerateDevices failed:', error);
      return [];
    }
  }

  async startProducing(stream: MediaStream): Promise<void> {
    try {
      if (!this.sendTransport) {
        throw new Error('Send transport not available');
      }

      console.log('[MediaSoupClientService] Starting to produce media...');

      // Produce video track
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const videoProducer = await this.sendTransport.produce({track: videoTrack});
        this.producers.set('video', videoProducer);
        console.log('[MediaSoupClientService] ✅ Video producer created:', videoProducer.id);
      }

      // Produce audio track
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const audioProducer = await this.sendTransport.produce({track: audioTrack});
        this.producers.set('audio', audioProducer);
        console.log('[MediaSoupClientService] ✅ Audio producer created:', audioProducer.id);
      }

      console.log('[MediaSoupClientService] ✅ Media production started');
    } catch (error) {
      console.error('[MediaSoupClientService] ❌ Failed to start producing:', error);
      throw error;
    }
  }

  async stopProducing(): Promise<void> {
    try {
      console.log('[MediaSoupClientService] Stopping media production...');

      for (const [kind, producer] of this.producers) {
        if (producer && !producer.closed) {
          producer.close();
          console.log(`[MediaSoupClientService] ${kind} producer closed`);
        }
      }

      this.producers.clear();
      console.log('[MediaSoupClientService] ✅ Media production stopped');
    } catch (error) {
      console.error('[MediaSoupClientService] ❌ Failed to stop producing:', error);
    }
  }

  async consumeMedia(producerId: string, participantId: string): Promise<MediaStream | null> {
    try {
      if (!this.recvTransport || !this.device || !this.socket) {
        throw new Error('Receive transport, device, or socket not available');
      }

      console.log(`[MediaSoupClientService] Consuming media from ${participantId}:${producerId}`);

      // Request to consume from server
      const consumerParams = await new Promise<ConsumerOptions>((resolve, reject) => {
        this.socket!.emit('consume', {
          producerId,
          rtpCapabilities: this.device!.rtpCapabilities,
        }, (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });

      // Create consumer
      const consumer = await this.recvTransport.consume(consumerParams);
      this.consumers.set(`${participantId}:${producerId}`, consumer);

      console.log('[MediaSoupClientService] Consumer created:', consumer.id);

      // Resume consumer
      this.socket.emit('resumeConsumer', {consumerId: consumer.id});

      // Create MediaStream from consumer track
      const stream = new MediaStream([consumer.track]);

      console.log('[MediaSoupClientService] ✅ MediaStream created for remote participant');

      return stream;
    } catch (error) {
      console.error(`[MediaSoupClientService] ❌ Failed to consume media from ${participantId}:`, error);
      return null;
    }
  }

  getRtpCapabilities(): RtpCapabilities | null {
    return this.device?.rtpCapabilities || null;
  }

  cleanup(): void {
    console.log('[MediaSoupClientService] Cleaning up...');

    // Close all producers
    for (const [kind, producer] of this.producers) {
      if (producer && !producer.closed) {
        producer.close();
      }
    }
    this.producers.clear();

    // Close all consumers
    for (const [key, consumer] of this.consumers) {
      if (consumer && !consumer.closed) {
        consumer.close();
      }
    }
    this.consumers.clear();

    // Close transports
    if (this.sendTransport && !this.sendTransport.closed) {
      this.sendTransport.close();
    }
    if (this.recvTransport && !this.recvTransport.closed) {
      this.recvTransport.close();
    }

    this.sendTransport = null;
    this.recvTransport = null;
    this.device = null;
    this.socket = null;

    console.log('[MediaSoupClientService] ✅ Cleanup completed');
  }
}

export const mediaSoupClientService = new MediaSoupClientService();
