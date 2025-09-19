"use client";

import { useVideoCallStore } from "@/store/videoCallStore";
import { useEffect, useRef } from "react";

export function useVideoCall() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const hasInitialized = useRef(false);

  // Subscribe to all store state
  const {
    // Connection state
    isSocketConnected,
    isConnected,
    connectionStatus,
    error,
    isLoading,

    // Room state
    currentRoom,
    participants,
    messages,

    // Media state
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isHandRaised,
    localStream,
    screenStream,
    remoteStreams,

    // Actions
    connect,
    joinRoom,
    leaveRoom,
    endMeeting,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleHandRaise,
    sendMessage,
    clearError,
    retry,
    retryMediaAccess,
    checkDeviceAvailability,
    clearMeetingSwitched,
  } = useVideoCallStore();

  // Initialize connection on mount (client-side only)
  useEffect(() => {
    if (!hasInitialized.current && typeof window !== "undefined") {
      hasInitialized.current = true;
      console.log("[useVideoCall] Initializing connection...");
      connect();
    }
  }, [connect]);

  // Update video element when local stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  return {
    // State
    isConnected,
    isSocketConnected,
    connectionStatus,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isHandRaised,
    participants,
    currentRoom,
    isLoading,
    error,
    messages,
    localStream,
    screenStream,
    remoteStreams,

    // Actions
    joinRoom,
    leaveRoom,
    endMeeting,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleHandRaise,
    sendMessage,
    clearError,
    retry,
    retryMediaAccess,
    checkDeviceAvailability,
    clearMeetingSwitched,

    // Refs
    localVideoRef,
  };
}
