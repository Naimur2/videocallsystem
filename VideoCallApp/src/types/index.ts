export interface Participant {
  id: string;
  name: string;
  email?: string;
  isHost: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isHandRaised?: boolean;
  avatar?: string;
  joinedAt: Date;
  videoStream?: MediaStream;
  audioStream?: MediaStream;
  screenStream?: MediaStream;
}

export interface Room {
  id: string;
  name: string;
  participants: Participant[];
  createdAt: Date;
  isActive: boolean;
  maxParticipants: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system';
}

export interface VideoCallState {
  isConnected: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  participants: Participant[];
  currentRoom: Room | null;
  chatMessages: ChatMessage[];
  isHandRaised: boolean;
}

export interface MediaStreamInfo {
  id: string;
  participantId: string;
  stream: MediaStream | null;
  type: 'audio' | 'video' | 'screen';
}

// MediaSoup Types
export interface RtpCapabilities {
  codecs: unknown[];
  headerExtensions: unknown[];
}

export interface DtlsParameters {
  role?: string;
  fingerprints: unknown[];
}

export interface TransportOptions {
  id: string;
  iceParameters: unknown;
  iceCandidates: unknown[];
  dtlsParameters: DtlsParameters;
  sctpParameters?: unknown;
}

export interface ProducerOptions {
  id: string;
  kind: 'audio' | 'video';
  rtpParameters: unknown;
}

export interface ConsumerOptions {
  id: string;
  producerId: string;
  kind: 'audio' | 'video';
  rtpParameters: unknown;
}

// Socket.IO Events
export interface ClientToServerEvents {
  joinRoom: (data: {
    roomId: string;
    participantName: string;
    userEmail?: string;
  }) => void;
  leaveRoom: (data: { roomId: string }) => void;
  toggleAudio: (data: { participantId: string; isEnabled: boolean }) => void;
  toggleVideo: (data: { participantId: string; isEnabled: boolean }) => void;
  startScreenShare: (data: { participantId: string }) => void;
  stopScreenShare: (data: { participantId: string }) => void;
  sendMessage: (data: { roomId: string; message: string }) => void;
  raiseHand: (data: { participantId: string; isRaised: boolean }) => void;
  forceDisconnectExisting: (data: {
    userEmail: string;
    roomId: string;
  }) => void;
  // Heartbeat system
  ping: () => void;
  beforeDisconnect: (data: { roomId?: string }) => void;
  // MediaSoup events
  getRouterRtpCapabilities: (
    callback: (response: {
      rtpCapabilities?: RtpCapabilities;
      error?: string;
    }) => void
  ) => void;
  createWebRtcTransport: (
    callback: (response: TransportOptions | { error: string }) => void
  ) => void;
  connectTransport: (
    data: { transportId: string; dtlsParameters: DtlsParameters },
    callback?: () => void
  ) => void;
  produce: (
    data: { transportId: string; kind: string; rtpParameters: unknown },
    callback: (response: { id: string }) => void
  ) => void;
  consume: (
    data: { producerId: string; rtpCapabilities: RtpCapabilities },
    callback: (response: ConsumerOptions | { error: string }) => void
  ) => void;
  resumeConsumer: (data: { consumerId: string }) => void;
}

export interface ServerToClientEvents {
  roomJoined: (data: { room: Room; participant: Participant }) => void;
  participantJoined: (data: { participant: Participant }) => void;
  participantLeft: (data: { participantId: string }) => void;
  participantAudioToggled: (data: {
    participantId: string;
    isEnabled: boolean;
  }) => void;
  participantVideoToggled: (data: {
    participantId: string;
    isEnabled: boolean;
  }) => void;
  messageReceived: (data: { message: ChatMessage }) => void;
  handRaised: (data: { participantId: string; isRaised: boolean }) => void;
  roomEnded: (data: { roomId: string; reason: string }) => void;
  error: (data: { message: string }) => void;
  // Multi-tab Events
  duplicateConnection: (data: { message: string; newSocketId: string }) => void;
  connectionRejected: (data: {
    reason: string;
    message: string;
    existingSession?: { joinedAt: number; socketId: string };
  }) => void;
  forceDisconnect: (data: { reason: string; message: string }) => void;
  forceDisconnectResult: (data: { success: boolean }) => void;
  // Heartbeat system
  pong: () => void;
  // MediaSoup events
  newProducer: (data: {
    producerId: string;
    participantId: string;
    kind: string;
  }) => void;
  producerClosed: (data: { producerId: string; participantId: string }) => void;
}

// Mobile-specific types
export interface DeviceInfo {
  hasCamera: boolean;
  hasMicrophone: boolean;
  cameraPermission: 'granted' | 'denied' | 'undetermined';
  microphonePermission: 'granted' | 'denied' | 'undetermined';
}

export interface MobileVideoCallState extends VideoCallState {
  deviceInfo: DeviceInfo;
  isBackgroundMode: boolean;
  orientation: 'portrait' | 'landscape';
}
