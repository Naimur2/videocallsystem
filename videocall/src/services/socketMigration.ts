/**
 * Socket.IO to WebSocket Migration Service
 * Provides a compatibility layer to easily migrate from Socket.IO to native WebSockets
 */

import type MediaSoupWebSocketClient from './websocketClient';
import { createWebSocketClient, getWebSocketClient } from './websocketClient';

class SocketIOCompatibilityLayer {
  private wsClient: MediaSoupWebSocketClient | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(private url: string) {
    this.initializeWebSocket();
  }

  private initializeWebSocket(): void {
    const wsUrl = this.url.replace(/^http/, 'ws') + '/ws';
    
    this.wsClient = createWebSocketClient({
      url: wsUrl,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 25000,
    });

    // Set up event forwarding
    this.wsClient.on('connected', () => {
      this.isConnected = true;
      console.log('✅ WebSocket connected (Socket.IO compatibility mode)');
    });

    this.wsClient.on('disconnected', () => {
      this.isConnected = false;
      console.log('🔌 WebSocket disconnected');
    });

    this.wsClient.on('error', (error: any) => {
      console.error('❌ WebSocket error:', error);
    });
  }

  /**
   * Connect to the server
   */
  public async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.wsClient!.connect();
    
    try {
      await this.connectionPromise;
      this.isConnected = true;
    } catch (error) {
      this.connectionPromise = null;
      throw error;
    }
  }

  /**
   * Disconnect from the server
   */
  public disconnect(): void {
    this.wsClient?.disconnect();
    this.isConnected = false;
    this.connectionPromise = null;
  }

  /**
   * Socket.IO-style emit (fire and forget)
   */
  public emit(event: string, data?: any): void {
    if (!this.wsClient) {
      console.error('❌ WebSocket client not initialized');
      return;
    }

    this.wsClient.send(this.mapEvent(event), data);
  }

  /**
   * Socket.IO-style emit with callback
   */
  public emitWithCallback(event: string, data: any, callback: (response: any) => void): void {
    if (!this.wsClient) {
      console.error('❌ WebSocket client not initialized');
      return;
    }

    this.wsClient.request(this.mapEvent(event), data)
      .then(callback)
      .catch((error) => {
        console.error(`❌ Request failed for ${event}:`, error);
        callback({ error: error.message });
      });
  }

  /**
   * Socket.IO-style on (event listener)
   */
  public on(event: string, callback: (...args: any[]) => void): void {
    if (!this.wsClient) {
      console.error('❌ WebSocket client not initialized');
      return;
    }

    this.wsClient.on(this.mapEvent(event), callback);
  }

  /**
   * Socket.IO-style off (remove event listener)
   */
  public off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.wsClient) {
      console.error('❌ WebSocket client not initialized');
      return;
    }

    this.wsClient.off(this.mapEvent(event), callback);
  }

  /**
   * Check if connected
   */
  public get connected(): boolean {
    return this.isConnected && this.wsClient?.connected === true;
  }

  /**
   * Map Socket.IO events to WebSocket message types
   */
  private mapEvent(event: string): string {
    // Map common Socket.IO events to WebSocket message types
    const eventMap: Record<string, string> = {
      'join-room': 'join-room',
      'leave-room': 'leave-room',
      'createWebRtcTransport': 'mediasoup-request',
      'connectWebRtcTransport': 'mediasoup-request',
      'produce': 'mediasoup-request',
      'consume': 'mediasoup-request',
      'getRouterRtpCapabilities': 'mediasoup-request',
      'createProducer': 'mediasoup-request',
      'createConsumer': 'mediasoup-request',
      'pauseProducer': 'mediasoup-request',
      'resumeProducer': 'mediasoup-request',
      'pauseConsumer': 'mediasoup-request',
      'resumeConsumer': 'mediasoup-request',
      'closeProducer': 'mediasoup-request',
      'closeConsumer': 'mediasoup-request',
      'getProducerStats': 'mediasoup-request',
      'getConsumerStats': 'mediasoup-request',
      'connect': 'connected',
      'disconnect': 'disconnected',
    };

    return eventMap[event] || event;
  }
}

// Global instance for easy migration
let socketInstance: SocketIOCompatibilityLayer | null = null;

/**
 * Create a Socket.IO-compatible WebSocket instance
 */
export function createSocket(url: string): SocketIOCompatibilityLayer {
  if (socketInstance) {
    socketInstance.disconnect();
  }
  
  socketInstance = new SocketIOCompatibilityLayer(url);
  return socketInstance;
}

/**
 * Get the current Socket.IO-compatible instance
 */
export function getSocket(): SocketIOCompatibilityLayer | null {
  return socketInstance;
}

/**
 * Migration helper functions
 */
export const SocketMigration = {
  /**
   * Replace Socket.IO import with this
   */
  io: (url: string) => createSocket(url),

  /**
   * Direct WebSocket client access for advanced use
   */
  getWebSocketClient: () => getWebSocketClient(),

  /**
   * Migration status check
   */
  isMigrated: () => socketInstance !== null,

  /**
   * Performance comparison helper
   */
  getPerformanceMetrics: () => {
    const wsClient = getWebSocketClient();
    return {
      connected: wsClient?.connected || false,
      readyState: wsClient?.readyState || WebSocket.CLOSED,
      protocol: 'WebSocket (migrated from Socket.IO)',
    };
  },
};

export default SocketIOCompatibilityLayer;