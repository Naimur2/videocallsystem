/**
 * Room Service - Handles all room-related business logic
 */

import { CreateRoomRequest, Participant, VideoCallRoom } from "../types";
import {
  generateParticipantId,
  generateRoomId,
  getCurrentTimestamp,
} from "../utils/helpers";
import {
  validateId,
  validateParticipantName,
  validateRoomName,
} from "../utils/validation";

class RoomService {
  private rooms = new Map<string, VideoCallRoom>();

  // Room operations
  createRoom(data: CreateRoomRequest): {
    room: VideoCallRoom;
    error: string | null;
  } {
    const nameValidation = validateRoomName(data.name);
    if (nameValidation) {
      return { room: {} as VideoCallRoom, error: nameValidation };
    }

    const hostValidation = validateParticipantName(data.hostName);
    if (hostValidation) {
      return { room: {} as VideoCallRoom, error: hostValidation };
    }

    const roomId = generateRoomId();
    const host = this.createParticipant(data.hostName);

    const room: VideoCallRoom = {
      id: roomId,
      name: data.name.trim(),
      participants: [host],
      createdAt: getCurrentTimestamp(),
      isActive: true,
      maxParticipants: 50, // Default max participants like Google Meet
      isRecording: false,
      settings: {
        allowScreenShare: true,
        allowChat: true,
        allowFileSharing: false,
        muteOnJoin: false,
        allowRecording: false,
        requirePermissionToJoin: false,
        maxParticipants: 50,
        chatRetentionDays: 30,
      },
      chatMessages: [],
    };

    this.rooms.set(roomId, room);
    return { room, error: null };
  }

  getRoomById(roomId: string): VideoCallRoom | null {
    const validation = validateId(roomId, "Room ID");
    if (validation) return null;

    const room = this.rooms.get(roomId);
    return room && room.isActive ? room : null;
  }

  getAllRooms(): VideoCallRoom[] {
    return Array.from(this.rooms.values()).filter((room) => room.isActive);
  }

  deleteRoom(roomId: string): { success: boolean; error: string | null } {
    const validation = validateId(roomId, "Room ID");
    if (validation) {
      return { success: false, error: validation };
    }

    const room = this.rooms.get(roomId);
    if (!room || !room.isActive) {
      return {
        success: false,
        error: "Room not found or already inactive",
      };
    }

    // Mark room as inactive instead of deleting
    room.isActive = false;
    room.participants = [];
    this.rooms.set(roomId, room);

    return { success: true, error: null };
  }

  // Participant operations
  joinRoom(
    roomId: string,
    participantName: string
  ): {
    room: VideoCallRoom | null;
    participant: Participant | null;
    error: string | null;
  } {
    const roomValidation = validateId(roomId, "Room ID");
    if (roomValidation) {
      return {
        room: null,
        participant: null,
        error: roomValidation,
      };
    }

    const nameValidation = validateParticipantName(participantName);
    if (nameValidation) {
      return {
        room: null,
        participant: null,
        error: nameValidation,
      };
    }

    let room = this.rooms.get(roomId);

    // Auto-create room if it doesn't exist (Google Meet-like behavior)
    if (!room || !room.isActive) {
      console.log(
        `[RoomService] Auto-creating room ${roomId} for participant ${participantName}`
      );

      const participant = this.createParticipant(participantName.trim());

      room = {
        id: roomId,
        name: `Room ${roomId}`, // Auto-generated name
        participants: [participant],
        createdAt: getCurrentTimestamp(),
        isActive: true,
        maxParticipants: 50,
        isRecording: false,
        settings: {
          allowScreenShare: true,
          allowChat: true,
          allowFileSharing: false,
          muteOnJoin: false,
          allowRecording: false,
          requirePermissionToJoin: false,
          maxParticipants: 50,
          chatRetentionDays: 30,
        },
        chatMessages: [],
      };

      this.rooms.set(roomId, room);
      console.log(
        `[RoomService] Room ${roomId} created successfully with host ${participantName}`
      );

      return { room, participant, error: null };
    }

    // Check if participant name already exists in room
    const existingParticipant = room.participants.find(
      (p) => p.name.toLowerCase() === participantName.trim().toLowerCase()
    );
    if (existingParticipant) {
      console.log(
        `[RoomService] Participant ${participantName} already exists in room ${roomId}, removing old entry for rejoin`
      );
      // Remove the existing participant to allow rejoin (handles refresh/reconnect scenarios)
      room.participants = room.participants.filter(
        (p) => p.name.toLowerCase() !== participantName.trim().toLowerCase()
      );
    }

    // Check room capacity
    if (room.participants.length >= room.maxParticipants) {
      return {
        room: null,
        participant: null,
        error: "Room is at maximum capacity",
      };
    }

    const participant = this.createParticipant(participantName.trim());
    room.participants.push(participant);
    this.rooms.set(roomId, room);

    console.log(`[RoomService] ${participantName} joined room ${roomId}`);
    return { room, participant, error: null };
  }

  leaveRoom(
    roomId: string,
    participantId: string
  ): {
    room: VideoCallRoom | null;
    error: string | null;
    roomEnded: boolean;
    leftParticipant?: Participant;
  } {
    const roomValidation = validateId(roomId, "Room ID");
    if (roomValidation) {
      return { room: null, error: roomValidation, roomEnded: false };
    }

    const participantValidation = validateId(participantId, "Participant ID");
    if (participantValidation) {
      return { room: null, error: participantValidation, roomEnded: false };
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      return { room: null, error: "Room not found", roomEnded: false };
    }

    const participantIndex = room.participants.findIndex(
      (p) => p.id === participantId
    );
    if (participantIndex === -1) {
      return {
        room: null,
        error: "Participant not found in room",
        roomEnded: false,
      };
    }

    // Get participant info before removing
    const leftParticipant = room.participants[participantIndex];

    // Remove participant
    room.participants.splice(participantIndex, 1);

    // Check if room becomes empty
    const roomEnded = room.participants.length === 0;

    // Deactivate room if no participants left
    if (roomEnded) {
      room.isActive = false;
      console.log(`[RoomService] Room ${roomId} ended - no participants left`);
    }

    this.rooms.set(roomId, room);
    return { room, error: null, roomEnded, leftParticipant };
  }

  getParticipantsByRoom(roomId: string): {
    participants: Participant[];
    error: string | null;
  } {
    const room = this.getRoomById(roomId);
    if (!room) {
      return { participants: [], error: "Room not found" };
    }

    return { participants: room.participants, error: null };
  }

  updateParticipantSocket(
    roomId: string,
    participantId: string,
    socketId: string
  ): {
    success: boolean;
    error: string | null;
  } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: "Room not found" };
    }

    const participant = room.participants.find((p) => p.id === participantId);
    if (!participant) {
      return { success: false, error: "Participant not found" };
    }

    participant.socketId = socketId;
    this.rooms.set(roomId, room);
    return { success: true, error: null };
  }

  // Private helper methods
  private createParticipant(name: string): Participant {
    return {
      id: generateParticipantId(),
      name: name.trim(),
      joinedAt: getCurrentTimestamp(),
      isAudioEnabled: true,
      isVideoEnabled: true,
      isScreenSharing: false,
      isModerator: false,
      status: "active" as const,
      transports: new Map(),
      producers: new Map(),
      consumers: new Map(),
    };
  }

  // Room statistics
  getRoomStats(): {
    totalRooms: number;
    activeRooms: number;
    totalParticipants: number;
  } {
    const activeRooms = this.getAllRooms();
    const totalParticipants = activeRooms.reduce(
      (total, room) => total + room.participants.length,
      0
    );

    return {
      totalRooms: this.rooms.size,
      activeRooms: activeRooms.length,
      totalParticipants,
    };
  }

  // Cleanup inactive rooms (can be called periodically)
  cleanupInactiveRooms(maxInactiveHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - maxInactiveHours * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [roomId, room] of Array.from(this.rooms.entries())) {
      if (!room.isActive && room.createdAt < cutoffTime) {
        this.rooms.delete(roomId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}

// Export singleton instance
export const roomService = new RoomService();
export default roomService;
