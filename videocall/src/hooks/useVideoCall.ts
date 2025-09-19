"use client";

import config from "@/lib/config";
import {
  clearCurrentMeetingId,
  shouldHandleMeetingCleanup,
} from "@/lib/storage";
import type { Participant, Room, VideoCallState } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "./useSocket";

export function useVideoCall(serverUrl?: string) {
  const {
    socket,
    isConnected: socketConnected,
    error: socketError,
  } = useSocket(serverUrl);

  const [state, setState] = useState<VideoCallState>({
    isConnected: false,
    isAudioEnabled: true,
    isVideoEnabled: true,
    isScreenSharing: false,
    participants: [],
    currentRoom: null,
    chatMessages: [],
    isHandRaised: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize local media
  const initializeLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: config.videoCall.defaultVideoConstraints,
        audio: config.videoCall.defaultAudioConstraints,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to access camera/microphone: ${errorMessage}`);
      throw err;
    }
  }, []);

  // Join room with connection retry
  const joinRoom = useCallback(
    async (
      roomId: string,
      participant: string | { name: string; email?: string }
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        // Wait for socket connection if not already connected
        if (!socket || !socketConnected) {
          console.log("[VideoCall] Waiting for socket connection...");

          // Wait up to 20 seconds for connection (matching socket timeout)
          const maxWaitTime = 20000;
          const checkInterval = 200;
          let waited = 0;

          while ((!socket || !socketConnected) && waited < maxWaitTime) {
            await new Promise((resolve) => setTimeout(resolve, checkInterval));
            waited += checkInterval;

            // Log progress every 5 seconds
            if (waited % 5000 === 0) {
              console.log(
                `[VideoCall] Still waiting for socket connection... (${
                  waited / 1000
                }s)`
              );
            }
          }

          if (!socket || !socketConnected) {
            throw new Error(
              "Socket connection timeout. Please check your internet connection and try again."
            );
          }

          console.log("[VideoCall] Socket connected, proceeding to join room");
        }

        // Initialize local media first
        await initializeLocalMedia();

        // Normalize participant data
        const participantData =
          typeof participant === "string" ? { name: participant } : participant;

        // Join room via socket with timeout
        console.log(
          "[VideoCall] Joining room:",
          roomId,
          "as:",
          participantData.name
        );

        // Create a promise that resolves when roomJoined is received or rejects on timeout/error
        const joinPromise = new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.error("[VideoCall] Join room timeout after 15 seconds");
            reject(
              new Error("Join room timeout. The server may not be responding.")
            );
          }, 15000); // 15 second timeout

          const handleRoomJoined = (data: {
            room: Room;
            participant: Participant;
          }) => {
            console.log("[VideoCall] Successfully joined room:", data.room.id);
            clearTimeout(timeout);
            socket?.off("roomJoined", handleRoomJoined);
            socket?.off("error", handleError);

            // Update state with room and participant info
            setState((prev) => ({
              ...prev,
              currentRoom: data.room,
              participants: [data.participant],
              isConnected: true,
            }));
            setIsLoading(false);

            resolve();
          };

          const handleError = (data: { message: string }) => {
            console.error(
              "[VideoCall] Join room error from server:",
              data.message
            );
            clearTimeout(timeout);
            socket?.off("roomJoined", handleRoomJoined);
            socket?.off("error", handleError);
            reject(new Error(data.message));
          };

          console.log(
            "[VideoCall] Setting up event listeners for roomJoined and error"
          );
          socket?.on("roomJoined", handleRoomJoined);
          socket?.on("error", handleError);

          // Handle multi-tab conflicts
          socket?.on("connectionRejected", (data) => {
            console.log("[VideoCall] Connection rejected:", data);
            clearTimeout(timeout);
            socket?.off("roomJoined", handleRoomJoined);
            socket?.off("error", handleError);
            socket?.off("connectionRejected");
            reject(new Error(data.message));
          });

          // Emit the join room event
          console.log("[VideoCall] Emitting joinRoom event to server");
          socket?.emit("joinRoom", {
            roomId,
            participantName: participantData.name,
            userEmail: participantData.email,
          });
        });

        await joinPromise;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error("[VideoCall] Failed to join room:", errorMessage);
        setError(`Failed to join room: ${errorMessage}`);
        setIsLoading(false);
      }
    },
    [socket, socketConnected, initializeLocalMedia]
  );

  // Leave room
  const leaveRoom = useCallback(() => {
    if (!socket || !state.currentRoom) return;

    socket.emit("leaveRoom", { roomId: state.currentRoom.id });

    // Only clear meeting ID if this tab is responsible for this meeting
    if (shouldHandleMeetingCleanup(state.currentRoom.id)) {
      clearCurrentMeetingId();
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      currentRoom: null,
      participants: [],
      isConnected: false,
    }));
  }, [socket, state.currentRoom]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setState((prev) => ({ ...prev, isAudioEnabled: audioTrack.enabled }));

      if (socket && state.currentRoom) {
        // Find current participant
        const currentParticipant = state.participants.find(
          (p) => p.id === "current-user"
        );
        if (currentParticipant) {
          socket.emit("toggleAudio", {
            participantId: currentParticipant.id,
            isEnabled: audioTrack.enabled,
          });
        }
      }
    }
  }, [socket, state.currentRoom, state.participants]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setState((prev) => ({ ...prev, isVideoEnabled: videoTrack.enabled }));

      if (socket && state.currentRoom) {
        const currentParticipant = state.participants.find(
          (p) => p.id === "current-user"
        );
        if (currentParticipant) {
          socket.emit("toggleVideo", {
            participantId: currentParticipant.id,
            isEnabled: videoTrack.enabled,
          });
        }
      }
    }
  }, [socket, state.currentRoom, state.participants]);

  // Send chat message
  const sendMessage = useCallback(
    (message: string) => {
      if (!socket || !state.currentRoom || !message.trim()) return;

      socket.emit("sendMessage", {
        roomId: state.currentRoom.id,
        message: message.trim(),
      });
    },
    [socket, state.currentRoom]
  );

  // Toggle hand raise
  const toggleHandRaise = useCallback(() => {
    if (!socket || !state.currentRoom) return;

    const newState = !state.isHandRaised;
    setState((prev) => ({ ...prev, isHandRaised: newState }));

    const currentParticipant = state.participants.find(
      (p) => p.id === "current-user"
    );
    if (currentParticipant) {
      socket.emit("raiseHand", {
        participantId: currentParticipant.id,
        isRaised: newState,
      });
    }
  }, [socket, state.currentRoom, state.isHandRaised, state.participants]);

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    if (!socket || !state.currentRoom) return;

    try {
      if (state.isScreenSharing) {
        // Stop screen sharing
        setState((prev) => ({ ...prev, isScreenSharing: false }));

        const currentParticipant = state.participants.find(
          (p) => p.id === "current-user"
        );
        if (currentParticipant) {
          socket.emit("stopScreenShare", {
            participantId: currentParticipant.id,
          });
        }
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        setState((prev) => ({ ...prev, isScreenSharing: true }));

        const currentParticipant = state.participants.find(
          (p) => p.id === "current-user"
        );
        if (currentParticipant) {
          socket.emit("startScreenShare", {
            participantId: currentParticipant.id,
          });
        }

        // Handle when user stops sharing via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          setState((prev) => ({ ...prev, isScreenSharing: false }));
          if (currentParticipant) {
            socket.emit("stopScreenShare", {
              participantId: currentParticipant.id,
            });
          }
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to toggle screen share: ${errorMessage}`);
    }
  }, [socket, state.currentRoom, state.isScreenSharing, state.participants]);

  // Get messages from state
  const messages = state.chatMessages;
  useEffect(() => {
    if (!socket) return;

    const handleParticipantJoined = (data: { participant: Participant }) => {
      console.log("[VideoCall] Participant joined:", data.participant.name);
      setState((prev) => ({
        ...prev,
        participants: [...prev.participants, data.participant],
      }));
    };

    const handleParticipantLeft = (data: { participantId: string }) => {
      console.log("[VideoCall] Participant left:", data.participantId);
      setState((prev) => ({
        ...prev,
        participants: prev.participants.filter(
          (p) => p.id !== data.participantId
        ),
      }));
    };

    const handleError = (data: { message: string }) => {
      // Only handle errors when not in loading state (to avoid conflicts with joinRoom)
      if (!isLoading) {
        setError(data.message);
      } else {
        console.log(
          "[VideoCall] Error during loading (possibly joinRoom):",
          data.message
        );
      }
    };

    const handleDuplicateConnection = (data: {
      message: string;
      newSocketId: string;
    }) => {
      console.log("[VideoCall] Duplicate connection detected:", data);
      alert(
        "Someone is trying to join this meeting with your account from another tab. You may be disconnected soon."
      );
    };

    const handleForceDisconnect = (data: {
      reason: string;
      message: string;
    }) => {
      console.log("[VideoCall] Force disconnect:", data);
      alert(data.message);
      // The socket will be disconnected by the server
    };

    socket.on("participantJoined", handleParticipantJoined);
    socket.on("participantLeft", handleParticipantLeft);
    socket.on("error", handleError);
    socket.on("duplicateConnection", handleDuplicateConnection);
    socket.on("forceDisconnect", handleForceDisconnect);

    return () => {
      socket.off("participantJoined", handleParticipantJoined);
      socket.off("participantLeft", handleParticipantLeft);
      socket.off("error", handleError);
      socket.off("duplicateConnection", handleDuplicateConnection);
      socket.off("forceDisconnect", handleForceDisconnect);
    };
  }, [socket, isLoading]);

  // Cleanup meeting ID on page unload or component unmount
  useEffect(() => {
    const cleanup = () => {
      // Only clear if this tab is in a meeting
      const currentRoom = state.currentRoom;
      if (currentRoom && shouldHandleMeetingCleanup(currentRoom.id)) {
        console.log(
          "[VideoCall] Cleaning up meeting ID for current room:",
          currentRoom.id
        );
        clearCurrentMeetingId();

        // Send graceful disconnect signal if socket is available
        if (socket?.connected) {
          console.log("[VideoCall] Sending graceful disconnect signal");
          socket.emit("beforeDisconnect", { roomId: currentRoom.id });
        }
      }
    };

    // Enhanced beforeunload handler
    const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      cleanup();

      // If user is in a meeting, show confirmation
      const currentRoom = state.currentRoom;
      if (currentRoom && state.isConnected) {
        e.preventDefault();
        e.returnValue =
          "You are currently in a video call. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", beforeUnloadHandler);

    return () => {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      // Also cleanup on component unmount, but only if in a meeting
      cleanup();
    };
  }, [state.currentRoom, state.isConnected, socket]);

  return {
    // State
    ...state,
    isLoading,
    error: error || socketError,
    isSocketConnected: socketConnected,

    // Actions
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    sendMessage,
    toggleHandRaise,
    toggleScreenShare,
    messages,

    // Refs and streams
    localVideoRef,
    localStream: localStreamRef.current,
  };
}
