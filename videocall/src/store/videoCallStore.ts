"use client";

import config from "@/lib/config";
import { clearSessionData, setJoiningState } from "@/lib/storage";
import type {
    ChatMessage,
    ClientToServerEvents,
    Participant,
    Room,
    RtpCapabilities,
    ServerToClientEvents,
} from "@/types";
import { io, Socket } from "socket.io-client";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import mediaSoupClientService, { ConsumeParams } from "../services/mediaSoupClientService";

interface VideoCallState {
  // Connection State
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isSocketConnected: boolean;
  isConnected: boolean;
  connectionStatus: "disconnected" | "connecting" | "connected" | "failed";

  // Room State
  currentRoom: Room | null;
  participants: Participant[];
  // Track the local participant id to avoid adding self via participantJoined broadcasts
  selfParticipantId: string | null;

  // Media State
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
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
  // Combined streams: both audio and video tracks in one stream per participant
  remoteStreams: Map<string, MediaStream>; // participantId -> combined stream

  // UI State
  isLoading: boolean;
  error: string | null;
  messages: ChatMessage[];
  isMeetingSwitched: boolean;
  meetingSwitchedTimestamp: number | null;

  // Actions
  connect: (serverUrl?: string) => void;
  disconnect: () => void;
  joinRoom: (
    roomId: string,
    participant: { name: string; email?: string }
  ) => Promise<void>;
  leaveRoom: () => void;
  endMeeting: () => void;
  initializeMedia: () => Promise<MediaStream>;
  initializeMediaWithFallback: () => Promise<MediaStream>;
  retryMediaAccess: () => Promise<void>;
  checkDeviceAvailability: () => Promise<{
    hasVideo: boolean;
    hasAudio: boolean;
    devices: MediaDeviceInfo[];
  }>;
  initializeDeviceMonitoring: () => void;
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => void;
  toggleHandRaise: () => void;
  sendMessage: (message: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetStore: () => void;
  retry: () => void;
  setMeetingSwitched: (timestamp: number) => void;
  clearMeetingSwitched: () => void;

  // MediaSoup Actions
  initializeMediaSoup: () => Promise<void>;
  createTransports: () => Promise<void>;
  startProducing: () => Promise<void>;
  stopProducing: () => Promise<void>;
  consumeMedia: (producerId: string, participantId: string) => Promise<void>;
  cleanupMediaSoup: () => void;
}

export const useVideoCallStore = create<VideoCallState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    socket: null,
    isSocketConnected: false,
    isConnected: false,
    connectionStatus: "disconnected",
    currentRoom: null,
    participants: [],
  selfParticipantId: null,
    isAudioEnabled: true,
    isVideoEnabled: true,
    isScreenSharing: false,
    isHandRaised: false,
    localStream: null,
    screenStream: null,
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
    messages: [],
    isMeetingSwitched: false,
    meetingSwitchedTimestamp: null,

    // Actions
    connect: (serverUrl?: string) => {
      const { socket: existingSocket } = get();

      // Don't create multiple connections
      if (existingSocket && existingSocket.connected) {
        console.log("[VideoCallStore] Already connected");
        return;
      }

      console.log("[VideoCallStore] Connecting to server...");
      set({ connectionStatus: "connecting", error: null });

      const socketUrl = serverUrl || config.socketUrl;
      const socket = io(socketUrl, {
        // Apply optimized Socket.IO v4+ configuration
        transports: config.socket.transports,
        timeout: config.socket.timeout,
        reconnectionAttempts: config.socket.reconnectionAttempts,
        reconnectionDelay: config.socket.reconnectionDelay,
        reconnectionDelayMax: config.socket.reconnectionDelayMax,
        randomizationFactor: config.socket.randomizationFactor,
        autoConnect: config.socket.autoConnect,
        upgrade: config.socket.upgrade,
        rememberUpgrade: config.socket.rememberUpgrade,
        forceNew: config.socket.forceNew,
        closeOnBeforeunload: config.socket.closeOnBeforeunload,
        upgradeTimeout: config.socket.upgradeTimeout,
        maxHttpBufferSize: config.socket.maxHttpBufferSize,
        
        // Additional headers for tunnel compatibility
        extraHeaders: {
          "ngrok-skip-browser-warning": "true",
          "x-socket-transport": "websocket-only",
        },
        
        // Enable connection state recovery for better reconnection
        connectionStateRecovery: {},
      });

      // Socket Event Listeners
      socket.on("connect", () => {
        console.log("[VideoCallStore] ✅ Connected - Socket ID:", socket.id);
        set({
          socket,
          isSocketConnected: true,
          connectionStatus: "connected",
          error: null,
        });

        // CRITICAL FIX: Provide socket to socketManager to prevent duplicate connections
        import("@/lib/socketManager").then(({ socketManager }) => {
          socketManager.setSocket(socket);
          console.log("[VideoCallStore] ✅ Provided socket to socketManager");
        });

        // CRITICAL: Test Socket.IO event system immediately
        console.log("[VideoCallStore] 🧪 Testing Socket.IO bidirectional communication...");
        
        // Test if events are working at all
        socket.emit("test-echo", { message: "Frontend test", timestamp: Date.now() }, (response: any) => {
          console.log("[VideoCallStore] 🎯 Echo test response:", response);
        });

        // DEBUG: Log all incoming events
        socket.onAny((eventName, ...args) => {
          console.log("[VideoCallStore] 🔔 Received event:", eventName, args);
        });
        
        // Initialize device monitoring
        get().initializeDeviceMonitoring();
      });

      socket.on("disconnect", (reason) => {
        console.log("[VideoCallStore] ❌ Disconnected - Reason:", reason);
        set({
          isSocketConnected: false,
          connectionStatus: "disconnected",
          isConnected: false,
        });

        if (reason === "io server disconnect") {
          set({ error: "Server disconnected" });
        }
      });

      socket.on("connect_error", (err) => {
        console.error("[VideoCallStore] ❌ Connection error:", err);
        set({
          connectionStatus: "failed",
          error: `Connection failed: ${err.message}`,
          isSocketConnected: false,
        });
      });

      // Room Events
      console.log("[VideoCallStore] 🔧 Setting up roomJoined event listener...");
      socket.on(
        "roomJoined",
        async (data: { room: Room; participant: Participant }) => {
          console.log("[VideoCallStore] 🎉 ROOMJOINED EVENT RECEIVED!");
          console.log("[VideoCallStore] 📋 Event data:", data);
          console.log(
            "[VideoCallStore] Successfully joined room:",
            data.room.id
          );

          // Clear joining state on successful join
          setJoiningState(false);

          // Clear retry count on successful join
          sessionStorage.removeItem("joinRetryCount");

          // Don't add current user to participants array - they're shown as local participant
          // Filter out current user from room participants if they exist
          const remoteParticipants =
            data.room.participants?.filter(
              (p) => p.id !== data.participant.id
            ) || [];

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
            console.log("[VideoCallStore] Initializing MediaSoup...");

            // Set participant info for MediaSoup service
            if (data.room?.id && data.participant?.name) {
              const participantEmail = data.participant?.email || `${data.participant.name}@videocall.local`;
              
              console.log("[VideoCallStore] Setting MediaSoup socket info:", {
                roomId: data.room.id,
                participantName: data.participant.name,
                participantEmail: participantEmail
              });
              mediaSoupClientService.setSocket(socket);
              
              // Verify the values were set correctly
              console.log("[VideoCallStore] Verifying MediaSoup service initialization...");
              // Give a moment for the values to be set
              await new Promise((resolve) => setTimeout(resolve, 100));
            } else {
              console.error("[VideoCallStore] Missing room or participant data:", {
                room: data.room,
                participant: data.participant
              });
              throw new Error("Missing room or participant data for MediaSoup initialization");
            }

            // Extended delay to ensure server-side participant mapping is complete
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Use the complete MediaSoup service for the entire workflow
            const { initializeMediaSoup } = get();
            await initializeMediaSoup();
            
            // CRITICAL: Create transports after MediaSoup initialization
            console.log("[VideoCallStore] Creating transports after MediaSoup initialization...");
            const { createTransports } = get();
            await createTransports();
            console.log("[VideoCallStore] ✅ Transports created successfully");
            
            // AGGRESSIVE DEBUGGING: Check media stream state
            const { localStream } = get();
            console.log("[VideoCallStore] 🔍 DEBUGGING - Current localStream state:", {
              hasLocalStream: !!localStream,
              streamId: localStream?.id,
              videoTracks: localStream?.getVideoTracks().length || 0,
              audioTracks: localStream?.getAudioTracks().length || 0
            });
            
            if (!localStream) {
              console.log("[VideoCallStore] 🚨 No local stream available - MediaSoup will work without local media");
              console.log("[VideoCallStore] ✅ Users can enable camera/microphone later via controls");
              // Continue without local media - MediaSoup transports work without immediate producers
            } else {
              console.log("[VideoCallStore] ✅ Local stream available, proceeding with media production");
            }

            // Start producing using the complete service (handles everything internally)
            const { localStream: finalLocalStream } = get();
            console.log("[VideoCallStore] 🔍 FINAL CHECK - About to produce media:", {
              hasLocalStream: !!finalLocalStream,
              streamId: finalLocalStream?.id,
              videoTracks: finalLocalStream?.getVideoTracks().length || 0,
              audioTracks: finalLocalStream?.getAudioTracks().length || 0
            });
            
            // CRITICAL FIX: Always try to start producing, even without immediate media
            // This ensures transports are ready and producers can be created later via toggleVideo/toggleAudio
            if (finalLocalStream) {
              console.log("[VideoCallStore] 🎬 Starting to produce media with complete service...");
              const { startProducing } = get();
              await startProducing();
              console.log("[VideoCallStore] ✅ Media production started");
            } else {
              console.log("[VideoCallStore] ⚠️ No media stream available - transports ready for later producer creation");
              console.log("[VideoCallStore] ✅ Users can enable camera/microphone via controls to create producers");
            }
            
            // CRITICAL: Set MediaSoup as initialized even without immediate media
            set({ isMediaSoupInitialized: true });

            console.log(
              "[VideoCallStore] ✅ MediaSoup initialization complete"
            );
          } catch (error) {
            console.error(
              "[VideoCallStore] ❌ MediaSoup initialization failed:",
              error
            );
            // Don't fail the room join for MediaSoup errors, just log them
          }
        }
      );

      // Handle duplicate connection detection
      socket.on(
        "duplicateConnection",
        (data: { message: string; newSocketId: string }) => {
          console.log(
            "[VideoCallStore] Duplicate connection detected:",
            data.message
          );

          // This means another tab is trying to join with the same user
          // We should switch this tab to show "meeting switched" page
          const currentRoom = get().currentRoom;

          if (currentRoom) {
            console.log(
              "[VideoCallStore] Triggering meeting switch to new tab"
            );

            // Set the meeting switched state to show the switched page
            set({
              isMeetingSwitched: true,
              meetingSwitchedTimestamp: Date.now(),
              isLoading: false,
              error: null,
            });

            // Navigate to the switched page
            if (typeof window !== "undefined") {
              window.location.href = `/meeting/${currentRoom.id}/switched`;
            }
          } else {
            // Fallback error message if no room info
            set({
              error: "Another tab is joining this meeting with your account.",
              isLoading: false,
            });
          }

          setJoiningState(false);
        }
      );

      // Handle connection rejection
      socket.on(
        "connectionRejected",
        (data: {
          reason: string;
          message: string;
          existingSession?: { joinedAt: number; socketId: string };
        }) => {
          console.log(
            "[VideoCallStore] Connection rejected:",
            data.reason,
            data.message
          );
          set({
            error: data.message,
            isLoading: false,
          });
          setJoiningState(false);
        }
      );

      socket.on("participantJoined", (data: { participant: Participant }) => {
        console.log(
          "[VideoCallStore] 🎉 Participant joined event received:",
          data.participant.name,
          "ID:", data.participant.id
        );
        const selfId = get().selfParticipantId;
        if (selfId && data.participant.id === selfId) {
          console.log("[VideoCallStore] Ignoring participantJoined for self participant", selfId);
          return;
        }
        console.log("[VideoCallStore] 📊 Current participants before adding:", get().participants.length, get().participants.map(p => p.name));
        set((state) => ({
          participants: [...state.participants, data.participant],
        }));
        console.log("[VideoCallStore] 📊 Current participants after adding:", get().participants.length, get().participants.map(p => p.name));
      });

      socket.on("participantLeft", (data: { participantId: string }) => {
        console.log("[VideoCallStore] Participant left:", data.participantId);
        set((state) => ({
          participants: state.participants.filter(
            (p) => p.id !== data.participantId
          ),
        }));
      });

      socket.on("roomEnded", (data: { roomId: string; reason: string }) => {
        console.log(
          "[VideoCallStore] Room ended:",
          data.roomId,
          "Reason:",
          data.reason
        );

        // Clear session data
        clearSessionData();

        // Reset state
        set({
          currentRoom: null,
          participants: [],
          isConnected: false,
          connectionStatus: "disconnected",
          error: `Meeting ended: ${data.reason}`,
          isLoading: false,
        });

        // Stop local media streams
        const { localStream, screenStream } = get();
        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop());
        }
        if (screenStream) {
          screenStream.getTracks().forEach((track) => track.stop());
        }

        // Disconnect socket
        socket.disconnect();

        // Redirect to home page after a short delay to show the message
        setTimeout(() => {
          window.location.href = "/";
        }, 3000);
      });

      socket.on("error", (data: { message: string }) => {
        console.error("[VideoCallStore] Server error:", data.message);
        const { isLoading } = get();

        // Handle specific error cases for "already connected" scenarios
        if (
          data.message.includes("already exists in this room") ||
          data.message.includes("already connected")
        ) {
          console.log("[VideoCallStore] User already connected error detected");

          // Clear session data to prevent stale state
          clearSessionData();

          // Only do automatic recovery if this is clearly a refresh scenario
          const hasJoinParams = sessionStorage.getItem("lastJoinParams");
          const isManualRetry =
            sessionStorage.getItem("manualRetryInProgress") === "true";

          if (!hasJoinParams || isManualRetry) {
            console.log(
              "[VideoCallStore] Not a refresh scenario or manual retry, showing error"
            );
            sessionStorage.removeItem("manualRetryInProgress");
            setJoiningState(false);
            set({
              error:
                "Connection conflict detected. Please click 'Retry Connection' to rejoin the meeting.",
              isLoading: false,
            });
            return;
          }

          // Check retry count for automatic recovery
          const retryCount = parseInt(
            sessionStorage.getItem("joinRetryCount") || "0"
          );
          if (retryCount >= 1) {
            // Reduced from 2 to 1 attempt
            console.log(
              "[VideoCallStore] Max auto-retries exceeded, showing manual retry option"
            );
            setJoiningState(false);
            sessionStorage.removeItem("joinRetryCount");
            set({
              error:
                "Connection conflict detected. Please click 'Retry Connection' to rejoin the meeting.",
              isLoading: false,
            });
            return;
          }

          // Increment retry count
          sessionStorage.setItem("joinRetryCount", (retryCount + 1).toString());

          console.log(
            `[VideoCallStore] Attempting automatic recovery (attempt ${
              retryCount + 1
            }/2)`
          );

          // Clear joining state temporarily
          setJoiningState(false);

          // Extract room ID from the current URL or use a fallback
          const roomId = window.location.pathname.split("/").pop() || "unknown";

          // Emit leave to clean up server state, then retry join immediately
          socket.emit("leaveRoom", { roomId });

          // Wait a brief moment for server cleanup, then retry the join
          setTimeout(() => {
            console.log("[VideoCallStore] Retrying join after cleanup");

            // Get current state to retry with same parameters
            const params = sessionStorage.getItem("lastJoinParams");
            if (params) {
              try {
                const { roomId: retryRoomId, participant } = JSON.parse(params);

                // Ensure we're not in a loading state before retry
                set({ isLoading: false, error: null });

                // Small delay to ensure state is clean
                setTimeout(() => {
                  // Retry the join
                  get().joinRoom(retryRoomId, participant);
                }, 100);
              } catch (e) {
                console.error("Failed to parse join params:", e);
                sessionStorage.removeItem("joinRetryCount");
                set({
                  error: "Connection issue detected. Please try joining again.",
                  isLoading: false,
                });
              }
            } else {
              sessionStorage.removeItem("joinRetryCount");
              set({
                error: "Connection issue detected. Please try joining again.",
                isLoading: false,
              });
            }
          }, 1000); // Increased delay to 1 second

          return;
        }

        const errorMessage = data.message;

        if (isLoading) {
          // This is likely a joinRoom error - clear joining state
          setJoiningState(false);
          set({ error: errorMessage, isLoading: false });
        } else {
          // General error
          set({ error: errorMessage });
        }
      });

      // Chat Events
      socket.on("messageReceived", (data: { message: ChatMessage }) => {
        console.log("[VideoCallStore] Message received:", data.message);
        set((state) => ({
          messages: [...state.messages, data.message],
        }));
      });

      // MediaSoup Events
      socket.on(
        "newProducer",
        (data: { producerId: string; participantId: string; kind: string; isScreenShare?: boolean }) => {
          console.log(
            `[VideoCallStore] 🎬 New producer event received from ${data.participantId}: ${data.producerId} (${data.kind})${data.isScreenShare ? ' [SCREEN SHARE]' : ''}`
          );
          console.log("[VideoCallStore] 🔄 Starting consumeMedia for producer:", data.producerId);
          console.log("[VideoCallStore] 📊 Current streams before consume:", {
            combinedStreams: get().remoteStreams.size
          });
          
          // Auto-consume the new producer
          const { consumeMedia } = get();
          try {
            consumeMedia(data.producerId, data.participantId);
          } catch (error) {
            console.error(
              "[VideoCallStore] ❌ Failed to consume new producer:",
              error
            );
          }
        }
      );

      socket.on(
        "producerClosed",
        (data: { producerId: string; participantId: string; kind?: string }) => {
          console.log(
            `[VideoCallStore] Producer closed from ${data.participantId}: ${data.producerId}`
          );
          
          // Clean up combined stream for the participant when any producer closes
          const { remoteStreams } = get();
          const streamKey = data.participantId; // Use participantId only
          
          const combinedStream = remoteStreams.get(streamKey);
          if (combinedStream) {
            console.log(`[VideoCallStore] Cleaning up combined stream for ${data.participantId}`);
            
            // Remove the specific track type if kind is specified
            if (data.kind === 'audio' || data.kind === 'video') {
              const tracksToRemove = combinedStream.getTracks().filter(track => track.kind === data.kind);
              tracksToRemove.forEach(track => {
                combinedStream.removeTrack(track);
                track.stop();
              });
              
              // If stream has no tracks left, remove it entirely
              if (combinedStream.getTracks().length === 0) {
                const newStreams = new Map(remoteStreams);
                newStreams.delete(streamKey);
                set({ remoteStreams: newStreams });
              }
            } else {
              // If kind is unknown, remove entire combined stream
              const newStreams = new Map(remoteStreams);
              newStreams.delete(streamKey);
              set({ remoteStreams: newStreams });
            }
          }
        }
      );

      // Consumer Events (MediaSoup demo pattern)
      socket.on("consumerPaused", (data: { consumerId: string }) => {
        console.log(`[VideoCallStore] 🔇 Consumer paused: ${data.consumerId}`);
        // Note: Client-side consumer pause handling could be added here
      });

      socket.on("consumerResumed", (data: { consumerId: string }) => {
        console.log(`[VideoCallStore] 🔊 Consumer resumed: ${data.consumerId}`);
        // Note: Client-side consumer resume handling could be added here
      });

      socket.on("consumerClosed", (data: { consumerId: string; participantId?: string }) => {
        console.log(`[VideoCallStore] 🔴 Consumer closed: ${data.consumerId}`);
        
        // If participantId is provided, clean up the specific consumer's track
        if (data.participantId) {
          const { remoteStreams } = get();
          const combinedStream = remoteStreams.get(data.participantId);
          
          if (combinedStream) {
            console.log(`[VideoCallStore] Cleaning up tracks for closed consumer: ${data.consumerId}`);
            
            // For now, we don't have a direct way to identify which track belongs to which consumer
            // This could be enhanced by storing consumer-to-track mappings
            // For simplicity, we'll rely on producerClosed events to handle track cleanup
          }
        }
      });

      // Screen Sharing Events
      socket.on(
        "screenShareStarted",
        (data: { participantId: string; participantName: string }) => {
          console.log(
            `[VideoCallStore] 📺 Screen sharing started by ${data.participantName} (${data.participantId})`
          );
          
          // Update participant screen sharing status
          set((state) => ({
            participants: state.participants.map((p) =>
              p.id === data.participantId
                ? { ...p, isScreenSharing: true }
                : { ...p, isScreenSharing: false } // Only one person can share at a time
            ),
          }));
        }
      );

      socket.on(
        "screenShareStopped",
        (data: { participantId: string }) => {
          console.log(
            `[VideoCallStore] 📺 Screen sharing stopped by participant ${data.participantId}`
          );
          
          // Update participant screen sharing status
          set((state) => ({
            participants: state.participants.map((p) =>
              p.id === data.participantId
                ? { ...p, isScreenSharing: false }
                : p
            ),
          }));
        }
      );

      // Audio/Video Toggle Events
      socket.on(
        "participantAudioToggled",
        (data: { participantId: string; isEnabled: boolean }) => {
          console.log(
            `[VideoCallStore] 🎤 Audio toggled for ${data.participantId}: ${data.isEnabled ? 'ON' : 'OFF'}`
          );
          
          set((state) => ({
            participants: state.participants.map((p) =>
              p.id === data.participantId
                ? { ...p, isAudioEnabled: data.isEnabled }
                : p
            ),
          }));
        }
      );

      socket.on(
        "participantVideoToggled",
        (data: { participantId: string; isEnabled: boolean }) => {
          console.log(
            `[VideoCallStore] 📹 Video toggled for ${data.participantId}: ${data.isEnabled ? 'ON' : 'OFF'}`
          );
          
          set((state) => ({
            participants: state.participants.map((p) =>
              p.id === data.participantId
                ? { ...p, isVideoEnabled: data.isEnabled }
                : p
            ),
          }));
        }
      );

      // Set the socket in state
      set({ socket });
    },

    disconnect: () => {
      const { socket } = get();
      if (socket) {
        console.log("[VideoCallStore] Disconnecting socket");
        socket.disconnect();
      }
      set({
        socket: null,
        isSocketConnected: false,
        connectionStatus: "disconnected",
      });
    },

    joinRoom: async (
      roomId: string,
      participant: { name: string; email?: string }
    ) => {
      const { socket, isSocketConnected, isConnected, currentRoom } = get();

      console.log("[VideoCallStore] 🚪 ATTEMPTING TO JOIN ROOM:");
      console.log("  🔍 Room ID:", roomId);
      console.log("  🔍 Socket ID:", socket?.id);
      console.log("  👤 Participant:", participant);
      console.log("  📊 Current State:", { isSocketConnected, isConnected, currentRoomId: currentRoom?.id });

      // Store join parameters for potential retry
      sessionStorage.setItem(
        "lastJoinParams",
        JSON.stringify({ roomId, participant })
      );

      // Check if already connected to this room
      if (isConnected && currentRoom?.id === roomId) {
        console.log(
          "[VideoCallStore] Already connected to this room, skipping join"
        );
        set({ isLoading: false, error: null });
        return;
      }

      // Mark as joining to prevent duplicate attempts
      setJoiningState(true);

      set({ isLoading: true, error: null });

      try {
        // Ensure socket is connected
        if (!socket || !isSocketConnected) {
          throw new Error(
            "Socket not connected. Please wait for connection and try again."
          );
        }

        // Try to initialize media, but don't block room joining if it fails
        try {
          await get().initializeMedia();
          console.log("[VideoCallStore] Media initialized successfully");
        } catch (mediaError) {
          console.warn(
            "[VideoCallStore] Media initialization failed, continuing anyway:",
            mediaError
          );

          // CRITICAL: Don't block room joining for any media errors
          // MediaSoup can work without local media initially - users can enable later
          console.warn(
            "[VideoCallStore] ⚠️ Continuing room join without media - users can enable camera/mic later"
          );
          set({ error: null }); // Clear the error and continue
        }

        console.log(
          "[VideoCallStore] Joining room:",
          roomId,
          "as:",
          participant.name
        );

        // Simple emit without complex promise handling
        // The roomJoined event will be handled by the main listener which updates the state
        console.log("[VideoCallStore] Emitting joinRoom event");
        socket.emit("joinRoom", {
          roomId,
          participantName: participant.name,
          userEmail: participant.email, // Include email for duplicate user detection
        });

        // Set current room in socket manager for graceful disconnect
        import("@/lib/socketManager").then(({ socketManager }) => {
          socketManager.setCurrentRoom(roomId);
        });

        console.log(
          "[VideoCallStore] Join room event emitted, waiting for response..."
        );

        // Wait for the state to update via the main event listeners
        // We'll use a simple timeout approach
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds total

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 100)); // Wait 100ms
          const { isConnected, error } = get();

          if (isConnected) {
            console.log("[VideoCallStore] Successfully joined room!");
            return;
          }

          if (error) {
            throw new Error(error);
          }

          attempts++;
        }

        throw new Error("Join room timeout - no response from server");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error("[VideoCallStore] Failed to join room:", errorMessage);

        // Clear joining state on any error
        setJoiningState(false);

        set({ error: errorMessage, isLoading: false });
        throw err;
      } finally {
        // Always clear joining state when function exits
        setJoiningState(false);
      }
    },

    leaveRoom: () => {
      const { socket, currentRoom, localStream, cleanupMediaSoup } = get();

      if (socket && currentRoom) {
        socket.emit("leaveRoom", { roomId: currentRoom.id });
      }

      // Clean up MediaSoup resources
      cleanupMediaSoup();

      // Clear current room in socket manager
      import("@/lib/socketManager").then(({ socketManager }) => {
        socketManager.setCurrentRoom(null);
      });

      // Stop local stream
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      // Clear joining state
      setJoiningState(false);

      set({
        currentRoom: null,
        participants: [],
        isConnected: false,
        localStream: null,
        messages: [],
      });
    },

    endMeeting: () => {
      const { socket, currentRoom, localStream, screenStream, participants } =
        get();

      if (socket && currentRoom) {
        // Only allow the host/first participant to end the meeting for everyone
        const currentParticipant = participants.find(
          (p) => p.name === sessionStorage.getItem("participantName")
        );
        if (currentParticipant?.isHost || participants.length <= 1) {
          console.log("[VideoCallStore] Ending meeting for everyone");
          // For now, we'll implement this as leave room - in future we could add a specific endMeeting socket event
          socket.emit("leaveRoom", { roomId: currentRoom.id });
        } else {
          // Non-host users just leave the meeting
          console.log("[VideoCallStore] Leaving meeting (non-host)");
          socket.emit("leaveRoom", { roomId: currentRoom.id });
        }
      }

      // Stop all media streams
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }

      // Clear session data
      clearSessionData();
      setJoiningState(false);

      set({
        currentRoom: null,
        participants: [],
        isConnected: false,
        localStream: null,
        screenStream: null,
        messages: [],
        isScreenSharing: false,
        isHandRaised: false,
      });

      // Redirect to home
      window.location.href = "/";
    },

    initializeMedia: async () => {
      try {
        console.log("[VideoCallStore] 🎥 Initializing media devices...");

        // First, check if media devices are available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Media devices not supported in this browser");
        }

        console.log("[VideoCallStore] 🔍 Media devices API available, checking devices...");

        // Get available devices first
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        const audioDevices = devices.filter(
          (device) => device.kind === "audioinput"
        );

        console.log(
          `[VideoCallStore] 📹 Found ${videoDevices.length} video devices, 🎤 ${audioDevices.length} audio devices`
        );
        console.log("[VideoCallStore] 🔍 Device details:", {
          videoDevices: videoDevices.map(d => ({ label: d.label, deviceId: d.deviceId })),
          audioDevices: audioDevices.map(d => ({ label: d.label, deviceId: d.deviceId }))
        });

        console.log("[VideoCallStore] 🚀 Requesting user media with constraints:", {
          video: config.videoCall.defaultVideoConstraints,
          audio: config.videoCall.defaultAudioConstraints,
        });

        let stream: MediaStream;
        
        try {
          // Try with full constraints first
          stream = await navigator.mediaDevices.getUserMedia({
            video: config.videoCall.defaultVideoConstraints,
            audio: config.videoCall.defaultAudioConstraints,
          });
        } catch (error) {
          console.log("[VideoCallStore] ⚠️ Full constraints failed, trying basic constraints:", error);
          
          try {
            // Fallback to basic constraints
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
          } catch (basicError) {
            console.log("[VideoCallStore] ⚠️ Basic constraints failed, trying audio only:", basicError);
            
            try {
              // Fallback to audio only
              stream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: true,
              });
            } catch (audioError) {
              console.error("[VideoCallStore] ❌ All media access attempts failed:", audioError);
              const errorMessage = audioError instanceof Error ? audioError.message : String(audioError);
              throw new Error(`Media access denied: ${errorMessage}`);
            }
          }
        }

        console.log("[VideoCallStore] ✅ Media stream obtained successfully:", {
          streamId: stream.id,
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length,
          videoTrackSettings: stream.getVideoTracks()[0]?.getSettings(),
          audioTrackSettings: stream.getAudioTracks()[0]?.getSettings()
        });
        
        set({ localStream: stream, error: null });
        return stream;
      } catch (err) {
        console.error("[VideoCallStore] Media initialization error:", err);

        let errorMessage = "Unknown error";
        let userFriendlyMessage = "Failed to access camera/microphone";
        let suggestedAction = "";

        if (err instanceof Error) {
          errorMessage = err.message;

          // Handle specific error types
          if (
            err.name === "NotAllowedError" ||
            err.name === "PermissionDeniedError"
          ) {
            userFriendlyMessage = "Camera/microphone access denied";
            suggestedAction =
              "Please allow camera and microphone permissions and refresh the page";
          } else if (
            err.name === "NotFoundError" ||
            err.name === "DevicesNotFoundError"
          ) {
            userFriendlyMessage = "No camera or microphone found";
            suggestedAction =
              "Please connect a camera and microphone and try again";
          } else if (
            err.name === "NotReadableError" ||
            err.name === "TrackStartError"
          ) {
            userFriendlyMessage = "Camera or microphone is already in use";
            suggestedAction =
              "Close other browser tabs or applications using your camera/microphone, then try again";

            // Mark this as a device-in-use error to prevent joining
            const error = `DEVICE_IN_USE: ${userFriendlyMessage}. ${suggestedAction}`;
            set({ error, localStream: null });
            throw new Error(error);
          } else if (
            err.name === "OverconstrainedError" ||
            err.name === "ConstraintNotSatisfiedError"
          ) {
            userFriendlyMessage = "Camera/microphone settings not supported";
            suggestedAction =
              "Your device doesn't support the required settings. Trying with fallback options...";

            // Try with fallback constraints
            console.log("[VideoCallStore] Trying with fallback constraints...");
            return await get().initializeMediaWithFallback();
          } else if (err.name === "NotSupportedError") {
            userFriendlyMessage = "Camera/microphone not supported";
            suggestedAction =
              "Your browser or device doesn't support video calling";
          } else if (err.name === "AbortError") {
            userFriendlyMessage = "Media access was interrupted";
            suggestedAction = "Please try again";
          }
        }

        const error = `${userFriendlyMessage}: ${errorMessage}${
          suggestedAction ? ". " + suggestedAction : ""
        }`;
        set({ error, localStream: null });
        throw new Error(error);
      }
    },

    initializeMediaWithFallback: async () => {
      console.log("[VideoCallStore] Trying fallback media constraints...");

      const fallbackConstraints = [
        // Try audio-only first
        { audio: true, video: false },
        // Try basic video with lower quality
        {
          audio: true,
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            frameRate: { ideal: 15 },
          },
        },
        // Try basic constraints
        { audio: true, video: true },
        // Last resort - audio only
        { audio: true, video: false },
      ];

      for (let i = 0; i < fallbackConstraints.length; i++) {
        try {
          console.log(
            `[VideoCallStore] Trying fallback option ${i + 1}/${
              fallbackConstraints.length
            }`
          );
          const stream = await navigator.mediaDevices.getUserMedia(
            fallbackConstraints[i]
          );

          const hasVideo = stream.getVideoTracks().length > 0;
          const hasAudio = stream.getAudioTracks().length > 0;

          console.log(
            `[VideoCallStore] Fallback success - Video: ${hasVideo}, Audio: ${hasAudio}`
          );

          set({
            localStream: stream,
            error: null,
            isVideoEnabled: hasVideo,
            isAudioEnabled: hasAudio,
          });

          if (!hasVideo) {
            set({ error: "Video not available - using audio only mode" });
          }

          return stream;
        } catch (fallbackErr) {
          console.log(
            `[VideoCallStore] Fallback option ${i + 1} failed:`,
            fallbackErr
          );
          continue;
        }
      }

      // If all fallback options fail
      const error =
        "Unable to access any media devices. Please check your camera and microphone connections.";
      set({ error, localStream: null });
      throw new Error(error);
    },

    retryMediaAccess: async () => {
      console.log("[VideoCallStore] Retrying media access...");
      try {
        const deviceInfo = await get().checkDeviceAvailability();
        console.log("[VideoCallStore] Device availability:", deviceInfo);

        if (!deviceInfo.hasVideo && !deviceInfo.hasAudio) {
          throw new Error("No audio or video devices available");
        }

        // Try to initialize media again
        await get().initializeMedia();
        console.log("[VideoCallStore] Media access retry successful");
      } catch (err) {
        console.error("[VideoCallStore] Media access retry failed:", err);
        throw err;
      }
    },

    checkDeviceAvailability: async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput" && device.deviceId
        );
        const audioDevices = devices.filter(
          (device) => device.kind === "audioinput" && device.deviceId
        );

        return {
          hasVideo: videoDevices.length > 0,
          hasAudio: audioDevices.length > 0,
          devices: devices,
        };
      } catch (err) {
        console.error(
          "[VideoCallStore] Failed to check device availability:",
          err
        );
        return {
          hasVideo: false,
          hasAudio: false,
          devices: [],
        };
      }
    },

    initializeDeviceMonitoring: () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.addEventListener) {
        console.log("[VideoCallStore] Device monitoring not supported");
        return;
      }

      console.log("[VideoCallStore] Initializing device monitoring...");

      // Listen for device changes
      navigator.mediaDevices.addEventListener("devicechange", async () => {
        console.log("[VideoCallStore] Device change detected");

        try {
          const deviceInfo = await get().checkDeviceAvailability();
          console.log("[VideoCallStore] Updated device info:", deviceInfo);

          const { localStream } = get();

          // If we had a stream but lost devices, show error
          if (localStream && !deviceInfo.hasVideo && !deviceInfo.hasAudio) {
            set({
              error:
                "Camera and microphone were disconnected. Please reconnect your devices and refresh.",
              localStream: null,
              isVideoEnabled: false,
              isAudioEnabled: false,
            });
          }
          // If we didn't have video but now do, notify user
          else if (
            !localStream &&
            (deviceInfo.hasVideo || deviceInfo.hasAudio)
          ) {
            set({
              error:
                "New media devices detected. You can now retry accessing your camera/microphone.",
            });
          }
        } catch (err) {
          console.error("[VideoCallStore] Error handling device change:", err);
        }
      });
    },

    toggleAudio: async () => {
      const { localStream, socket, currentRoom, isAudioEnabled, isMediaSoupInitialized } = get();
      console.log(
        "[VideoCallStore] toggleAudio called, localStream:",
        !!localStream,
        "isAudioEnabled:", isAudioEnabled
      );

      try {
        // If no local stream, create one first
        if (!localStream) {
          console.log("[VideoCallStore] No local stream - creating media stream first");
          await get().initializeMedia();
          
          // Get updated state after media initialization
          const { localStream: newLocalStream } = get();
          if (!newLocalStream) {
            console.log("[VideoCallStore] Failed to create media stream");
            return;
          }
        }

        const { localStream: currentLocalStream } = get();
        const audioTrack = currentLocalStream?.getAudioTracks()[0];
        
        if (audioTrack) {
          const newEnabled = !isAudioEnabled;
          audioTrack.enabled = newEnabled;
          set({ isAudioEnabled: newEnabled });

          // CRITICAL FIX: Create producer if MediaSoup is initialized and we're enabling audio
          if (newEnabled && isMediaSoupInitialized && currentLocalStream) {
            console.log("[VideoCallStore] Audio enabled - ensuring producer exists");
            try {
              // Check if we already have an audio producer
              const { audioProducer } = get();
              if (!audioProducer) {
                console.log("[VideoCallStore] No audio producer - creating one");
                await mediaSoupClientService.startProducingAudio(currentLocalStream);
                
                // Update state with mock producer for compatibility
                set({ audioProducer: { id: "audio-producer" } });
                console.log("[VideoCallStore] ✅ Audio producer created successfully");
              } else {
                console.log("[VideoCallStore] Audio producer already exists");
              }
            } catch (error) {
              console.error("[VideoCallStore] Failed to create audio producer:", error);
            }
          }

          if (socket && currentRoom) {
            socket.emit("toggleAudio", {
              participantId: "current-user",
              isEnabled: newEnabled,
            });
          }

          console.log(
            `[VideoCallStore] Audio toggled: ${
              newEnabled ? "ON" : "OFF"
            }, track.enabled: ${audioTrack.enabled}`
          );
        } else {
          console.log("[VideoCallStore] No audio track found in stream");
        }
      } catch (error) {
        console.error("[VideoCallStore] Error in toggleAudio:", error);
      }
    },

    toggleVideo: async () => {
      const { localStream, socket, currentRoom, isVideoEnabled, isMediaSoupInitialized } = get();
      console.log(
        "[VideoCallStore] toggleVideo called, localStream:",
        !!localStream,
        "isVideoEnabled:", isVideoEnabled
      );

      try {
        // If no local stream, create one first
        if (!localStream) {
          console.log("[VideoCallStore] No local stream - creating media stream first");
          await get().initializeMedia();
          
          // Get updated state after media initialization
          const { localStream: newLocalStream } = get();
          if (!newLocalStream) {
            console.log("[VideoCallStore] Failed to create media stream");
            return;
          }
        }

        const { localStream: currentLocalStream } = get();
        const videoTrack = currentLocalStream?.getVideoTracks()[0];
        
        if (videoTrack) {
          const newEnabled = !isVideoEnabled;
          console.log(
            `[VideoCallStore] Setting video track enabled: ${newEnabled}`
          );

          videoTrack.enabled = newEnabled;
          set({ isVideoEnabled: newEnabled });

          // CRITICAL FIX: Create producer if MediaSoup is initialized and we're enabling video
          if (newEnabled && isMediaSoupInitialized && currentLocalStream) {
            console.log("[VideoCallStore] Video enabled - ensuring producer exists");
            try {
              // Check if we already have a video producer
              const { videoProducer } = get();
              if (!videoProducer) {
                console.log("[VideoCallStore] No video producer - creating one");
                await mediaSoupClientService.startProducingVideo(currentLocalStream);
                
                // Update state with mock producer for compatibility
                set({ videoProducer: { id: "video-producer" } });
                console.log("[VideoCallStore] ✅ Video producer created successfully");
              } else {
                console.log("[VideoCallStore] Video producer already exists");
              }
            } catch (error) {
              console.error("[VideoCallStore] Failed to create video producer:", error);
            }
          }

          // Emit to socket
          if (socket && currentRoom) {
            socket.emit("toggleVideo", {
              participantId: "current-user",
              isEnabled: newEnabled,
            });
          }

          console.log(
            `[VideoCallStore] Video toggled: ${
              newEnabled ? "ON" : "OFF"
            }, track.enabled: ${videoTrack.enabled}`
          );
        } else {
          console.log("[VideoCallStore] No video track found in stream");
        }
      } catch (error) {
        console.error("[VideoCallStore] Error in toggleVideo:", error);
      }
    },

    toggleScreenShare: async () => {
      const { isScreenSharing, socket, currentRoom, screenStream } = get();
      console.log(
        "[VideoCallStore] toggleScreenShare called, isScreenSharing:",
        isScreenSharing
      );

      if (!socket || !currentRoom) {
        console.log("[VideoCallStore] No socket or room available");
        return;
      }

      try {
        if (isScreenSharing) {
          // Stop screen sharing
          console.log("[VideoCallStore] Stopping screen share");

          if (screenStream) {
            screenStream.getTracks().forEach((track) => {
              track.stop();
            });
          }

          // Stop MediaSoup screen share production
          try {
            await mediaSoupClientService.stopProducingScreenShare();
          } catch (error) {
            console.error("[VideoCallStore] Failed to stop MediaSoup screen share:", error);
          }

          set({
            isScreenSharing: false,
            screenStream: null,
          });
          socket.emit("stopScreenShare", { participantId: "current-user" });

          console.log("[VideoCallStore] Screen sharing stopped");
        } else {
          // Start screen sharing
          console.log("[VideoCallStore] Starting screen share");

          // Simple constraints first (remove problematic enhanced ones)
          const constraints = {
            video: {
              width: { ideal: 1920, max: 1920 },
              height: { ideal: 1080, max: 1080 },
              frameRate: { ideal: 30, max: 30 },
            },
            audio: false, // Disable audio to avoid feedback
          };

          const newScreenStream = await navigator.mediaDevices.getDisplayMedia(
            constraints
          );

          console.log(
            "[VideoCallStore] Screen stream obtained:",
            newScreenStream.id
          );

          // Start MediaSoup screen share production
          try {
            await mediaSoupClientService.startProducingScreenShare(newScreenStream);
          } catch (error) {
            console.error("[VideoCallStore] Failed to start MediaSoup screen share:", error);
            // Clean up the stream if MediaSoup fails
            newScreenStream.getTracks().forEach(track => track.stop());
            throw error;
          }

          set({
            isScreenSharing: true,
            screenStream: newScreenStream,
          });
          socket.emit("startScreenShare", { participantId: "current-user" });

          // Handle when user stops sharing via browser UI
          newScreenStream.getVideoTracks()[0].onended = async () => {
            console.log("[VideoCallStore] Screen sharing ended by user");
            
            // Stop MediaSoup screen share production
            try {
              await mediaSoupClientService.stopProducingScreenShare();
            } catch (error) {
              console.error("[VideoCallStore] Failed to stop MediaSoup screen share on ended:", error);
            }
            
            set({
              isScreenSharing: false,
              screenStream: null,
            });
            socket.emit("stopScreenShare", { participantId: "current-user" });
          };

          console.log("[VideoCallStore] Screen sharing started");
        }
      } catch (err) {
        console.error("[VideoCallStore] Screen share error:", err);

        // Handle specific permission denied error
        if (err instanceof Error && err.message.includes("Permission denied")) {
          console.log(
            "[VideoCallStore] Screen sharing permission denied by user - silently clearing"
          );
          // Don't show error modal for user cancellation, just reset state
          set({
            isScreenSharing: false,
            screenStream: null,
            error: null,
          });
          return;
        }

        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        set({ error: `Failed to toggle screen share: ${errorMessage}` });
      }
    },

    toggleHandRaise: () => {
      const { isHandRaised, socket, currentRoom } = get();

      if (!socket || !currentRoom) return;

      const newState = !isHandRaised;
      set({ isHandRaised: newState });

      socket.emit("raiseHand", {
        participantId: "current-user",
        isRaised: newState,
      });
    },

    sendMessage: (message: string) => {
      const { socket, currentRoom } = get();

      console.log("[VideoCallStore] 💬 DEBUGGING - Send message called:", {
        hasSocket: !!socket,
        socketConnected: socket?.connected,
        hasCurrentRoom: !!currentRoom,
        roomId: currentRoom?.id,
        message: message,
        messageLength: message.length
      });

      if (!socket || !currentRoom || !message.trim()) {
        console.log("[VideoCallStore] ❌ Cannot send message - missing requirements:", {
          hasSocket: !!socket,
          hasCurrentRoom: !!currentRoom,
          hasMessage: !!message.trim()
        });
        return;
      }

      console.log("[VideoCallStore] 🚀 Emitting sendMessage event to backend:", {
        roomId: currentRoom.id,
        message: message.trim(),
      });

      socket.emit("sendMessage", {
        roomId: currentRoom.id,
        message: message.trim(),
      });
      
      console.log("[VideoCallStore] ✅ sendMessage event emitted successfully");
    },

    setError: (error: string | null) => set({ error }),

    clearError: () => set({ error: null }),

    resetStore: () => {
      const { socket, localStream } = get();

      // Clean up resources
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      if (socket) {
        socket.disconnect();
      }

      // Reset to initial state
      set({
        socket: null,
        isSocketConnected: false,
        isConnected: false,
        connectionStatus: "disconnected",
        currentRoom: null,
        participants: [],
        isAudioEnabled: true,
        isVideoEnabled: true,
        isScreenSharing: false,
        isHandRaised: false,
        localStream: null,
        isLoading: false,
        error: null,
        messages: [],
      });
    },

    retry: () => {
      console.log("[VideoCallStore] Retrying connection...");
      const { resetStore, connect } = get();
      resetStore();

      // Add a longer delay to allow backend cleanup
      setTimeout(() => {
        connect();
      }, 2000);
    },

    setMeetingSwitched: (timestamp: number) => {
      console.log(
        "[VideoCallStore] Meeting switched to new tab at:",
        timestamp
      );
      set({
        isMeetingSwitched: true,
        meetingSwitchedTimestamp: timestamp,
      });
    },

    clearMeetingSwitched: () => {
      console.log("[VideoCallStore] Clearing meeting switched state");
      set({
        isMeetingSwitched: false,
        meetingSwitchedTimestamp: null,
      });
    },

    // MediaSoup Actions
    initializeMediaSoup: async () => {
      const { socket } = get();
      if (!socket) {
        throw new Error("Socket not connected");
      }

      try {
        console.log("[VideoCallStore] Initializing MediaSoup...");

        // Get RTP capabilities from server with timeout
        const rtpCapabilities = await new Promise<RtpCapabilities>(
          (resolve, reject) => {
            // Set a timeout for the request
            const timeout = setTimeout(() => {
              reject(new Error("RTP capabilities request timeout"));
            }, 10000); // 10 second timeout

            console.log(
              "[VideoCallStore] Requesting RTP capabilities from server..."
            );

            socket.emit("getRtpCapabilities", (response: unknown) => {
              clearTimeout(timeout);
              console.log("[VideoCallStore] Received response:", response);

              // Handle direct RTP capabilities response
              if (
                response &&
                typeof response === "object" &&
                "codecs" in response
              ) {
                console.log("[VideoCallStore] ✅ Got direct RTP capabilities");
                resolve(response as RtpCapabilities);
                return;
              }

              // Handle wrapped response
              const res = response as {
                rtpCapabilities?: RtpCapabilities;
                error?: string;
              };

              if (res?.error) {
                console.error(
                  "[VideoCallStore] ❌ RTP capabilities error:",
                  res.error
                );
                reject(new Error(res.error));
              } else if (res?.rtpCapabilities) {
                console.log("[VideoCallStore] ✅ Got wrapped RTP capabilities");
                resolve(res.rtpCapabilities);
              } else {
                console.error(
                  "[VideoCallStore] ❌ Invalid response format:",
                  response
                );
                reject(new Error("No RTP capabilities received"));
              }
            });
          }
        );

        // Initialize MediaSoup device
        await mediaSoupClientService.initializeDevice(rtpCapabilities);

        // CRITICAL: Set socket reference in MediaSoup service
        mediaSoupClientService.setSocket(socket);
        console.log("[VideoCallStore] ✅ Socket set in MediaSoup service");

        set({
          isMediaSoupInitialized: true,
          rtpCapabilities,
        });

        console.log("[VideoCallStore] ✅ MediaSoup initialized successfully");
      } catch (error) {
        console.error(
          "[VideoCallStore] ❌ Failed to initialize MediaSoup:",
          error
        );
        throw error;
      }
    },

    createTransports: async () => {
      const { socket } = get();
      if (!socket) {
        throw new Error("Socket not connected");
      }

      try {
        console.log("[VideoCallStore] Creating MediaSoup transports...");
        
        // CRITICAL: Ensure socket is set in MediaSoup service before transport creation
        mediaSoupClientService.setSocket(socket);
        console.log("[VideoCallStore] 🔍 Socket reference set in MediaSoup service");
        
        // Use the complete MediaSoup service to create transports
        // This will handle both send and recv transports internally
        await mediaSoupClientService.createTransports();

        // Get the actual transport references from the service
        const sendTransport = mediaSoupClientService.getSendTransport();
        const recvTransport = mediaSoupClientService.getReceiveTransport();
        
        if (!sendTransport || !recvTransport) {
          throw new Error("Failed to create MediaSoup transports");
        }

        // Store actual transport references in state
        set({
          sendTransport,
          recvTransport,
        });

        console.log("[VideoCallStore] ✅ MediaSoup transports created successfully");
        // After transports created, request existing producers for late-joiners
        try {
          console.log('[VideoCallStore] Requesting existing producers from server...');
          const producers = await new Promise<any[]>((resolve, reject) => {
            const { socket } = get();
            (socket! as any).emit('getProducers', (response: any) => {
              if (response?.error) return reject(new Error(response.error));
              resolve(response || []);
            });
          });
          console.log('[VideoCallStore] Received producers list:', producers);
          for (const p of producers) {
            const { consumeMedia } = get();
            try { await consumeMedia(p.producerId, p.participantId); } catch(e) { console.warn('Auto-consume failed for', p, e); }
          }
        } catch (err) {
          console.warn('[VideoCallStore] getProducers failed or returned none:', err);
        }
      } catch (error) {
        console.error(
          "[VideoCallStore] ❌ Failed to create transports:",
          error
        );
        throw error;
      }
    },

    startProducing: async () => {
      const { localStream } = get();
      if (!localStream) {
        throw new Error("Local stream not available");
      }

      try {
        console.log("[VideoCallStore] Starting to produce media...");
        
        // Add extra verification that MediaSoup service is ready
        console.log("[VideoCallStore] Verifying MediaSoup service is ready before producing...");
        
        // Small delay to ensure MediaSoup service has proper socket info
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Use the complete MediaSoup service through the public wrapper method
        // This properly initializes and uses the complete service implementation
        await mediaSoupClientService.startProducingMedia(localStream);

        console.log("[VideoCallStore] ✅ Started producing media successfully");

        // For compatibility, we'll create mock producers
        const audioProducer = localStream.getAudioTracks().length > 0 ? { id: "audio-producer" } : null;
        const videoProducer = localStream.getVideoTracks().length > 0 ? { id: "video-producer" } : null;

        set({
          audioProducer,
          videoProducer,
        });

      } catch (error) {
        console.error("[VideoCallStore] ❌ Failed to start producing:", error);
        throw error;
      }
    },

    stopProducing: async () => {
      const { audioProducer, videoProducer, screenProducer } = get();

      try {
        console.log("[VideoCallStore] Stopping media production...");

        if (audioProducer) {
          await mediaSoupClientService.closeProducer(
            (audioProducer as { id: string }).id
          );
        }

        if (videoProducer) {
          await mediaSoupClientService.closeProducer(
            (videoProducer as { id: string }).id
          );
        }

        if (screenProducer) {
          await mediaSoupClientService.closeProducer(
            (screenProducer as { id: string }).id
          );
        }

        set({
          audioProducer: null,
          videoProducer: null,
          screenProducer: null,
        });

        console.log("[VideoCallStore] ✅ Stopped producing media");
      } catch (error) {
        console.error("[VideoCallStore] ❌ Failed to stop producing:", error);
        throw error;
      }
    },
    // For consuming, we need to handle the full flow including transport state and consumer resume
    consumeMedia: async (producerId: string, participantId: string) => {
      const { socket, recvTransport } = get();
      if (!socket || !recvTransport) {
        throw new Error("Socket or receive transport not available");
      }

      try {
        console.log(
          `[VideoCallStore] Consuming media from ${participantId}:${producerId}`
        );

        // CRITICAL: Ensure receive transport is connected before consuming
        const transport = recvTransport as any; // Type assertion to access properties
        console.log(`[VideoCallStore] Checking receive transport state:`, {
          connectionState: transport.connectionState,
          iceConnectionState: transport.iceConnectionState,
          iceGatheringState: transport.iceGatheringState,
          dtlsState: transport.dtlsState,
          id: transport.id,
          closed: transport.closed
        });

        // CRITICAL FIX: If transport state is undefined, it means it was never connected
        // Force a connection by creating a dummy consume operation that will trigger the connect event
        if (transport.connectionState === undefined || transport.connectionState === 'new') {
          console.log(`[VideoCallStore] 🔧 Transport not connected (${transport.connectionState}), forcing connection...`);
          
          try {
            // Create a temporary consumer to trigger transport connection
            // This is a MediaSoup pattern - the first consume() call triggers transport.connect
            console.log(`[VideoCallStore] 🔌 Triggering transport connection via consume attempt...`);
            
            // The transport will automatically connect during the consume() call below
            // No need to wait - just log the current state
            console.log(`[VideoCallStore] 🔌 Transport connect will be triggered by consume() call`);
            
          } catch (error) {
            console.warn(`[VideoCallStore] ⚠️ Transport connection trigger failed:`, error);
            // Continue anyway - the consume() call itself should trigger connection
          }
        } else if (transport.connectionState !== 'connected') {
          console.log(`[VideoCallStore] Waiting for receive transport to connect from state: ${transport.connectionState}...`);
          
          // Wait up to 5 seconds for transport to connect
          const maxWaitTime = 5000;
          const startTime = Date.now();
          
          while (transport.connectionState !== 'connected' && 
                 Date.now() - startTime < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, 100));
            console.log(`[VideoCallStore] Transport state: ${transport.connectionState}`);
          }
          
          if (transport.connectionState !== 'connected') {
            console.warn(`[VideoCallStore] Transport not connected after ${maxWaitTime}ms, proceeding anyway`);
          }
        }

        // Request to consume from server
        const consumerParams = await new Promise<ConsumeParams>((resolve, reject) => {
          socket.emit(
            "consume",
            {
              producerId,
              rtpCapabilities: mediaSoupClientService.getRtpCapabilities(),
            },
            (response: any) => {
              if (response.error) {
                reject(new Error(response.error));
              } else {
                resolve(response);
              }
            }
          );
        });

        // Create consumer in paused mode (MediaSoup demo pattern)
        const consumer = await mediaSoupClientService.consume(consumerParams);

        console.log(
          `[VideoCallStore] Consumer created (paused):`, {
            id: consumer.id,
            track: {
              id: consumer.track.id,
              kind: consumer.track.kind,
              enabled: consumer.track.enabled,
              muted: consumer.track.muted,
              readyState: consumer.track.readyState,
              settings: consumer.track.getSettings?.(),
              constraints: consumer.track.getConstraints?.()
            },
            paused: consumer.paused,
            closed: consumer.closed,
            rtpReceiver: !!consumer.rtpReceiver
          }
        );

        // Monitor consumer state changes
        consumer.on('@pause', () => {
          console.log(`[VideoCallStore] Consumer ${consumer.id} paused`);
        });
        
        consumer.on('@resume', () => {
          console.log(`[VideoCallStore] Consumer ${consumer.id} resumed`);
          
          // Force track enabled state when consumer resumes
          if (consumer.track) {
            consumer.track.enabled = true;
            console.log(`[VideoCallStore] 🔧 Force enabled ${consumer.track.kind} track on resume`);
          }
        });
        
        consumer.on('@close', () => {
          console.log(`[VideoCallStore] Consumer ${consumer.id} closed`);
        });

        // CRITICAL: Follow MediaSoup demo pattern - consumers start paused
        // The server should automatically resume after client acknowledges creation
        console.log(`[VideoCallStore] Consumer ${consumer.id} created in paused mode, requesting resume`);
        
        // Now resume the consumer (this triggers media flow)
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Consumer resume timeout'));
          }, 5000);
          
          (socket as any).emit('resumeConsumer', { consumerId: consumer.id }, (res: any) => {
            clearTimeout(timeout);
            if (res?.error) return reject(new Error(res.error));
            resolve();
          });
        });
        console.log(`[VideoCallStore] Consumer ${consumer.id} resume acknowledged`);

        // CRITICAL: Create MediaStream following MediaSoup demo's _setTracks pattern
        // Create a new MediaStream with just this track (MediaSoup demo pattern)
        const trackStream = new MediaStream([consumer.track]);
        
        console.log(`[VideoCallStore] Created new MediaStream for ${consumer.track.kind} track:`, {
          streamId: trackStream.id,
          participantId,
          trackKind: consumer.track.kind,
          trackId: consumer.track.id,
          trackEnabled: consumer.track.enabled,
          trackReadyState: consumer.track.readyState,
          streamActive: trackStream.active
        });

        // CRITICAL: Force track to be enabled (MediaSoup demo pattern)
        if (consumer.track) {
          consumer.track.enabled = true;
          
          // Add track event listeners for debugging (MediaSoup demo pattern)
          if (consumer.track.kind === 'video') {
            console.log(`[VideoCallStore] Setting up video track listeners for ${participantId}`);
            
            consumer.track.addEventListener('ended', () => {
              console.log(`[VideoCallStore] ⚠️ Video track ended for ${participantId}`);
            });
            
            consumer.track.addEventListener('mute', () => {
              console.log(`[VideoCallStore] ⚠️ Video track muted for ${participantId}`);
            });
            
            consumer.track.addEventListener('unmute', () => {
              console.log(`[VideoCallStore] ✅ Video track unmuted for ${participantId}`);
            });
            
            // CRITICAL: Force track constraints for better rendering
            console.log(`[VideoCallStore] 🔧 Video track settings for ${participantId}:`, {
              settings: consumer.track.getSettings?.(),
              constraints: consumer.track.getConstraints?.(),
              capabilities: consumer.track.getCapabilities?.()
            });
          }
        }

        // Use combined stream per participant (for our component architecture)
        const state = get();
        const trackKind = consumer.track.kind as 'audio' | 'video';
        let combinedStream = state.remoteStreams.get(participantId);
        
        if (combinedStream) {
          // Replace existing track of the same kind in the combined stream
          console.log(`[VideoCallStore] 🔄 Updating ${trackKind} track in existing combined stream for ${participantId} (${combinedStream.id})`);
          
          // Remove old tracks of the same kind
          const existingTracks = combinedStream.getTracks().filter((track: MediaStreamTrack) => track.kind === consumer.track.kind);
          existingTracks.forEach((track: MediaStreamTrack) => {
            combinedStream!.removeTrack(track);
            track.stop(); // Clean up old track
          });
          
          // Add the new track to the combined stream
          combinedStream.addTrack(consumer.track);
          
          console.log(`[VideoCallStore] 🔄 Updated ${trackKind} track in combined stream ${combinedStream.id} for ${participantId}`);
        } else {
          // Create new combined MediaStream for this participant (starts with current track)
          combinedStream = new MediaStream([consumer.track]);
          
          console.log(
            `[VideoCallStore] 🎬 New combined MediaStream created for ${participantId}:`, {
              id: combinedStream.id,
              kind: trackKind,
              active: combinedStream.active,
              tracks: combinedStream.getTracks().map((track: MediaStreamTrack) => ({
                id: track.id,
                kind: track.kind,
                enabled: track.enabled,
                muted: track.muted,
                readyState: track.readyState,
                settings: track.getSettings?.()
              }))
            }
          );
          
          // Add stream event listeners (MediaSoup demo pattern)
          combinedStream.addEventListener('addtrack', (event: MediaStreamTrackEvent) => {
            console.log(`[VideoCallStore] ✅ Track added to combined stream for ${participantId}:`, event.track);
          });
          
          combinedStream.addEventListener('removetrack', (event: MediaStreamTrackEvent) => {
            console.log(`[VideoCallStore] ⚠️ Track removed from combined stream for ${participantId}:`, event.track);
          });
        }

        // CRITICAL: Force all video tracks to be enabled and ensure they're live
        combinedStream.getTracks().forEach((track: MediaStreamTrack) => {
          if (!track.enabled) {
            console.log(`[VideoCallStore] 🔧 Force enabling ${track.kind} track for ${participantId}`);
            track.enabled = true;
          }
          
          if (track.readyState !== 'live') {
            console.warn(`[VideoCallStore] ⚠️ Track ${track.kind} not live for ${participantId}: ${track.readyState}`);
          }
          
          // CRITICAL FIX: For video tracks, add additional enforcement
          if (track.kind === 'video') {
            // Force enable video track multiple times to ensure it takes effect
            setTimeout(() => {
              track.enabled = true;
              console.log(`[VideoCallStore] 🔧 Secondary enable for video track ${track.id}`);
            }, 100);
            
            setTimeout(() => {
              track.enabled = true;
              console.log(`[VideoCallStore] 🔧 Final enable for video track ${track.id}`);
            }, 500);
          }
        });

        // Final verification (MediaSoup demo debugging style)
        console.log(`[VideoCallStore] 🔍 Final combined stream verification for ${participantId}:`, {
          streamActive: combinedStream.active,
          streamId: combinedStream.id,
          trackKind: trackKind,
          trackCount: combinedStream.getTracks().length,
          activeTracks: combinedStream.getTracks().filter((t: MediaStreamTrack) => t.readyState === 'live' && t.enabled).length,
          audioTracks: combinedStream.getAudioTracks().length,
          videoTracks: combinedStream.getVideoTracks().length,
          videoTrackDetails: combinedStream.getVideoTracks().map((track: MediaStreamTrack) => ({
            id: track.id,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState
          }))
        });

        // Store the remote stream in the combined streams map
        const newStreams = new Map(state.remoteStreams);
        newStreams.set(participantId, combinedStream);

        // Update state with the combined stream
        set({ remoteStreams: newStreams });

        console.log(
          `[VideoCallStore] ✅ Successfully consuming media from ${participantId} (combined stream: ${combinedStream.id})`
        );
      } catch (error) {
        console.error(
          `[VideoCallStore] ❌ Failed to consume media from ${participantId}:`,
          error
        );
        throw error;
      }
    },

    cleanupMediaSoup: () => {
      console.log("[VideoCallStore] Cleaning up MediaSoup resources...");

      // Clean up the MediaSoup client service
      mediaSoupClientService.cleanup();

      // Reset MediaSoup state
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

      console.log("[VideoCallStore] ✅ MediaSoup cleanup completed");
    },
  }))
);

// Auto-connect will happen in the hook when component mounts
