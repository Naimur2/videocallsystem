/**
 * Complete Socket Service - Professional MediaSoup Backend Implementation
 * Following official MediaSoup demo patterns with protoo-style signaling
 */

import * as mediasoup from "mediasoup";
import { Server, Socket } from "socket.io";
import { ClientToServerEvents, Participant, ServerToClientEvents } from "../types";
import { consumerManager } from "./consumerManager";
import mediasoupServiceInstance from "./mediasoupService";

export interface RoomParticipant extends Participant {
  socketId: string;
  transports: Map<string, mediasoup.types.WebRtcTransport>;
  producers: Map<string, mediasoup.types.Producer>;
  consumers: Map<string, mediasoup.types.Consumer>;
}

export interface Room {
  id: string;
  participants: Map<string, RoomParticipant>;
  router?: mediasoup.types.Router;
  createdAt: Date;
}

class SocketService {
  private io?: Server<ClientToServerEvents, ServerToClientEvents>;
  private rooms = new Map<string, Room>();
  
  // Track socket connections per user to prevent duplicates
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId
  
  // Socket.IO v4+ Performance Optimizations
  private readonly ACK_TIMEOUT = {
    transport: 10000, // 10s for transport operations
    producer: 5000,   // 5s for producer operations
    consumer: 5000,   // 5s for consumer operations
    general: 3000     // 3s for general operations
  };
  
  // Event batching for performance
  private participantUpdateBatches = new Map<string, NodeJS.Timeout>(); // roomId -> timeout
  private readonly BATCH_DELAY = 100; // 100ms batching delay
  
  /**
   * Initialize Socket.IO server with MediaSoup integration
   */
  initialize(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
    console.log("[SocketService] 🚀 Initializing Socket service...");
    
    this.io = io;
    
    this.io.on("connection", (socket) => {
      console.log("[SocketService] 🔌 Client connected:", socket.id);
      
      // Set up all event handlers
      this._setupEventHandlers(socket);
      
      // DEBUG: Log all incoming socket events for aggressive troubleshooting
      socket.onAny((eventName, ...args) => {
        try {
          console.log("[SocketService] 🔎 onAny event:", eventName, args?.length ? args : undefined);
        } catch (err) {
          console.log("[SocketService] 🔎 onAny event (failed to stringify args)");
        }
      });
      
      // Handle disconnection
      socket.on("disconnect", () => {
        console.log("[SocketService] 🔌 Client disconnected:", socket.id);
        this._handleDisconnection(socket.id);
      });
    });
    
    console.log("[SocketService] ✅ Socket service initialized");
  }

  /**
   * Set up all event handlers for a socket connection
   */
  private _setupEventHandlers(socket: Socket<ClientToServerEvents, ServerToClientEvents>): void {
    // Router capabilities
    socket.on("getRouterRtpCapabilities", (callback) => {
      this._handleGetRouterRtpCapabilities(socket, callback);
    });

    // Compatibility alias: some clients emit 'getRtpCapabilities'
    socket.on("getRtpCapabilities", (callback) => {
      console.log("[SocketService] 🔁 Received alias getRtpCapabilities -> delegating to getRouterRtpCapabilities");
      this._handleGetRouterRtpCapabilities(socket, callback);
    });
    
    // Room management
    socket.on("joinRoom", (data, callback) => {
      this._handleJoinRoom(socket, data, callback);
    });
    
    socket.on("leaveRoom", (callback) => {
      this._handleLeaveRoom(socket, callback);
    });
    
    // Transport management
    socket.on("createWebRtcTransport", (data, callback) => {
      this._handleCreateWebRtcTransport(socket, data, callback);
    });

    // Allow clients to request existing producers (for late joiners)
    socket.on("getProducers", async (callback: (response?: any) => void) => {
      try {
        await this._handleGetProducers(socket, callback);
      } catch (err) {
        console.error("[SocketService] ❌ getProducers handler error:", err);
        if (callback) callback({ error: err instanceof Error ? err.message : String(err) });
      }
    });
    
    socket.on("connectTransport", (data, callback) => {
      this._handleConnectTransport(socket, data, callback);
    });
    
    socket.on("connectWebRtcTransport", (data, callback) => {
      this._handleConnectTransport(socket, data, callback);
    });
    
    // Producer management
    socket.on("produce", (data, callback) => {
      this._handleProduce(socket, data, callback);
    });
    
    // Consumer management
    socket.on("consume", (data, callback) => {
      this._handleConsume(socket, data, callback);
    });
    
    socket.on("resumeConsumer", (data, callback) => {
      this._handleResumeConsumer(socket, data, callback);
    });
    
    // Chat events
    socket.on("sendMessage", (data, callback) => {
      this._handleSendMessage(socket, data, callback);
    });
    
    // Test event for debugging Socket.IO connectivity
    socket.on("test-echo", (data, callback) => {
      console.log("[SocketService] 🧪 Test echo received:", data);
      if (callback) {
        callback({ 
          success: true, 
          message: "Echo test successful", 
          socketId: socket.id,
          receivedAt: Date.now(),
          original: data
        });
      }
    });
  }

  /**
   * Handle getting router RTP capabilities
   */
  private async _handleGetRouterRtpCapabilities(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    callback: (response?: any) => void
  ): Promise<void> {
    console.log("[SocketService] 📋 Getting router RTP capabilities...");
    
    try {
      // Get or create a router for capability sharing
      const router = await mediasoupServiceInstance.getOrCreateRouter();
      
      const rtpCapabilities = router.rtpCapabilities;
      
      console.log("[SocketService] ✅ Router RTP capabilities sent:", {
        codecsCount: rtpCapabilities.codecs?.length || 0,
        headerExtensionsCount: rtpCapabilities.headerExtensions?.length || 0
      });
      
      callback(rtpCapabilities);
      
    } catch (error) {
      console.error("[SocketService] ❌ Failed to get router RTP capabilities:", error);
      callback({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  /**
   * Handle joining a room
   */
  private async _handleJoinRoom(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    data: { roomId: string; participantName: string; userEmail?: string },
    callback: (response?: any) => void
  ): Promise<void> {
    console.log("[SocketService] 🚪 Handling join room:", {
      socketId: socket.id,
      roomId: data.roomId,
      participantName: data.participantName || 'Unknown'
    });
    
    try {
      // Validate participant data
      if (!data.participantName) {
        console.error("[SocketService] ❌ Invalid participant data:", data);
        callback?.({ 
          success: false, 
          error: "Invalid participant data - participantName is required" 
        });
        return;
      }
      
      // Get or create room
      let room = this.rooms.get(data.roomId);
      
      if (!room) {
        // Create new room
        const router = await mediasoupServiceInstance.createRouter(data.roomId);
        
        room = {
          id: data.roomId,
          participants: new Map(),
          router,
          createdAt: new Date()
        };
        
        this.rooms.set(data.roomId, room);
        console.log("[SocketService] 🏠 Created new room:", data.roomId);
      }
      
      // Create participant
      const participant: RoomParticipant = {
        id: socket.id,
        name: data.participantName,
        socketId: socket.id,
        joinedAt: new Date(),
        isAudioEnabled: true,
        isVideoEnabled: true,
        isScreenSharing: false,
        isModerator: false,
        status: "active" as const,
        transports: new Map(),
        producers: new Map(),
        consumers: new Map()
      };
      
      // CRITICAL: Socket deduplication - ensure only one socket per user per room
      const userId = data.participantName; // Use participant name as unique user identifier
      console.log(`[SocketService] 🔍 Checking for duplicate sockets for user: ${userId}`);
      
      // Check if user already has sockets in this room
      const existingParticipant = Array.from(room.participants.values())
        .find(p => p.name === userId);
      
      if (existingParticipant && existingParticipant.socketId !== socket.id) {
        console.log(`[SocketService] 🚫 Found duplicate socket for user ${userId}: ${existingParticipant.socketId}`);
        console.log(`[SocketService] 🔄 Replacing old socket ${existingParticipant.socketId} with new socket ${socket.id}`);
        
        // Remove old participant
        room.participants.delete(existingParticipant.socketId);
        
        // Disconnect old socket if still connected
        const oldSocket = this.io?.sockets.sockets.get(existingParticipant.socketId);
        if (oldSocket) {
          console.log(`[SocketService] 🚪 Disconnecting old socket: ${existingParticipant.socketId}`);
          oldSocket.disconnect(true);
        }
      }
      
      // Track socket-user mapping
      this.socketUsers.set(socket.id, userId);
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);
      
      // Add participant to room
      room.participants.set(socket.id, participant);
      
      // Join socket to room
      socket.join(data.roomId);
      console.log(`[SocketService] 🏠 Socket ${socket.id} joined room ${data.roomId}`);
      console.log(`[SocketService] 🏠 Room ${data.roomId} now has ${room.participants.size} participants`);
      
      // CRITICAL: Verify socket is actually in the room
      const socketRooms = Array.from(socket.rooms);
      console.log(`[SocketService] 🔍 Socket ${socket.id} is in rooms:`, socketRooms);
      const isInRoom = socket.rooms.has(data.roomId);
      console.log(`[SocketService] ✅ Socket ${socket.id} is in room ${data.roomId}:`, isInRoom);
      
      // Get total sockets in this room
      const roomSockets = await socket.in(data.roomId).allSockets();
      console.log(`[SocketService] 🏠 Total sockets in room ${data.roomId}:`, roomSockets.size);
      
      // Notify existing participants about new participant
      console.log(`[SocketService] 📢 Broadcasting participantJoined to room ${data.roomId} for participant ${participant.name}`);
      const broadcastResult = socket.to(data.roomId).emit("participantJoined", {
        participant
      });
      console.log(`[SocketService] 📡 Broadcast participantJoined result:`, broadcastResult);
      
      // Send existing participants to new participant
      const existingParticipants: Array<{ participantId: string; participant: Participant }> = [];
      for (const [participantId, participantData] of room.participants) {
        if (participantId !== socket.id) {
          existingParticipants.push({
            participantId,
            participant: {
              id: participantData.id,
              name: participantData.name,
              socketId: participantData.socketId,
              joinedAt: participantData.joinedAt,
              isAudioEnabled: participantData.isAudioEnabled,
              isVideoEnabled: participantData.isVideoEnabled,
              isScreenSharing: participantData.isScreenSharing,
              isModerator: participantData.isModerator,
              status: participantData.status,
              transports: participantData.transports,
              producers: participantData.producers,
              consumers: participantData.consumers
            }
          });
        }
      }
      
      console.log("[SocketService] ✅ Participant joined room:", {
        roomId: data.roomId,
        participantId: socket.id,
        totalParticipants: room.participants.size,
        existingParticipants: existingParticipants.length
      });

      // Emit roomJoined event to the joining participant
      socket.emit("roomJoined", {
        room: {
          id: room.id,
          name: `Room ${room.id}`,
          participants: Array.from(room.participants.values()).map(p => ({
            id: p.id,
            name: p.name,
            socketId: p.socketId,
            joinedAt: p.joinedAt,
            isAudioEnabled: p.isAudioEnabled,
            isVideoEnabled: p.isVideoEnabled,
            isScreenSharing: p.isScreenSharing,
            isModerator: p.isModerator,
            status: p.status,
            transports: p.transports,
            producers: p.producers,
            consumers: p.consumers
          })),
          createdAt: room.createdAt,
          isActive: true,
          maxParticipants: 16,
          isRecording: false,
          settings: {
            allowScreenShare: true,
            allowChat: true,
            allowRecording: false,
            muteOnJoin: false,
            requirePermissionToJoin: false,
            maxParticipants: 16,
            allowFileSharing: true,
            chatRetentionDays: 7
          },
          chatMessages: [],
          currentScreenSharer: undefined
        },
        participant: participant
      });
      
      callback?.({
        success: true,
        participantId: socket.id,
        existingParticipants
      });

      // CRITICAL: MediaSoup demo pattern - Auto-create consumers for existing producers  
      // This happens AFTER successful join to ensure all transports are ready
      console.log(`[SocketService] 🔄 Auto-creating consumers for existing producers (MediaSoup demo pattern)...`);
      
      // Create consumers for all existing producers in the room
      try {
        const roomSockets = Array.from(this.io?.sockets.sockets.values() || [])
          .filter(s => s.rooms.has(room.id));
        
        const socketMap = new Map(roomSockets.map(s => [s.id, s]));
        await consumerManager.createConsumersForNewPeer(socket, socketMap, room.router!);
      } catch (consumerError) {
        console.error("[SocketService] ❌ Failed to create consumers for new peer:", consumerError);
      }
      
      // Notify the new participant about existing producers (so they can consume them)
      for (const [otherParticipantId, otherParticipant] of room.participants) {
        if (otherParticipantId !== socket.id) {
          // Send newProducer events for all existing producers to the new participant
          for (const [producerId, producer] of otherParticipant.producers) {
            console.log(`[SocketService] 📢 Notifying new participant ${socket.id} about existing producer ${producerId} from ${otherParticipantId}`);
            
            socket.emit("newProducer", {
              producerId: producer.id,
              participantId: otherParticipantId,
              kind: producer.kind,
              isScreenShare: Boolean((producer.appData as any)?.share) || false
            });
          }
        }
      }
      
    } catch (error) {
      console.error("[SocketService] ❌ Failed to join room:", error);
      callback?.({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  /**
   * Handle leaving a room
   */
  private async _handleLeaveRoom(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    callback?: (response?: any) => void
  ): Promise<void> {
    console.log("[SocketService] 🚪 Handling leave room:", socket.id);
    
    try {
      // Find room containing this participant
      let targetRoom: Room | undefined;
      let targetParticipant: RoomParticipant | undefined;
      
      for (const [roomId, room] of this.rooms) {
        const participant = room.participants.get(socket.id);
        if (participant) {
          targetRoom = room;
          targetParticipant = participant;
          break;
        }
      }
      
      if (!targetRoom || !targetParticipant) {
        callback?.({ success: true }); // Already left
        return;
      }
      
      await this._cleanupParticipant(targetRoom, socket.id, targetParticipant);
      
      callback?.({ success: true });
      
    } catch (error) {
      console.error("[SocketService] ❌ Failed to leave room:", error);
      callback?.({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  /**
   * Handle creating WebRTC transport
   */
  private async _handleCreateWebRtcTransport(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    data: { producing?: boolean; consuming?: boolean },
    callback: (response?: any) => void
  ): Promise<void> {
    // Default values: if producing is specified, use it; otherwise default to false
    // If consuming is not specified, default to opposite of producing
    const producing = data.producing ?? false;
    const consuming = data.consuming ?? !producing;
    
    console.log("[SocketService] 🚛 Creating WebRTC transport:", {
      socketId: socket.id,
      producing,
      consuming,
      originalData: data
    });
    
    try {
      // Enhanced debugging before participant lookup
      console.log("[SocketService] 🔍 DEBUG: About to lookup participant", {
        socketId: socket.id,
        totalRoomsAvailable: this.rooms.size,
        socketRooms: Array.from(socket.rooms)
      });
      
      const { room, participant } = await this._getParticipantAndRoom(socket.id);
      
      if (!room?.router) {
        throw new Error("Room router not available");
      }
      
      // Create transport following MediaSoup demo pattern
      const webRtcTransportOptions = {
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        iceConsentTimeout: 20,
        enableSctp: Boolean(data.sctpCapabilities),
        numSctpStreams: data.sctpCapabilities?.numStreams,
        appData: { producing, consuming }
      };
      
      // Use WebRTC server if available (MediaSoup demo pattern)
      const worker = this.routerToWorker?.get(room.router!);
      const webRtcServer = worker ? this.webRtcServers?.get(worker) : null;
      
      if (webRtcServer) {
        webRtcTransportOptions.webRtcServer = webRtcServer;
        console.log(`[SocketService] 🔗 Using WebRTC server for transport`);
      } else {
        // Fallback to individual transport configuration
        webRtcTransportOptions.listenInfos = [
          {
            protocol: "udp",
            ip: "0.0.0.0",
            announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP || "call.naimur-rahaman.com",
            portRange: {
              min: parseInt(process.env.RTC_MIN_PORT || "40000"),
              max: parseInt(process.env.RTC_MAX_PORT || "49999")
            }
          },
          {
            protocol: "tcp", 
            ip: "0.0.0.0",
            announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP || "call.naimur-rahaman.com",
            portRange: {
              min: parseInt(process.env.RTC_MIN_PORT || "40000"),
              max: parseInt(process.env.RTC_MAX_PORT || "49999")
            }
          }
        ];
        console.log(`[SocketService] 🔗 Using individual transport configuration`);
      }
      
      // Create transport using proper configuration
      let transport;
      
      if (webRtcServer) {
        // Use WebRTC server
        transport = await room.router!.createWebRtcTransport({
          ...webRtcTransportOptions,
          webRtcServer
        });
        console.log(`[SocketService] ✅ Transport created with WebRTC server`);
      } else {
        // Use individual transport configuration
        transport = await room.router!.createWebRtcTransport({
          ...webRtcTransportOptions,
          listenInfos: [
            {
              protocol: "udp",
              ip: "0.0.0.0",
              announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP || "meeting.naimur-rahaman.com",
              portRange: {
                min: parseInt(process.env.RTC_MIN_PORT || "40000"),
                max: parseInt(process.env.RTC_MAX_PORT || "49999")
              }
            },
            {
              protocol: "tcp", 
              ip: "0.0.0.0",
              announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP || "meeting.naimur-rahaman.com",
              portRange: {
                min: parseInt(process.env.RTC_MIN_PORT || "40000"),
                max: parseInt(process.env.RTC_MAX_PORT || "49999")
              }
            }
          ]
        });
        console.log(`[SocketService] ✅ Transport created with individual configuration`);
      }
      
      // Store transport
      participant.transports.set(transport.id, transport);
      
      // Set up transport event handlers
      this._setupTransportEvents(transport, socket.id);
      
      const transportInfo = {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
        sctpParameters: transport.sctpParameters,
        // CRITICAL: Add ICE servers for STUN/TURN functionality
        iceServers: [
          // Local CoTURN server (self-hosted)
          {
            urls: `stun:${process.env.MEDIASOUP_ANNOUNCED_IP || "meeting.naimur-rahaman.com"}:3478`,
          },
          {
            urls: `turn:${process.env.MEDIASOUP_ANNOUNCED_IP || "meeting.naimur-rahaman.com"}:3478`,
            username: process.env.TURN_USERNAME || "mediasoup",
            credential: process.env.TURN_CREDENTIAL || "mediasoupTurn2024!"
          },
          {
            urls: `turns:${process.env.MEDIASOUP_ANNOUNCED_IP || "meeting.naimur-rahaman.com"}:5349`,
            username: process.env.TURN_USERNAME || "mediasoup", 
            credential: process.env.TURN_CREDENTIAL || "mediasoupTurn2024!"
          },
          // Google STUN fallback
          {
            urls: "stun:stun.l.google.com:19302",
          }
        ],
      };
      
      console.log("[SocketService] ✅ WebRTC transport created:", {
        transportId: transport.id,
        producingConsumer: `${data.producing}/${data.consuming}`
      });
      
      if (callback && typeof callback === 'function') {
        callback(transportInfo);
      }
      
    } catch (error) {
      console.error("[SocketService] ❌ Failed to create WebRTC transport:", error);
      if (callback && typeof callback === 'function') {
        callback({ error: error instanceof Error ? error.message : "Unknown error" });
      }
    }
  }

  /**
   * Handle connecting transport
   */
  private async _handleConnectTransport(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    data: { transportId: string; dtlsParameters: mediasoup.types.DtlsParameters },
    callback: (response?: any) => void
  ): Promise<void> {
    console.log("[SocketService] 🔗 Connecting transport:", {
      socketId: socket.id,
      transportId: data.transportId
    });
    
    try {
      const { participant } = await this._getParticipantAndRoom(socket.id);
      
      const transport = participant.transports.get(data.transportId);
      if (!transport) {
        throw new Error(`Transport not found: ${data.transportId}`);
      }
      
      await transport.connect({ dtlsParameters: data.dtlsParameters });
      
      console.log("[SocketService] ✅ Transport connected:", data.transportId);
      callback({ success: true });
      
    } catch (error) {
      console.error("[SocketService] ❌ Failed to connect transport:", error);
      callback({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  /**
   * Handle creating producer
   */
  private async _handleProduce(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    data: { 
      transportId: string;
      kind: "audio" | "video";
      rtpParameters: mediasoup.types.RtpParameters;
      appData?: any;
    },
    callback: (response?: any) => void
  ): Promise<void> {
    console.log("[SocketService] 📤 Creating producer:", {
      socketId: socket.id,
      transportId: data.transportId,
      kind: data.kind
    });
    
    try {
      const { room, participant } = await this._getParticipantAndRoom(socket.id);
      
      const transport = participant.transports.get(data.transportId);
      if (!transport) {
        throw new Error(`Transport not found: ${data.transportId}`);
      }
      
      // Create producer
      const producer = await transport.produce({
        kind: data.kind,
        rtpParameters: data.rtpParameters,
        appData: data.appData
      });
      
      // Store producer
      participant.producers.set(producer.id, producer);
      
      // Set up producer event handlers
      this._setupProducerEvents(producer, socket.id, room.id);
      
      console.log("[SocketService] ✅ Producer created:", {
        producerId: producer.id,
        kind: producer.kind,
        participantId: socket.id
      });
      
      // CRITICAL: Create consumers for all other participants (MediaSoup demo pattern)
      try {
        const roomSockets = Array.from(this.io?.sockets.sockets.values() || [])
          .filter(s => s.rooms.has(room.id) && s.id !== socket.id);
        
        console.log(`[SocketService] 🔄 Creating consumers for ${roomSockets.length} peers in room ${room.id}`);
        
        const socketMap = new Map(roomSockets.map(s => [s.id, s]));
        await consumerManager.createConsumersForNewProducer(socket, producer, socketMap, room.router!);
      } catch (consumerError) {
        console.error("[SocketService] ❌ Failed to create consumers for new producer:", consumerError);
      }
      
      // Notify other participants about new producer
      console.log(`[SocketService] 📢 Broadcasting newProducer to room ${room.id} for producer ${producer.id} (${producer.kind}) from ${socket.id}`);
      
      // CRITICAL: Verify room membership before broadcast
      const roomSockets = await socket.in(room.id).allSockets();
      console.log(`[SocketService] 🏠 Broadcasting to ${roomSockets.size} sockets in room ${room.id}:`, Array.from(roomSockets));
      
      const broadcastResult = socket.to(room.id).emit("newProducer", {
        producerId: producer.id,
        participantId: socket.id,
        kind: producer.kind
      });
      console.log(`[SocketService] 📡 Broadcast newProducer result:`, broadcastResult);
      
      callback({ id: producer.id });
      
    } catch (error) {
      console.error("[SocketService] ❌ Failed to create producer:", error);
      callback({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  /**
   * Handle creating consumer
   */
  private async _handleConsume(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    data: { 
      producerId: string;
      rtpCapabilities: mediasoup.types.RtpCapabilities;
    },
    callback: (response?: any) => void
  ): Promise<void> {
    console.log("[SocketService] 🍽️ Creating consumer:", {
      socketId: socket.id,
      producerId: data.producerId
    });
    
    try {
      const { room, participant } = await this._getParticipantAndRoom(socket.id);
      
      if (!room.router) {
        throw new Error("Room router not available");
      }
      
      // Find producer in room
      let targetProducer: mediasoup.types.Producer | undefined;
      let producerParticipantId: string | undefined;
      
      for (const [participantId, roomParticipant] of room.participants) {
        const producer = roomParticipant.producers.get(data.producerId);
        if (producer) {
          targetProducer = producer;
          producerParticipantId = participantId;
          break;
        }
      }
      
      if (!targetProducer) {
        throw new Error(`Producer not found: ${data.producerId}`);
      }
      
      // Check if router can consume
      if (!room.router.canConsume({
        producerId: data.producerId,
        rtpCapabilities: data.rtpCapabilities
      })) {
        throw new Error("Cannot consume producer with current RTP capabilities");
      }
      
      // Find receive transport
      let receiveTransport: mediasoup.types.WebRtcTransport | undefined;
      for (const transport of participant.transports.values()) {
        // Assume receive transports don't have producers directly attached
        // This is a simplified check - in production you might want to track transport types
        receiveTransport = transport;
        break;
      }
      
      if (!receiveTransport) {
        throw new Error("Receive transport not found");
      }
      
      // Create consumer
      const consumer = await receiveTransport.consume({
        producerId: data.producerId,
        rtpCapabilities: data.rtpCapabilities,
        paused: false, // CRITICAL: Start unpaused like MediaSoup demo
      });
      
      // Store consumer
      participant.consumers.set(consumer.id, consumer);
      
      // Set up consumer event handlers
      this._setupConsumerEvents(consumer, socket.id);
      
      // CRITICAL: Auto-resume immediately like MediaSoup demo
      if (consumer.paused) {
        await consumer.resume();
        console.log("[SocketService] 🔄 Auto-resumed consumer:", consumer.id);
      }
      
      // CRITICAL: Force resume and wait a bit to ensure it's ready
      await consumer.resume();
      console.log("[SocketService] ✅ Force-resumed consumer:", consumer.id, "paused:", consumer.paused);
      
      // Request keyframe for video consumers with retry
      const anyConsumer: any = consumer as any;
      if (consumer.kind === 'video' && typeof anyConsumer.requestKeyFrame === 'function') {
        anyConsumer.requestKeyFrame();
        console.log("[SocketService] 🛰️ Requested initial keyframe for video consumer:", consumer.id);
        
        // Add aggressive keyframe requests for better first frame delivery
        setTimeout(() => {
          if (!consumer.closed && !consumer.paused) {
            anyConsumer.requestKeyFrame();
            console.log("[SocketService] 🛰️ Keyframe re-request #1 for consumer:", consumer.id);
          }
        }, 500);
        
        setTimeout(() => {
          if (!consumer.closed && !consumer.paused) {
            anyConsumer.requestKeyFrame();
            console.log("[SocketService] 🛰️ Keyframe re-request #2 for consumer:", consumer.id);
          }
        }, 1500);
      }
      
      const consumerParams = {
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        producerParticipantId,
        paused: consumer.paused, // Should be false now
        streamId: `${producerParticipantId}-mic-webcam` // Inform client of streamId for grouping
      };
      
      console.log("[SocketService] ✅ Consumer created:", {
        consumerId: consumer.id,
        producerId: data.producerId,
        kind: consumer.kind,
        participantId: socket.id
      });
      
      callback(consumerParams);
      
    } catch (error) {
      console.error("[SocketService] ❌ Failed to create consumer:", error);
      callback({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  /**
   * Handle resuming consumer
   */
  private async _handleResumeConsumer(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    data: { consumerId: string },
    callback?: (response?: any) => void
  ): Promise<void> {
    console.log("[SocketService] ▶️ Resuming consumer:", {
      socketId: socket.id,
      consumerId: data.consumerId
    });
    
    try {
      const { participant } = await this._getParticipantAndRoom(socket.id);
      
      const consumer = participant.consumers.get(data.consumerId);
      if (!consumer) {
        throw new Error(`Consumer not found: ${data.consumerId}`);
      }
      
      // CRITICAL: Only resume if actually paused
      if (consumer.paused) {
        await consumer.resume();
        console.log("[SocketService] ✅ Consumer resumed:", data.consumerId);
      } else {
        console.log("[SocketService] ✅ Consumer already active:", data.consumerId);
      }
      
      // CRITICAL: Request keyframe for video consumers to ensure first frame is decodable
      if (consumer.kind === 'video') {
        console.log("[SocketService] 🛰️ Requesting keyframe for video consumer:", data.consumerId);
        
        // MediaSoup Consumer has requestKeyFrame method (undocumented but exists)
        const anyConsumer: any = consumer as any;
        if (typeof anyConsumer.requestKeyFrame === 'function') {
          anyConsumer.requestKeyFrame();
          console.log("[SocketService] 🛰️ Requested initial keyframe for consumer", consumer.id);
          
          // Add retry requests after delays to ensure keyframe delivery
          [1000, 3000].forEach(delay => setTimeout(async () => {
            try {
              if (!consumer.closed && !consumer.paused) {
                anyConsumer.requestKeyFrame();
                console.log(`[SocketService] 🛰️ Keyframe re-request (delay=${delay}ms) for consumer ${consumer.id}`);
              }
            } catch (retryError) {
              console.warn(`[SocketService] ⚠️ Keyframe retry failed for consumer ${consumer.id}:`, retryError);
            }
          }, delay));
        } else {
          console.warn("[SocketService] ⚠️ requestKeyFrame method not available on consumer");
        }
      }
      
      if (callback) callback({ success: true });
      
    } catch (error) {
      console.error("[SocketService] ❌ Failed to resume consumer:", error);
      if (callback) callback({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  /**
   * Handle getting existing producers (for late joiners)
   */
  private async _handleGetProducers(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    callback: (response?: any) => void
  ): Promise<void> {
    console.log("[SocketService] 📋 Getting existing producers for:", socket.id);
    
    try {
      const { room } = await this._getParticipantAndRoom(socket.id);
      
      const producers: Array<{
        producerId: string;
        participantId: string;
        kind: string;
      }> = [];
      
      for (const [participantId, participant] of room.participants) {
        if (participantId !== socket.id) {
          for (const [producerId, producer] of participant.producers) {
            producers.push({
              producerId,
              participantId,
              kind: producer.kind
            });
          }
        }
      }
      
      console.log("[SocketService] ✅ Existing producers sent:", {
        count: producers.length,
        socketId: socket.id
      });
      
      callback(producers);
      
    } catch (error) {
      console.error("[SocketService] ❌ Failed to get producers:", error);
      callback({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  /**
   * Handle socket disconnection
   */
  private async _handleDisconnection(socketId: string): Promise<void> {
    console.log("[SocketService] 🔌 Handling disconnection:", socketId);
    
    // CRITICAL: Clean up socket tracking maps
    const userId = this.socketUsers.get(socketId);
    if (userId) {
      console.log(`[SocketService] 🧹 Cleaning up socket tracking for user: ${userId}, socket: ${socketId}`);
      
      // Remove from user sockets set
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socketId);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
      
      // Remove socket-user mapping
      this.socketUsers.delete(socketId);
    }
    
    // Find and cleanup participant
    for (const [roomId, room] of this.rooms) {
      const participant = room.participants.get(socketId);
      if (participant) {
        await this._cleanupParticipant(room, socketId, participant);
        break;
      }
    }
  }

  /**
   * Clean up participant and notify others
   */
  private async _cleanupParticipant(
    room: Room,
    participantId: string,
    participant: RoomParticipant
  ): Promise<void> {
    console.log("[SocketService] 🧹 Cleaning up participant:", {
      roomId: room.id,
      participantId,
      producersCount: participant.producers.size,
      consumersCount: participant.consumers.size,
      transportsCount: participant.transports.size
    });
    
    // Close all producers
    for (const [producerId, producer] of participant.producers) {
      producer.close();
      
      // Notify other participants that producer closed
      this.io?.to(room.id).emit("producerClosed", { 
        producerId,
        participantId 
      });
    }
    
    // Close all consumers
    for (const consumer of participant.consumers.values()) {
      consumer.close();
    }
    
    // Close all transports
    for (const transport of participant.transports.values()) {
      transport.close();
    }
    
    // Remove participant from room
    room.participants.delete(participantId);
    
    // Notify remaining participants
    this.io?.to(room.id).emit("participantLeft", { participantId });
    
    // Clean up empty room
    if (room.participants.size === 0) {
      console.log("[SocketService] 🏠 Cleaning up empty room:", room.id);
      
      if (room.router) {
        room.router.close();
      }
      
      this.rooms.delete(room.id);
    }
    
    console.log("[SocketService] ✅ Participant cleanup complete:", {
      roomId: room.id,
      participantId,
      remainingParticipants: room.participants.size
    });
  }

  /**
   * Set up transport event handlers
   */
  private _setupTransportEvents(
    transport: mediasoup.types.WebRtcTransport,
    socketId: string
  ): void {
    transport.on("dtlsstatechange", (dtlsState) => {
      console.log(`[SocketService] 🔐 Transport DTLS state changed: ${dtlsState} (${socketId})`);
      
      if (dtlsState === "failed" || dtlsState === "closed") {
        console.warn(`[SocketService] ⚠️ Transport DTLS ${dtlsState}:`, transport.id);
      }
    });
    
    transport.on("icestatechange", (iceState) => {
      console.log(`[SocketService] 🧊 Transport ICE state changed: ${iceState} (${socketId})`);
    });
    
    transport.on("sctpstatechange", (sctpState) => {
      console.log(`[SocketService] 📡 Transport SCTP state changed: ${sctpState} (${socketId})`);
    });
  }

  /**
   * Set up producer event handlers
   */
  private _setupProducerEvents(
    producer: mediasoup.types.Producer,
    socketId: string,
    roomId: string
  ): void {
    producer.on("transportclose", () => {
      console.log("[SocketService] 🚛 Producer transport closed:", producer.id);
      
      // Notify participants that producer closed
      this.io?.to(roomId).emit("producerClosed", { 
        producerId: producer.id,
        participantId: socketId 
      });
    });
    
    producer.on("score", (score) => {
      console.log(`[SocketService] 📊 Producer score updated:`, {
        producerId: producer.id,
        score
      });
    });
  }

  /**
   * Set up consumer event handlers
   */
  private _setupConsumerEvents(
    consumer: mediasoup.types.Consumer,
    socketId: string
  ): void {
    consumer.on("transportclose", () => {
      console.log("[SocketService] 🚛 Consumer transport closed:", consumer.id);
    });
    
    consumer.on("producerclose", () => {
      console.log("[SocketService] 📤 Consumer producer closed:", consumer.id);
    });
    
    consumer.on("score", (score) => {
      console.log(`[SocketService] 📊 Consumer score updated:`, {
        consumerId: consumer.id,
        score
      });
    });
  }

  /**
   * Helper to get participant and room with retry logic
   */
  private async _getParticipantAndRoom(socketId: string): Promise<{ room: Room; participant: RoomParticipant }> {
    console.log(`[SocketService] 🔍 Looking for participant with socketId: ${socketId}`);
    console.log(`[SocketService] 🔍 Total rooms: ${this.rooms.size}`);
    
    for (const [roomId, room] of this.rooms.entries()) {
      console.log(`[SocketService] 🔍 Room ${roomId} has ${room.participants.size} participants`);
      const participantKeys = Array.from(room.participants.keys());
      console.log(`[SocketService] 🔍 Participant keys in room ${roomId}:`, participantKeys);
      
      const participant = room.participants.get(socketId);
      if (participant) {
        console.log(`[SocketService] ✅ Found participant ${participant.id} in room ${roomId}`);
        return { room, participant };
      }
    }
    
    // CRITICAL FIX: Add additional debugging for participant lookup failures
    console.log(`[SocketService] ❌ Participant not found in any room. Socket ID: ${socketId}`);
    console.log(`[SocketService] 🔍 Detailed room state:`);
    for (const [roomId, room] of this.rooms.entries()) {
      console.log(`[SocketService] 🏠 Room ${roomId}:`, {
        participantCount: room.participants.size,
        participantIds: Array.from(room.participants.keys()),
        participantNames: Array.from(room.participants.values()).map(p => p.name)
      });
    }
    
    // CRITICAL FIX: Wait a bit and retry once (in case of timing issue)
    console.log(`[SocketService] ⏳ Retrying participant lookup after delay...`);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    for (const [roomId, room] of this.rooms.entries()) {
      const participant = room.participants.get(socketId);
      if (participant) {
        console.log(`[SocketService] ✅ Found participant ${participant.id} in room ${roomId} on retry`);
        return { room, participant };
      }
    }
    
    console.log(`[SocketService] ❌ Participant still not found after retry: ${socketId}`);
    throw new Error(`Participant not found: ${socketId}`);
  }

  /**
   * Handle sending chat message
   */
  private async _handleSendMessage(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    data: { roomId: string; message: string },
    callback?: (response?: any) => void
  ): Promise<void> {
    console.log("[SocketService] 💬 Handling send message:", {
      socketId: socket.id,
      roomId: data.roomId,
      message: data.message.substring(0, 50) + "..."
    });

    try {
      const { room, participant } = await this._getParticipantAndRoom(socket.id);

      if (room.id !== data.roomId) {
        throw new Error("Room ID mismatch");
      }

      if (!data.message?.trim()) {
        throw new Error("Message cannot be empty");
      }

      // Create chat message
      const chatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId: socket.id,
        senderName: participant.name,
        content: data.message.trim(),
        timestamp: new Date(),
        type: "text" as const,
        isEdited: false,
        reactions: [],
        roomId: data.roomId,
      };

      console.log("[SocketService] ✅ Broadcasting message to room:", data.roomId);

      // Emit to all participants in the room (including sender)
      socket.to(data.roomId).emit("messageReceived", { message: chatMessage });
      socket.emit("messageReceived", { message: chatMessage });

      if (callback) callback({ success: true });

    } catch (error) {
      console.error("[SocketService] ❌ Failed to send message:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to send message";
      if (callback) callback({ error: errorMsg });
    }
  }

  /**
   * Get room statistics
   */
  getRoomStats(): Array<{ roomId: string; participants: number; createdAt: Date }> {
    return Array.from(this.rooms.values()).map(room => ({
      roomId: room.id,
      participants: room.participants.size,
      createdAt: room.createdAt
    }));
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
