import { Request } from "express";
// MediaSoup types will be imported after proper setup

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface CustomRequest extends Request {
  user?: any; // For future authentication
}

// Enum-like types
export type ParticipantStatus = "active" | "away" | "muted";
export type MessageType = "text" | "file" | "image" | "system";
export type NotificationType = "info" | "warning" | "error" | "success";

export interface VideoCallRoom {
  id: string;
  name: string;
  participants: Participant[];
  createdAt: Date;
  isActive: boolean;
  router?: any; // Will be properly typed with MediaSoup later
  maxParticipants: number;
  isRecording: boolean;
  settings: RoomSettings;
  chatMessages: ChatMessage[];
  currentScreenSharer?: string; // participant ID who is sharing screen
}

export interface Participant {
  id: string;
  name: string;
  socketId?: string;
  joinedAt: Date;
  transports: Map<string, any>; // Will be properly typed with MediaSoup later
  producers: Map<string, any>; // Will be properly typed with MediaSoup later
  consumers: Map<string, any>; // Will be properly typed with MediaSoup later
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isModerator: boolean;
  avatar?: string;
  status: ParticipantStatus;
}

export interface CreateRoomRequest {
  name: string;
  hostName: string;
}

export interface JoinRoomRequest {
  roomId: string;
  participantName: string;
}

export interface SendChatMessageRequest {
  roomId: string;
  senderId: string;
  message: string;
  type?: MessageType;
  replyTo?: string;
}

// Chat and Room Settings Types
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: MessageType;
  replyTo?: string; // message ID being replied to
  isEdited: boolean;
  editedAt?: Date;
  reactions: MessageReaction[];
}

export interface MessageReaction {
  emoji: string;
  participants: string[]; // participant IDs
  count: number;
}

export interface RoomSettings {
  allowScreenShare: boolean;
  allowChat: boolean;
  allowRecording: boolean;
  muteOnJoin: boolean;
  requirePermissionToJoin: boolean;
  maxParticipants: number;
  allowFileSharing: boolean;
  chatRetentionDays: number;
}

// MediaSoup specific types (placeholder for now)
export interface MediaSoupConfig {
  worker: any;
  router: any;
  webRtcTransport: any;
}

// Socket.IO event types (enhanced for Google Meet-like features)
export interface ClientToServerEvents {
  // Room Management
  joinRoom: (data: {
    roomId: string;
    participantName: string;
    userEmail?: string;
  }) => void;
  leaveRoom: (data: { roomId: string }) => void;

  // Test/Debug events
  "test-echo": (data: { message: string; timestamp: number }, callback: (response: any) => void) => void;

  // MediaSoup WebRTC
  getRouterRtpCapabilities: (callback: (rtpCapabilities: any) => void) => void;
  createWebRtcTransport: (callback: (params: any) => void) => void;
  connectTransport: (data: {
    transportId: string;
    dtlsParameters: any;
  }) => void;
  connectWebRtcTransport: (data: {
    transportId: string;
    dtlsParameters: any;
  }, callback: (response: { error?: string }) => void) => void;
  produce: (
    data: { transportId: string; kind: any; rtpParameters: any },
    callback: (id: string) => void
  ) => void;
  consume: (
    data: { producerId: string; rtpCapabilities: any },
    callback: (params: any) => void
  ) => void;
  resumeConsumer: (data: { consumerId: string }) => void;

  // Audio/Video Controls
  toggleAudio: (data: { participantId: string; isEnabled: boolean }) => void;
  toggleVideo: (data: { participantId: string; isEnabled: boolean }) => void;

  // Screen Sharing
  startScreenShare: (data: { participantId: string }) => void;
  stopScreenShare: (data: { participantId: string }) => void;

  // Chat Features
  sendMessage: (data: {
    roomId: string;
    message: string;
  }) => void;
  editMessage: (data: { messageId: string; newContent: string }) => void;
  deleteMessage: (data: { messageId: string }) => void;
  reactToMessage: (data: {
    messageId: string;
    emoji: string;
    participantId: string;
  }) => void;

  // File Sharing
  shareFile: (data: {
    roomId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    fileData: string;
  }) => void;

  // Participant Status
  updateStatus: (data: {
    participantId: string;
    status: ParticipantStatus;
  }) => void;

  // Recording
  startRecording: (data: { roomId: string }) => void;
  stopRecording: (data: { roomId: string }) => void;

  // Multi-tab Management
  forceDisconnectExisting: (data: {
    userEmail: string;
    roomId: string;
  }) => void;

  // Heartbeat System
  ping: () => void;
  beforeDisconnect: (data: { roomId?: string }) => void;
}

export interface ServerToClientEvents {
  // Room Events
  roomJoined: (data: { room: VideoCallRoom; participant: Participant }) => void;
  participantJoined: (data: { participant: Participant }) => void;
  participantLeft: (data: { participantId: string }) => void;
  roomEnded: (data: { roomId: string; reason: string }) => void;
  roomSettingsUpdated: (data: { settings: RoomSettings }) => void;

  // MediaSoup Events
  newProducer: (data: {
    producerId: string;
    participantId: string;
    kind: any;
    isScreenShare?: boolean;
  }) => void;
  producerClosed: (data: { producerId: string; participantId: string }) => void;

  // Audio/Video Events
  participantAudioToggled: (data: {
    participantId: string;
    isEnabled: boolean;
  }) => void;
  participantVideoToggled: (data: {
    participantId: string;
    isEnabled: boolean;
  }) => void;

  // Screen Sharing Events
  screenShareStarted: (data: {
    participantId: string;
    participantName: string;
  }) => void;
  screenShareStopped: (data: { participantId: string }) => void;

  // Chat Events
  messageReceived: (data: { message: ChatMessage }) => void;
  messageEdited: (data: {
    messageId: string;
    newContent: string;
    editedAt: Date;
  }) => void;
  messageDeleted: (data: { messageId: string }) => void;
  messageReactionUpdated: (data: {
    messageId: string;
    reactions: MessageReaction[];
  }) => void;

  // File Sharing Events
  fileReceived: (data: {
    fileName: string;
    fileSize: number;
    fileType: string;
    fileData: string;
    senderId: string;
    senderName: string;
  }) => void;

  // Participant Status Events
  participantStatusUpdated: (data: {
    participantId: string;
    status: ParticipantStatus;
  }) => void;

  // Recording Events
  recordingStarted: (data: { roomId: string; startedBy: string }) => void;
  recordingStopped: (data: {
    roomId: string;
    stoppedBy: string;
    duration: number;
  }) => void;

  // System Events
  error: (data: { message: string; code?: string }) => void;
  notification: (data: { type: NotificationType; message: string }) => void;

  // Multi-tab Events
  duplicateConnection: (data: { message: string; newSocketId: string }) => void;
  connectionRejected: (data: {
    reason: string;
    message: string;
    existingSession?: { joinedAt: number; socketId: string };
  }) => void;
  forceDisconnect: (data: { reason: string; message: string }) => void;
  forceDisconnectResult: (data: { success: boolean }) => void;

  // Heartbeat Events
  pong: () => void;
}
