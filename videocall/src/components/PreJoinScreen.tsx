"use client";

import { useMultiTabConflict } from "@/hooks/useMultiTabConflict";
import {
  checkForSameUserInRoom,
  clearUserData,
  isCurrentlyJoining,
  isUserAuthenticated,
  loadUserData,
  notifyOtherTabsOfMeetingSwitch,
  saveUserData,
  setCurrentMeetingId,
  shouldAutoJoin,
} from "@/lib/storage";
import { Camera, CameraOff, Mic, MicOff, Settings, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MultiTabConflictDialog } from "./MultiTabConflictDialog";

interface PreJoinScreenProps {
  onJoin: (userInfo: {
    name: string;
    email: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
  }) => void;
  meetingName?: string;
  deviceError?: string | null;
  isDeviceCheckPending?: boolean;
  onRetryDeviceCheck?: () => void;
  isConnected?: boolean;
  roomId?: string;
}

export function PreJoinScreen({
  onJoin,
  meetingName,
  deviceError,
  isDeviceCheckPending,
  onRetryDeviceCheck,
  isConnected = false,
  roomId,
}: PreJoinScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [devicesInitialized, setDevicesInitialized] = useState(false);
  const [isAutoJoining, setIsAutoJoining] = useState(false);
  const [autoJoinCountdown, setAutoJoinCountdown] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const currentStreamRef = useRef<MediaStream | null>(null);

  // Use the multi-tab conflict hook
  const {
    showConflictDialog,
    conflictData,
    handleCloseOtherTabs: handleCloseOtherTabsConflict,
    handleLeaveCurrent: handleLeaveCurrentConflict,
  } = useMultiTabConflict();

  // Load user data from localStorage
  useEffect(() => {
    const userData = loadUserData();
    if (userData && isUserAuthenticated()) {
      // Auto-populate user data
      if (userData.name) setName(userData.name);
      if (userData.email) setEmail(userData.email);
      if (userData.audioEnabled !== undefined)
        setIsAudioEnabled(userData.audioEnabled);
      if (userData.videoEnabled !== undefined)
        setIsVideoEnabled(userData.videoEnabled);
      if (userData.selectedAudioDevice)
        setSelectedAudioDevice(userData.selectedAudioDevice);
      if (userData.selectedVideoDevice)
        setSelectedVideoDevice(userData.selectedVideoDevice);
    }
  }, []);

  // Save user data to localStorage
  const handleSaveUserData = useCallback(() => {
    saveUserData({
      name: name.trim(),
      email: email.trim(),
      audioEnabled: isAudioEnabled,
      videoEnabled: isVideoEnabled,
      selectedAudioDevice,
      selectedVideoDevice,
    });
  }, [
    name,
    email,
    isAudioEnabled,
    isVideoEnabled,
    selectedAudioDevice,
    selectedVideoDevice,
  ]);

  // Clear user data
  const handleClearUserData = useCallback(() => {
    clearUserData();
    setName("");
    setEmail("");
    setIsAudioEnabled(true);
    setIsVideoEnabled(true);
    setSelectedAudioDevice("");
    setSelectedVideoDevice("");
  }, []);

  // Check if there's a device-in-use error
  const isDeviceInUseError = deviceError?.includes("DEVICE_IN_USE") || false;
  const isJoinDisabled =
    !name.trim() ||
    name.trim().length < 2 ||
    isDeviceInUseError ||
    isDeviceCheckPending ||
    isAutoJoining;

  // Update media stream
  const updateMediaStream = useCallback(async () => {
    if (isInitializing) return;

    try {
      setIsInitializing(true);

      // Stop current stream first
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: isVideoEnabled
          ? {
              deviceId: selectedVideoDevice
                ? { exact: selectedVideoDevice }
                : undefined,
              width: { ideal: 640 },
              height: { ideal: 480 },
            }
          : false,
        audio: isAudioEnabled
          ? {
              deviceId: selectedAudioDevice
                ? { exact: selectedAudioDevice }
                : undefined,
              echoCancellation: true,
              noiseSuppression: true,
            }
          : false,
      };

      if (constraints.video || constraints.audio) {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStreamRef.current = stream;
        setMediaStream(stream);

        if (videoRef.current && constraints.video) {
          videoRef.current.srcObject = stream;
        } else if (videoRef.current && !constraints.video) {
          videoRef.current.srcObject = null;
        }
      } else {
        currentStreamRef.current = null;
        setMediaStream(null);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    } catch (error) {
      console.error("Error updating media stream:", error);
      setMediaStream(null);
    } finally {
      setIsInitializing(false);
    }
  }, [
    isVideoEnabled,
    isAudioEnabled,
    selectedVideoDevice,
    selectedAudioDevice,
    isInitializing,
  ]);

  // Initialize devices once (skip if device error detected)
  useEffect(() => {
    if (devicesInitialized || isDeviceInUseError) return;

    const initDevices = async () => {
      try {
        // Request permissions first
        const tempStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        tempStream.getTracks().forEach((track) => track.stop());

        // Get available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(
          (device) => device.kind === "audioinput"
        );
        const videoInputs = devices.filter(
          (device) => device.kind === "videoinput"
        );

        setAudioDevices(audioInputs);
        setVideoDevices(videoInputs);

        if (audioInputs.length > 0)
          setSelectedAudioDevice(audioInputs[0].deviceId);
        if (videoInputs.length > 0)
          setSelectedVideoDevice(videoInputs[0].deviceId);

        setDevicesInitialized(true);
      } catch (error) {
        console.error("Error initializing devices:", error);
      }
    };

    initDevices();
  }, [devicesInitialized, isDeviceInUseError]);

  // Update media stream when settings change (only after devices are initialized and no device error)
  useEffect(() => {
    if (devicesInitialized && !isDeviceInUseError) {
      updateMediaStream();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    devicesInitialized,
    isVideoEnabled,
    isAudioEnabled,
    selectedVideoDevice,
    selectedAudioDevice,
    isDeviceInUseError,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleJoin = useCallback(() => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      alert("Please enter your name");
      return;
    }
    if (trimmedName.length < 2) {
      alert("Name must be at least 2 characters long");
      return;
    }

    // Check if this same user is already in this meeting from another tab
    if (roomId && checkForSameUserInRoom(roomId, trimmedName, trimmedEmail)) {
      console.log(
        "[PreJoinScreen] Same user in same meeting detected, notifying other tabs"
      );
      // For same meeting with same user: notify other tabs to show "switched" message
      notifyOtherTabsOfMeetingSwitch(roomId, trimmedName, trimmedEmail);
      // Continue with the join process (don't return)
    }

    // Note: We removed the different meeting check - users can join different meetings as individual users

    // Save user data to localStorage before joining
    handleSaveUserData();

    // Store current meeting ID
    if (roomId) {
      setCurrentMeetingId(roomId);
    }

    // The backend will now handle duplicate user detection
    onJoin({
      name: trimmedName,
      email: trimmedEmail,
      audioEnabled: isAudioEnabled,
      videoEnabled: isVideoEnabled,
    });
  }, [
    name,
    email,
    isAudioEnabled,
    isVideoEnabled,
    handleSaveUserData,
    onJoin,
    roomId,
  ]);

  // Auto-join for returning users (optional - can be enabled if needed)
  // const shouldAutoJoin = useCallback(() => {
  //   const savedUserData = localStorage.getItem(USER_DATA_KEY);
  //   if (savedUserData) {
  //     try {
  //       const userData = JSON.parse(savedUserData);
  //       const lastUsed = new Date(userData.lastUsed);
  //       const now = new Date();
  //       const hoursSinceLastUse = (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60);
  //
  //       // Auto-join if user was active within last 24 hours and has a name
  //       return hoursSinceLastUse < 24 && userData.name && userData.name.trim().length >= 2;
  //     } catch (error) {
  //       console.error("Error checking auto-join eligibility:", error);
  //     }
  //   }
  //   return false;
  // }, []);

  // Auto-join for returning users
  useEffect(() => {
    if (
      shouldAutoJoin() &&
      !isDeviceCheckPending &&
      !deviceError &&
      !isAutoJoining &&
      !isConnected &&
      !isCurrentlyJoining() &&
      name.trim().length >= 2
    ) {
      setIsAutoJoining(true);
      setAutoJoinCountdown(3);

      const countdown = setInterval(() => {
        setAutoJoinCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            handleJoin();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdown);
    }
  }, [
    name,
    isDeviceCheckPending,
    deviceError,
    handleJoin,
    isAutoJoining,
    isConnected,
  ]);

  // Auto-join for authenticated users (immediate join without countdown)
  useEffect(() => {
    if (
      isUserAuthenticated() &&
      name.trim().length >= 2 &&
      email.trim().length >= 3 &&
      !isDeviceCheckPending &&
      !deviceError &&
      !isConnected &&
      !isCurrentlyJoining()
    ) {
      console.log(
        "[PreJoinScreen] Auto-joining authenticated user immediately"
      );
      // Small delay to ensure all state is properly set
      const timeoutId = setTimeout(() => {
        handleJoin();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [name, email, isDeviceCheckPending, deviceError, handleJoin, isConnected]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-2 md:p-4">
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-4 md:p-6 max-w-4xl w-full shadow-2xl border border-white/10 ring-1 ring-white/5 max-h-screen overflow-y-auto">
        <div className="text-center mb-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Ready to join?
          </h1>
          {meetingName && (
            <p className="text-gray-300 text-base md:text-lg font-medium">
              {meetingName}
            </p>
          )}
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* Video Preview */}
          <div className="space-y-3">
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden aspect-video border border-white/5 shadow-xl max-w-lg mx-auto">
              {isVideoEnabled && mediaStream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                      <CameraOff className="w-10 h-10" />
                    </div>
                    <p className="text-gray-300 font-medium">Camera is off</p>
                  </div>
                </div>
              )}
            </div>

            {/* Media Controls */}
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className={`p-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  isAudioEnabled
                    ? "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                    : "bg-red-500/90 hover:bg-red-500 text-white border border-red-400/50"
                }`}
                title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
              >
                {isAudioEnabled ? (
                  <Mic className="w-4 h-4" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                className={`p-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  isVideoEnabled
                    ? "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                    : "bg-red-500/90 hover:bg-red-500 text-white border border-red-400/50"
                }`}
                title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
              >
                {isVideoEnabled ? (
                  <Camera className="w-4 h-4" />
                ) : (
                  <CameraOff className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Join Form */}
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Welcome back message for returning users */}
            {name && loadUserData() && (
              <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-xl p-3 mb-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-green-100 text-sm font-medium">
                      Welcome back, {name}! Your settings have been restored.
                    </span>
                  </div>
                  {isAutoJoining && (
                    <button
                      onClick={() => {
                        setIsAutoJoining(false);
                        setAutoJoinCountdown(0);
                      }}
                      className="text-green-200 hover:text-white text-xs underline transition-colors"
                    >
                      Cancel auto-join
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  Your name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
                />
              </div>
            </div>

            {/* Device Settings Modal */}
            {showSettings && (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                onClick={() => setShowSettings(false)}
              >
                <div
                  className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                      <Settings className="w-6 h-6 text-purple-400" />
                      Device Settings
                    </h2>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200"
                      title="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-blue-400" />
                        Camera
                      </label>
                      <select
                        value={selectedVideoDevice}
                        onChange={(e) => setSelectedVideoDevice(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
                      >
                        {videoDevices.map((device) => (
                          <option
                            key={device.deviceId}
                            value={device.deviceId}
                            className="bg-gray-800 text-white"
                          >
                            {device.label ||
                              `Camera ${device.deviceId.slice(0, 5)}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                        <Mic className="w-4 h-4 text-green-400" />
                        Microphone
                      </label>
                      <select
                        value={selectedAudioDevice}
                        onChange={(e) => setSelectedAudioDevice(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
                      >
                        {audioDevices.map((device) => (
                          <option
                            key={device.deviceId}
                            value={device.deviceId}
                            className="bg-gray-800 text-white"
                          >
                            {device.label ||
                              `Microphone ${device.deviceId.slice(0, 5)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex justify-end gap-3 p-6 border-t border-white/10">
                    <button
                      onClick={() => setShowSettings(false)}
                      className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 border border-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                    >
                      Apply Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Device Error Alert - Improved Design */}
            {isDeviceInUseError && (
              <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30 rounded-xl p-5 mb-4 backdrop-blur-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-sm mb-1">
                      Device in Use
                    </h4>
                    <p className="text-gray-300 text-xs">
                      Close other apps using your camera/mic, then try again.
                    </p>
                  </div>
                </div>

                <button
                  onClick={onRetryDeviceCheck}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.01]"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Device Check Loading - Compact Design */}
            {isDeviceCheckPending && (
              <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-3 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                    <div className="absolute inset-0 animate-pulse">
                      <div className="w-5 h-5 bg-blue-400/20 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <span className="text-white font-medium text-sm">
                      Checking device availability...
                    </span>
                    <p className="text-blue-200 text-xs">
                      This may take a few seconds
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={isJoinDisabled}
              className={`w-full max-w-md mx-auto block font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg transform ${
                isJoinDisabled
                  ? "bg-gray-600/50 text-gray-400 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
              }`}
            >
              {isDeviceCheckPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                  Checking devices...
                </div>
              ) : isDeviceInUseError ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Device in use - Fix to continue
                </div>
              ) : isAutoJoining ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                  Auto-joining in {autoJoinCountdown}s...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Join now
                </div>
              )}
            </button>

            {/* Clear saved data option */}
            {loadUserData() && (
              <div className="text-center mt-3">
                <button
                  onClick={handleClearUserData}
                  className="text-gray-400 hover:text-white text-xs transition-colors duration-200 underline"
                  type="button"
                >
                  Clear saved data
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Multi-tab conflict dialog */}
      {showConflictDialog && (
        <MultiTabConflictDialog
          onCloseOtherTabs={() => {
            if (roomId) {
              handleCloseOtherTabsConflict(roomId);
            }
          }}
          onLeaveCurrent={handleLeaveCurrentConflict}
          meetingName={conflictData?.meetingName || meetingName}
        />
      )}
    </div>
  );
}
