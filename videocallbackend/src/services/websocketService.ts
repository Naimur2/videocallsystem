/**
 * Native WebSocket Server for MediaSoup
 * Replaces Socket.IO with optimized WebSocket implementation
 * Designed specifically for MediaSoup signaling performance
 */

import { IncomingMessage } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { WebSocket, WebSocketServer } from 'ws';

export interface WebSocketClient {
  id: string;
  ws: WebSocket;
  roomId?: string;
  userId?: string;
  isAlive: boolean;
  lastPing: number;
}

export interface WebSocketMessage {
  type: string;
  data?: any;
  requestId?: string;
  error?: string;
}

class MediaSoupWebSocketServer {
  private wss: WebSocketServer;
  private clients = new Map<string, WebSocketClient>();
  private rooms = new Map<string, Set<string>>();
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(port: number = 3001) {
    // Create WebSocket server
    this.wss = new WebSocketServer({
      port,
      path: '/ws',
      perMessageDeflate: {
        deflate: {
          concurrencyLimit: 10,
          threshold: 1024,
        },
        inflate: {
          threshold: 1024,
        },
      },
    });

    this.setupEventHandlers();
    this.startHeartbeat();

    console.log(`🚀 WebSocket server running on port ${port}`);
  }

  private setupEventHandlers(): void {
    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      const clientId = uuidv4();
      const client: WebSocketClient = {
        id: clientId,
        ws,
        isAlive: true,
        lastPing: Date.now(),
      };

      this.clients.set(clientId, client);
      console.log(`✅ Client connected: ${clientId}`);

      // Handle client messages
      ws.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error('❌ Invalid message format:', error);
          this.sendError(clientId, 'Invalid message format');
        }
      });

      // Handle client disconnect
      ws.on('close', (code: number, reason: Buffer) => {
        console.log(`🔌 Client disconnected: ${clientId}, code: ${code}`);
        this.handleDisconnect(clientId);
      });

      // Handle errors
      ws.on('error', (error: Error) => {
        console.error(`❌ WebSocket error for ${clientId}:`, error);
        this.handleDisconnect(clientId);
      });

      // Handle ping/pong for connection health
      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.isAlive = true;
          client.lastPing = Date.now();
        }
      });

      // Send welcome message
      this.send(clientId, {
        type: 'connected',
        data: { clientId, serverTime: Date.now() },
      });
    });
  }

  private handleMessage(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`📨 Message from ${clientId}:`, message.type);

    switch (message.type) {
      case 'join-room':
        this.handleJoinRoom(clientId, message);
        break;
      case 'leave-room':
        this.handleLeaveRoom(clientId, message);
        break;
      case 'mediasoup-request':
        this.handleMediaSoupRequest(clientId, message);
        break;
      case 'ping':
        this.handlePing(clientId, message);
        break;
      default:
        console.warn(`⚠️ Unknown message type: ${message.type}`);
        this.sendError(clientId, `Unknown message type: ${message.type}`);
    }
  }

  private handleJoinRoom(clientId: string, message: WebSocketMessage): void {
    const { roomId, userId } = message.data || {};
    
    if (!roomId) {
      this.sendError(clientId, 'Room ID is required');
      return;
    }

    const client = this.clients.get(clientId);
    if (!client) return;

    // Leave previous room if any
    if (client.roomId) {
      this.leaveRoom(clientId, client.roomId);
    }

    // Join new room
    client.roomId = roomId;
    client.userId = userId;

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(clientId);

    console.log(`🏠 Client ${clientId} joined room ${roomId}`);

    // Notify client of successful join
    this.send(clientId, {
      type: 'room-joined',
      data: { 
        roomId, 
        userId,
        participants: this.getRoomParticipants(roomId)
      },
      requestId: message.requestId,
    });

    // Notify other participants
    this.broadcastToRoom(roomId, {
      type: 'participant-joined',
      data: { userId, clientId },
    }, clientId);
  }

  private handleLeaveRoom(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || !client.roomId) return;

    this.leaveRoom(clientId, client.roomId);

    this.send(clientId, {
      type: 'room-left',
      data: { roomId: client.roomId },
      requestId: message.requestId,
    });
  }

  private handleMediaSoupRequest(clientId: string, message: WebSocketMessage): void {
    // Forward MediaSoup-specific requests to the appropriate handler
    // This integrates with your existing MediaSoup service
    console.log(`🎥 MediaSoup request: ${message.data?.method}`);
    
    // Import and use your existing MediaSoup service
    this.forwardToMediaSoupService(clientId, message);
  }

  private handlePing(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.isAlive = true;
      client.lastPing = Date.now();
    }

    this.send(clientId, {
      type: 'pong',
      data: { serverTime: Date.now() },
      requestId: message.requestId,
    });
  }

  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Leave room if in one
    if (client.roomId) {
      this.leaveRoom(clientId, client.roomId);
    }

    // Remove client
    this.clients.delete(clientId);
    console.log(`🗑️ Client ${clientId} removed`);
  }

  private leaveRoom(clientId: string, roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(clientId);
      
      // Clean up empty rooms
      if (room.size === 0) {
        this.rooms.delete(roomId);
        console.log(`🧹 Empty room ${roomId} cleaned up`);
      } else {
        // Notify remaining participants
        const client = this.clients.get(clientId);
        this.broadcastToRoom(roomId, {
          type: 'participant-left',
          data: { 
            userId: client?.userId, 
            clientId 
          },
        });
      }
    }

    // Clear room from client
    const client = this.clients.get(clientId);
    if (client) {
      client.roomId = undefined;
    }

    console.log(`🚪 Client ${clientId} left room ${roomId}`);
  }

  private getRoomParticipants(roomId: string): any[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room).map(clientId => {
      const client = this.clients.get(clientId);
      return {
        clientId,
        userId: client?.userId,
      };
    });
  }

  private send(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      console.warn(`⚠️ Cannot send to disconnected client: ${clientId}`);
      return;
    }

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`❌ Failed to send message to ${clientId}:`, error);
      this.handleDisconnect(clientId);
    }
  }

  private sendError(clientId: string, error: string, requestId?: string): void {
    this.send(clientId, {
      type: 'error',
      error,
      requestId,
    });
  }

  private broadcastToRoom(roomId: string, message: WebSocketMessage, excludeClientId?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    for (const clientId of room) {
      if (clientId !== excludeClientId) {
        this.send(clientId, message);
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.isAlive) {
          console.log(`💀 Terminating dead connection: ${clientId}`);
          client.ws.terminate();
          this.handleDisconnect(clientId);
          return;
        }

        // Check for stale connections (no pong in last 30 seconds)
        if (Date.now() - client.lastPing > 30000) {
          console.log(`⏰ Connection stale: ${clientId}`);
          client.isAlive = false;
          client.ws.ping();
        }
      });
    }, 10000); // Check every 10 seconds
  }

  private async forwardToMediaSoupService(clientId: string, message: WebSocketMessage): Promise<void> {
    // This method integrates with your existing MediaSoup service
    // You'll need to import and adapt your current MediaSoup logic here
    
    try {
      // Example integration point - replace with your actual MediaSoup service
      // const result = await mediasoupService.handleRequest(clientId, message.data);
      
      this.send(clientId, {
        type: 'mediasoup-response',
        data: { success: true }, // Replace with actual result
        requestId: message.requestId,
      });
    } catch (error) {
      console.error(`❌ MediaSoup request failed:`, error);
      this.sendError(clientId, `MediaSoup error: ${error instanceof Error ? error.message : 'Unknown error'}`, message.requestId);
    }
  }

  public getStats(): any {
    return {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      roomDetails: Array.from(this.rooms.entries()).map(([roomId, clients]) => ({
        roomId,
        participantCount: clients.size,
      })),
    };
  }

  public close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss.close(() => {
      console.log('🔌 WebSocket server closed');
    });
  }
}

export default MediaSoupWebSocketServer;