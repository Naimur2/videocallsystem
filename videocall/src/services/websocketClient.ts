/**
 * Native WebSocket Client for MediaSoup
 * Replaces Socket.IO client with optimized WebSocket implementation
 * Designed for better performance and reliability
 */

export interface WebSocketMessage {
  type: string;
  data?: any;
  requestId?: string;
  error?: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

class MediaSoupWebSocketClient {
  private ws?: WebSocket;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private isConnecting = false;
  private isConnected = false;
  private messageQueue: WebSocketMessage[] = [];
  private eventListeners = new Map<string, Array<(...args: any[]) => void>>();
  private pendingRequests = new Map<string, { 
    resolve: (value: any) => void; 
    reject: (reason: any) => void; 
    timeout: NodeJS.Timeout 
  }>();

  constructor(config: WebSocketConfig) {
    this.config = {
      url: config.url,
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
    };
  }

  /**
   * Connect to WebSocket server
   */
  public async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      console.warn('⚠️ WebSocket already connecting or connected');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true;
        console.log('🔌 Connecting to WebSocket:', this.config.url);

        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnecting = false;
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          this.startHeartbeat();
          this.flushMessageQueue();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log(`🔌 WebSocket closed: ${event.code} - ${event.reason}`);
          this.handleDisconnect();
          
          if (event.code !== 1000) { // Not a normal closure
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          this.handleDisconnect();
          reject(error);
        };

        // Connection timeout
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            this.ws?.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    console.log('🔌 Disconnecting WebSocket');
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = undefined;
    }

    this.isConnected = false;
    this.isConnecting = false;
  }

  /**
   * Send message to server
   */
  public send(type: string, data?: any): void {
    const message: WebSocketMessage = { type, data };
    
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        console.log(`📤 Sent: ${type}`);
      } catch (error) {
        console.error('❌ Failed to send message:', error);
        this.messageQueue.push(message);
      }
    } else {
      console.log(`📦 Queued: ${type}`);
      this.messageQueue.push(message);
    }
  }

  /**
   * Send request and wait for response
   */
  public async request<T = any>(type: string, data?: any, timeout = 10000): Promise<T> {
    const requestId = this.generateId();
    const message: WebSocketMessage = { type, data, requestId };

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout: ${type}`));
      }, timeout);

      // Store request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout: timeoutHandle,
      });

      // Send message
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify(message));
          console.log(`📤 Request: ${type}`);
        } catch (error) {
          this.pendingRequests.delete(requestId);
          clearTimeout(timeoutHandle);
          reject(error);
        }
      } else {
        this.pendingRequests.delete(requestId);
        clearTimeout(timeoutHandle);
        reject(new Error('WebSocket not connected'));
      }
    });
  }

  /**
   * Add event listener
   */
  public on(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public off(event: string, callback?: (...args: any[]) => void): void {
    if (!callback) {
      this.eventListeners.delete(event);
      return;
    }

    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Get connection status
   */
  public get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get ready state
   */
  public get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  private handleMessage(message: WebSocketMessage): void {
    console.log(`📥 Received: ${message.type}`);

    // Handle request responses
    if (message.requestId) {
      const pending = this.pendingRequests.get(message.requestId);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.requestId);

        if (message.error) {
          pending.reject(new Error(message.error));
        } else {
          pending.resolve(message.data);
        }
        return;
      }
    }

    // Handle special message types
    switch (message.type) {
      case 'connected':
        this.emit('connected', message.data);
        break;
      case 'error':
        console.error('🚨 Server error:', message.error);
        this.emit('error', message.error);
        break;
      case 'pong':
        // Heartbeat response
        break;
      default:
        this.emit(message.type, message.data);
        break;
    }
  }

  private handleDisconnect(): void {
    this.isConnected = false;
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }

    // Reject all pending requests
    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('WebSocket disconnected'));
    });
    this.pendingRequests.clear();

    this.emit('disconnected');
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.emit('reconnectFailed');
      return;
    }

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      30000
    );

    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(() => {
        // Connection failed, will try again
      });
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send('ping');
      }
    }, this.config.heartbeatInterval);
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift()!;
      try {
        this.ws!.send(JSON.stringify(message));
        console.log(`📤 Flushed: ${message.type}`);
      } catch (error) {
        console.error('❌ Failed to flush message:', error);
        this.messageQueue.unshift(message);
        break;
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Event listener error for ${event}:`, error);
        }
      });
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

// Export singleton instance
let wsClient: MediaSoupWebSocketClient | null = null;

export function createWebSocketClient(config: WebSocketConfig): MediaSoupWebSocketClient {
  if (wsClient) {
    wsClient.disconnect();
  }
  
  wsClient = new MediaSoupWebSocketClient(config);
  return wsClient;
}

export function getWebSocketClient(): MediaSoupWebSocketClient | null {
  return wsClient;
}

export default MediaSoupWebSocketClient;