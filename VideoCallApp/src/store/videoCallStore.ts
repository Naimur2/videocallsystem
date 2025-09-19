import { Alert, Platform } from 'react-native';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';
import { mediaSoupClientService } from '../services/mediaSoupClientService';
import {
    ChatMessage,
    ClientToServerEvents,
    MobileVideoCallState,
    Participant,
    Room,
    RtpCapabilities,
    ServerToClientEvents,
} from '../types';

// Mobile-specific config
const config = {
  socketUrl: 'https://meeting.naimur-rahaman.com',
  socket: {
    timeout: 20000,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  },
  videoCall: {
    defaultVideoConstraints: {
      width: {ideal: 640, max: 1280},
      height: {ideal: 480, max: 720},
      frameRate: {ideal: 30, max: 30},
      facingMode: 'user',
    },
    defaultAudioConstraints: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  },
};

interface VideoCallStore extends MobileVideoCallState {
  // Connection State
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isSocketConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'failed';

  // Media State
  localStream: MediaStream | null;
  screenStream: MediaStream | null;

  // MediaSoup State
  isMediaSoupInitialized: boolean;
  rtpCapabilities: RtpCapabilities | null;
  sendTransport: unknown | null;
  recvTransport: unknown | null;
  audioProducer: unknown | null;
  videoProducer: unknown | null;
  screenProducer: unknown | null;
  remoteStreams: Map<string, MediaStream>;

  // UI State
  isLoading: boolean;
  error: string | null;
  selfParticipantId: string | null;

  // Actions
  connect: (serverUrl?: string) => void;
  disconnect: () => void;
  joinRoom: (
    roomId: string,
    participant: {name: string; email?: string},
  ) => Promise<void>;
  leaveRoom: () => void;
  initializeMedia: () => Promise<MediaStream>;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  toggleHandRaise: () => void;
  sendMessage: (message: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetStore: () => void;

  // Mobile-specific actions
  requestPermissions: () => Promise<void>;
  checkDeviceCapabilities: () => Promise<void>;
  handleBackgroundMode: (isBackground: boolean) => void;
  setOrientation: (orientation: 'portrait' | 'landscape') => void;

  // MediaSoup Actions
  initializeMediaSoup: () => Promise<void>;
  createTransports: () => Promise<void>;
  startProducing: () => Promise<void>;
  stopProducing: () => Promise<void>;
  consumeMedia: (producerId: string, participantId: string) => Promise<void>;
  cleanupMediaSoup: () => void;
}

export const useVideoCallStore = create<VideoCallStore>((set, get) => ({
  // Initial State
  socket: null,
  isSocketConnected: false,
  isConnected: false,
  connectionStatus: 'disconnected',
  currentRoom: null,
  participants: [],
  isAudioEnabled: true,
  isVideoEnabled: true,
  isScreenSharing: false,
  isHandRaised: false,
  chatMessages: [],
  localStream: null,
  screenStream: null,
  selfParticipantId: null,

  // MediaSoup Initial State
  isMediaSoupInitialized: false,
  rtpCapabilities: null,
  sendTransport: null,
  recvTransport: null,
  audioProducer: null,
  videoProducer: null,
  screenProducer: null,
  remoteStreams: new Map(),

  // UI State
  isLoading: false,
  error: null,

  // Mobile-specific state
  deviceInfo: {
    hasCamera: false,
    hasMicrophone: false,
    cameraPermission: 'undetermined',
    microphonePermission: 'undetermined',
  },
  isBackgroundMode: false,
  orientation: 'portrait',

  // Actions
  connect: (serverUrl?: string) => {
    const {socket: existingSocket} = get();

    if (existingSocket && existingSocket.connected) {
      console.log('[VideoCallStore] Already connected');
      return;
    }

    console.log('[VideoCallStore] Connecting to server...');
    set({connectionStatus: 'connecting', error: null});

    const socketUrl = serverUrl || config.socketUrl;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: config.socket.timeout,
      reconnectionAttempts: config.socket.reconnectionAttempts,
      reconnectionDelay: config.socket.reconnectionDelay,
      autoConnect: true,
      upgrade: true,
      rememberUpgrade: true,
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true',
      },
    });

    // Socket Event Listeners
    socket.on('connect', () => {
      console.log('[VideoCallStore] ✅ Connected - Socket ID:', socket.id);
      set({
        socket,
        isSocketConnected: true,
        connectionStatus: 'connected',
        error: null,
      });
    });

    socket.on('disconnect', reason => {
      console.log('[VideoCallStore] ❌ Disconnected - Reason:', reason);
      set({
        isSocketConnected: false,
        connectionStatus: 'disconnected',
        isConnected: false,
      });

      if (reason === 'io server disconnect') {
        set({error: 'Server disconnected'});
      }
    });

    socket.on('connect_error', err => {
      console.error('[VideoCallStore] ❌ Connection error:', err);
      set({
        connectionStatus: 'failed',
        error: `Connection failed: ${err.message}`,
        isSocketConnected: false,
      });
    });

    // Room Events
    socket.on(
      'roomJoined',
      async (data: {room: Room; participant: Participant}) => {
        console.log('[VideoCallStore] Successfully joined room:', data.room.id);

        const remoteParticipants =
          data.room.participants?.filter(p => p.id !== data.participant.id) ||
          [];

        set({
          currentRoom: data.room,
          participants: remoteParticipants,
          isConnected: true,
          isLoading: false,
          error: null,
          selfParticipantId: data.participant.id,
        });

        // Initialize MediaSoup after successful room join
        try {
          console.log('[VideoCallStore] Initializing MediaSoup...');

          if (data.room?.id && data.participant?.name) {
            mediaSoupClientService.setSocket(socket);

            await new Promise(resolve => setTimeout(resolve, 500));

            const {initializeMediaSoup} = get();
            await initializeMediaSoup();

            const {createTransports} = get();
            await createTransports();

            const {localStream} = get();
            if (!localStream) {
              try {
                await get().initializeMedia();
              } catch (mediaError) {
                console.error('[VideoCallStore] ❌ Failed to initialize media:', mediaError);
              }
            }

            const {localStream: finalLocalStream} = get();
            if (finalLocalStream) {
              const {startProducing} = get();
              await startProducing();
            }

            console.log('[VideoCallStore] ✅ MediaSoup initialization complete');
          }
        } catch (error) {
          console.error('[VideoCallStore] ❌ MediaSoup initialization failed:', error);
        }
      },
    );

    socket.on('participantJoined', (data: {participant: Participant}) => {
      console.log('[VideoCallStore] 🎉 Participant joined:', data.participant.name);
      const selfId = get().selfParticipantId;
      if (selfId && data.participant.id === selfId) {
        console.log('[VideoCallStore] Ignoring participantJoined for self participant');
        return;
      }
      set(state => ({
        participants: [...state.participants, data.participant],
      }));
    });

    socket.on('participantLeft', (data: {participantId: string}) => {
      console.log('[VideoCallStore] Participant left:', data.participantId);
      set(state => ({
        participants: state.participants.filter(p => p.id !== data.participantId),
      }));
    });

    socket.on('messageReceived', (data: {message: ChatMessage}) => {
      console.log('[VideoCallStore] Message received:', data.message);
      set(state => ({
        chatMessages: [...state.chatMessages, data.message],
      }));
    });

    // MediaSoup Events
    socket.on(
      'newProducer',
      (data: {producerId: string; participantId: string; kind: string}) => {
        console.log(`[VideoCallStore] 🎬 New producer: ${data.producerId} (${data.kind})`);
        const {consumeMedia} = get();
        try {
          consumeMedia(data.producerId, data.participantId);
        } catch (error) {
          console.error('[VideoCallStore] ❌ Failed to consume new producer:', error);
        }
      },
    );

    socket.on('error', (data: {message: string}) => {
      console.error('[VideoCallStore] Server error:', data.message);
      set({error: data.message, isLoading: false});
    });

    set({socket});
  },

  disconnect: () => {
    const {socket} = get();
    if (socket) {
      console.log('[VideoCallStore] Disconnecting socket');
      socket.disconnect();
    }
    set({
      socket: null,
      isSocketConnected: false,
      connectionStatus: 'disconnected',
    });
  },

  joinRoom: async (
    roomId: string,
    participant: {name: string; email?: string},
  ) => {
    const {socket, isSocketConnected} = get();

    console.log('[VideoCallStore] 🚪 Attempting to join room:', roomId);

    if (!socket || !isSocketConnected) {
      throw new Error('Socket not connected. Please wait and try again.');
    }

    set({isLoading: true, error: null});

    try {
      // Request permissions first
      await get().requestPermissions();

      // Initialize media
      try {
        await get().initializeMedia();
        console.log('[VideoCallStore] Media initialized successfully');
      } catch (mediaError) {
        console.warn('[VideoCallStore] Media initialization failed:', mediaError);
        // Continue without media for now
      }

      console.log('[VideoCallStore] Emitting joinRoom event');
      socket.emit('joinRoom', {
        roomId,
        participantName: participant.name,
        userEmail: participant.email,
      });

      // Wait for room join response
      let attempts = 0;
      const maxAttempts = 50;

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const {isConnected, error} = get();

        if (isConnected) {
          console.log('[VideoCallStore] Successfully joined room!');
          return;
        }

        if (error) {
          throw new Error(error);
        }

        attempts++;
      }

      throw new Error('Join room timeout - no response from server');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[VideoCallStore] Failed to join room:', errorMessage);
      set({error: errorMessage, isLoading: false});
      throw err;
    }
  },

  leaveRoom: () => {
    const {socket, currentRoom, localStream, cleanupMediaSoup} = get();

    if (socket && currentRoom) {
      socket.emit('leaveRoom', {roomId: currentRoom.id});
    }

    cleanupMediaSoup();

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    set({
      currentRoom: null,
      participants: [],
      isConnected: false,
      localStream: null,
      chatMessages: [],
    });
  },

  initializeMedia: async () => {
    try {
      console.log('[VideoCallStore] 🎥 Initializing media devices...');

      // Request permissions first
      await get().requestPermissions();

      const stream = await mediaSoupClientService.getUserMedia({
        video: config.videoCall.defaultVideoConstraints,
        audio: config.videoCall.defaultAudioConstraints,
      });

      console.log('[VideoCallStore] ✅ Media stream obtained:', stream.id);

      set({localStream: stream, error: null});
      return stream;
    } catch (err) {
      console.error('[VideoCallStore] Media initialization error:', err);
      const error = `Failed to access camera/microphone: ${err instanceof Error ? err.message : String(err)}`;
      set({error, localStream: null});
      throw new Error(error);
    }
  },

  toggleAudio: () => {
    const {localStream, isAudioEnabled} = get();
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      set({isAudioEnabled: !isAudioEnabled});
    }
  },

  toggleVideo: () => {
    const {localStream, isVideoEnabled} = get();
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      set({isVideoEnabled: !isVideoEnabled});
    }
  },

  toggleScreenShare: () => {
    // Screen sharing implementation for mobile
    console.log('[VideoCallStore] Screen sharing not yet implemented for mobile');
  },

  toggleHandRaise: () => {
    const {isHandRaised} = get();
    set({isHandRaised: !isHandRaised});
  },

  sendMessage: (message: string) => {
    const {socket, currentRoom} = get();
    if (socket && currentRoom) {
      socket.emit('sendMessage', {roomId: currentRoom.id, message});
    }
  },

  setError: (error: string | null) => {
    set({error});
  },

  clearError: () => {
    set({error: null});
  },

  resetStore: () => {
    const {cleanupMediaSoup} = get();
    cleanupMediaSoup();

    set({
      socket: null,
      isSocketConnected: false,
      isConnected: false,
      connectionStatus: 'disconnected',
      currentRoom: null,
      participants: [],
      isAudioEnabled: true,
      isVideoEnabled: true,
      isScreenSharing: false,
      isHandRaised: false,
      chatMessages: [],
      localStream: null,
      screenStream: null,
      selfParticipantId: null,
      isMediaSoupInitialized: false,
      rtpCapabilities: null,
      sendTransport: null,
      recvTransport: null,
      audioProducer: null,
      videoProducer: null,
      screenProducer: null,
      remoteStreams: new Map(),
      isLoading: false,
      error: null,
      isBackgroundMode: false,
      orientation: 'portrait',
    });
  },

  // Mobile-specific actions
  requestPermissions: async () => {
    try {
      const cameraPermission = await request(
        Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA,
      );
      const microphonePermission = await request(
        Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO,
      );

      set(state => ({
        deviceInfo: {
          ...state.deviceInfo,
          cameraPermission: cameraPermission === RESULTS.GRANTED ? 'granted' : 'denied',
          microphonePermission: microphonePermission === RESULTS.GRANTED ? 'granted' : 'denied',
        },
      }));

      if (cameraPermission !== RESULTS.GRANTED || microphonePermission !== RESULTS.GRANTED) {
        Alert.alert(
          'Permissions Required',
          'Camera and microphone permissions are required for video calling.',
          [{text: 'OK'}],
        );
      }
    } catch (error) {
      console.error('[VideoCallStore] Permission request failed:', error);
    }
  },

  checkDeviceCapabilities: async () => {
    try {
      const devices = await mediaSoupClientService.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      const hasMicrophone = devices.some(device => device.kind === 'audioinput');

      set(state => ({
        deviceInfo: {
          ...state.deviceInfo,
          hasCamera,
          hasMicrophone,
        },
      }));
    } catch (error) {
      console.error('[VideoCallStore] Device capability check failed:', error);
    }
  },

  handleBackgroundMode: (isBackground: boolean) => {
    set({isBackgroundMode: isBackground});

    if (isBackground) {
      // Pause video when going to background
      const {localStream} = get();
      if (localStream) {
        localStream.getVideoTracks().forEach(track => {
          track.enabled = false;
        });
      }
    } else {
      // Resume video when coming back to foreground
      const {localStream, isVideoEnabled} = get();
      if (localStream && isVideoEnabled) {
        localStream.getVideoTracks().forEach(track => {
          track.enabled = true;
        });
      }
    }
  },

  setOrientation: (orientation: 'portrait' | 'landscape') => {
    set({orientation});
  },

  // MediaSoup Actions (simplified for mobile)
  initializeMediaSoup: async () => {
    try {
      console.log('[VideoCallStore] Initializing MediaSoup...');
      await mediaSoupClientService.loadDevice();
      set({isMediaSoupInitialized: true});
    } catch (error) {
      console.error('[VideoCallStore] MediaSoup initialization failed:', error);
      throw error;
    }
  },

  createTransports: async () => {
    try {
      console.log('[VideoCallStore] Creating transports...');
      await mediaSoupClientService.createTransports();
    } catch (error) {
      console.error('[VideoCallStore] Transport creation failed:', error);
      throw error;
    }
  },

  startProducing: async () => {
    try {
      console.log('[VideoCallStore] Starting to produce media...');
      const {localStream} = get();
      if (localStream) {
        await mediaSoupClientService.startProducing(localStream);
      }
    } catch (error) {
      console.error('[VideoCallStore] Media production failed:', error);
      throw error;
    }
  },

  stopProducing: async () => {
    try {
      console.log('[VideoCallStore] Stopping media production...');
      await mediaSoupClientService.stopProducing();
    } catch (error) {
      console.error('[VideoCallStore] Stop production failed:', error);
    }
  },

  consumeMedia: async (producerId: string, participantId: string) => {
    try {
      console.log(`[VideoCallStore] Consuming media from ${participantId}:${producerId}`);
      const stream = await mediaSoupClientService.consumeMedia(producerId, participantId);

      if (stream) {
        const {remoteStreams} = get();
        const newRemoteStreams = new Map(remoteStreams);
        newRemoteStreams.set(`${participantId}:${producerId}`, stream);
        set({remoteStreams: newRemoteStreams});
      }
    } catch (error) {
      console.error(`[VideoCallStore] Failed to consume media from ${participantId}:`, error);
    }
  },

  cleanupMediaSoup: () => {
    console.log('[VideoCallStore] Cleaning up MediaSoup resources...');
    mediaSoupClientService.cleanup();

    set({
      isMediaSoupInitialized: false,
      rtpCapabilities: null,
      sendTransport: null,
      recvTransport: null,
      audioProducer: null,
      videoProducer: null,
      screenProducer: null,
      remoteStreams: new Map(),
    });
  },
}));
