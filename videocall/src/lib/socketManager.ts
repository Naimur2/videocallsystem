"use client";

import type { ClientToServerEvents, ServerToClientEvents } from "@/types";
import { Socket } from "socket.io-client";

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private currentRoomId: string | null = null;

  private constructor() {}

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  connect(): Socket<ServerToClientEvents, ClientToServerEvents> {
    // CRITICAL FIX: Don't create duplicate sockets!
    // Use the socket from the Zustand store instead of creating a new one
    console.log("[SocketManager] 🚫 DEPRECATED: Use Zustand store socket instead");
    
    // Try to get the socket from the Zustand store
    try {
      // Dynamic import to avoid circular dependencies
      import("@/store/videoCallStore").then(({ useVideoCallStore }) => {
        const { socket } = useVideoCallStore.getState();
        if (socket && socket.connected) {
          console.log("[SocketManager] ✅ Using existing Zustand store socket:", socket.id);
          this.socket = socket;
        } else {
          console.warn("[SocketManager] ⚠️ No active socket in Zustand store");
        }
      });
    } catch (error) {
      console.error("[SocketManager] ❌ Failed to get Zustand store socket:", error);
    }

    // Return current socket or null - don't create new connections
    if (this.socket && this.socket.connected) {
      console.log("[SocketManager] Returning existing socket:", this.socket.id);
      return this.socket;
    }

    // If no socket available, throw error to indicate proper initialization needed
    throw new Error("No socket available. Initialize via Zustand store first.");
  }

  // NEW: Set socket from external source (Zustand store)
  setSocket(socket: Socket<ServerToClientEvents, ClientToServerEvents>): void {
    console.log("[SocketManager] Setting socket from external source:", socket.id);
    this.socket = socket;
    
    // Set up heartbeat for this socket
    if (socket.connected) {
      this.startHeartbeat();
    }
    
    // Listen for disconnect to stop heartbeat
    socket.on("disconnect", () => {
      this.stopHeartbeat();
    });
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      console.log("[SocketManager] Disconnecting socket");

      // Send graceful disconnect signal before disconnecting
      if (this.currentRoomId) {
        this.socket.emit("beforeDisconnect", { roomId: this.currentRoomId });
      }

      this.stopHeartbeat();
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.currentRoomId = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  setCurrentRoom(roomId: string | null): void {
    this.currentRoomId = roomId;
  }

  /**
   * Start heartbeat to keep connection alive and detect zombie connections
   */
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing heartbeat

    // Send ping every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        console.log("[SocketManager] 🏓 Sending ping to server");
        this.socket.emit("ping");
      }
    }, 30000);
  }

  /**
   * Stop heartbeat interval
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export const socketManager = SocketManager.getInstance();
