"use client";

import { ChatSidebar } from "@/components/ChatSidebar";
import { EnhancedControlPanel } from "@/components/EnhancedControlPanel";
import ImprovedVideoGrid from "@/components/ImprovedVideoGrid";
import { ParticipantsPanel } from "@/components/ParticipantsPanel";
import { useVideoCallStore } from "@/store/videoCallStore";
import type { ChatMessage, Participant } from "@/types";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function MeetingPage() {
    const params = useParams();
    const roomId = params?.roomId as string;

    console.log(
        "[MeetingPage] Page loaded with params:",
        params,
        "roomId:",
        roomId
    );

    // Stable user identity (created once and never changes)
    const [currentUserId] = useState(
        `user-${Math.random().toString(36).substr(2, 9)}`
    );
    const [currentUserName] = useState(
        `User-${Math.random().toString(36).substr(2, 9)}`
    );

    // Chat state
    const [showChat, setShowChat] = useState(false);
    const [newMessage, setNewMessage] = useState("");

    // Participants panel state
    const [showParticipants, setShowParticipants] = useState(false);

    // Full screen state
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Meeting timer state
    const [meetingStartTime, setMeetingStartTime] = useState<number | null>(null);
    const [callDuration, setCallDuration] = useState("00:00:00");

    // Zustand Video Call Store - WORKING IMPLEMENTATION
    const {
        // Connection state
        isConnected: isSocketConnected,
        currentRoom,
        participants,
        localStream,
        remoteStreams,
        isVideoEnabled,
        isAudioEnabled,
        isScreenSharing,
        isHandRaised,
        messages,
        error,
        isLoading,
        
        // Actions
        connect,
        joinRoom,
        leaveRoom,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
        toggleHandRaise,
        sendMessage,
    } = useVideoCallStore();

    // Debug logging
    console.log("[MeetingPage] Zustand store state:", {
        isSocketConnected,
        currentRoom: !!currentRoom,
        participantsCount: participants.length,
        localStream: !!localStream,
        remoteStreamsCount: remoteStreams.size,
        isVideoEnabled,
        isAudioEnabled,
        isScreenSharing,
        isHandRaised,
        messagesCount: messages.length
    });

    // Initialize connection when component mounts
    useEffect(() => {
        if (!isSocketConnected && roomId) {
            console.log("[MeetingPage] Initializing connection to room:", roomId);
            connect();
            // Small delay to ensure socket connects before joining
            setTimeout(() => {
                joinRoom(roomId, { name: currentUserName });
            }, 1000);
        }
    }, [isSocketConnected, roomId, currentUserName, connect, joinRoom]);

    console.log("[MeetingPage] RTK Store state:", {
        isConnected: isSocketConnected,
        isSocketConnected,
        error: typeof error === 'string' ? error : 'RTK Error',
        isLoading,
        participants: participants.length,
    });

    // Add detailed store state logging
    console.log("[MeetingPage] 🔍 Detailed RTK State:", {
        connection: {
            isConnected: isSocketConnected,
            isSocketConnected,
            error,
            isLoading,
        },
        room: {
            currentRoom: currentRoom?.id,
            participants: participants.length,
            participantNames: participants.map((p: any) => p.name),
        },
        media: {
            localStream: {
                exists: !!localStream,
                id: localStream?.id,
                videoTracks: localStream?.getVideoTracks()?.length || 0,
                audioTracks: localStream?.getAudioTracks()?.length || 0,
            },
            remoteStreams: {
                count: remoteStreams.size,
                streamIds: Array.from(remoteStreams.keys()),
            },
            mediaState: {
                isAudioEnabled,
                isVideoEnabled,
                isScreenSharing,
                isHandRaised,
            },
        },
    });

    // Initialize connection
    useEffect(() => {
        console.log("[MeetingPage] Connection effect triggered with:", {
            roomId,
            isSocketConnected,
            isConnected: isSocketConnected,
        });
        console.log("[MeetingPage] Connection condition check:", {
            hasRoomId: !!roomId,
            isSocketConnected,
            isConnected: isSocketConnected,
            shouldConnect: roomId && !isSocketConnected,
        });

        if (roomId && !isSocketConnected) {
            console.log("[MeetingPage] CALLING connect() for room:", roomId);
            try {
                connect();
                console.log("[MeetingPage] connect() call completed");
            } catch (error) {
                console.error("[MeetingPage] Error calling connect():", error);
            }
        } else {
            console.log(
                "[MeetingPage] Skipping connect() - conditions not met"
            );
        }
    }, [roomId, isSocketConnected, connect]);

    // Join room once socket is connected
    useEffect(() => {
        console.log("[MeetingPage] Join room effect triggered with:", {
            roomId,
            isSocketConnected,
            isConnected: isSocketConnected,
        });
        if (roomId && isSocketConnected) {
            console.log("Socket connected, joining room:", roomId);
            // RTK auto-joins room, no manual join needed
            console.log('RTK session ready, auto-joined room');
        }
    }, [roomId, isSocketConnected, joinRoom]);

    // Set meeting start time from store
    useEffect(() => {
        if (currentRoom?.createdAt) {
            setMeetingStartTime(new Date(currentRoom.createdAt).getTime());
        } else if (!meetingStartTime) {
            // Fallback for when currentRoom.createdAt is not yet available
            // This ensures the timer starts immediately even if room data is delayed
            setMeetingStartTime(Date.now());
        }
    }, [currentRoom, meetingStartTime]);

    // Update call duration timer
    useEffect(() => {
        if (!meetingStartTime) return; // Ensure meetingStartTime is set

        const interval = setInterval(() => {
            const elapsed = Date.now() - meetingStartTime;
            const hours = Math.floor(elapsed / (1000 * 60 * 60));
            const minutes = Math.floor(
                (elapsed % (1000 * 60 * 60)) / (1000 * 60)
            );
            const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

            setCallDuration(
                `${hours.toString().padStart(2, "0")}:${minutes
                    .toString()
                    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [meetingStartTime]);

    // Handle chat
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            sendMessage(newMessage.trim());
            setNewMessage("");
        }
    };

    // Handle fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-white">Joining meeting...</p>
                    <p className="text-gray-400 text-sm">Room: {roomId}</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        const errorMessage = error 
            ? (typeof error === 'string' ? error : 
               typeof error === 'object' && error && 'message' in error ? String(error.message) :
               'Connection error occurred')
            : 'Connection error occurred';
            
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">Connection Error</p>
                    <p className="text-gray-300 mb-4">{errorMessage}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                    >
                        Retry Connection
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            {/* Main content area */}
            <div className="flex-1 flex">
                {/* Video area */}
                <div className="flex-1 flex flex-col">
                    {/* Header with room info */}
                    <div className="p-4 border-b border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-white font-medium">
                                    Meeting Room
                                </h1>
                                <p className="text-gray-400 text-sm">
                                    Room ID: {roomId}
                                </p>
                                {/* Debug Status Indicator */}
                                <div className="flex gap-2 mt-1 flex-wrap">
                                    <span
                                        className={`text-xs px-2 py-1 rounded ${
                                            isSocketConnected
                                                ? "bg-green-500 text-white"
                                                : "bg-red-500 text-white"
                                        }`}
                                    >
                                        Socket:{" "}
                                        {isSocketConnected
                                            ? "Connected"
                                            : "Disconnected"}
                                    </span>
                                    <span
                                        className={`text-xs px-2 py-1 rounded ${
                                            currentRoom
                                                ? "bg-green-500 text-white"
                                                : "bg-yellow-500 text-black"
                                        }`}
                                    >
                                        Room:{" "}
                                        {currentRoom ? "Joined" : "Not Joined"}
                                    </span>
                                    <span
                                        className={`text-xs px-2 py-1 rounded ${
                                            localStream
                                                ? "bg-green-500 text-white"
                                                : "bg-red-500 text-white"
                                        }`}
                                    >
                                        Local:{" "}
                                        {localStream
                                            ? `✓ ${
                                                  localStream.getVideoTracks()
                                                      .length
                                              }V/${
                                                  localStream.getAudioTracks()
                                                      .length
                                              }A`
                                            : "No Stream"}
                                    </span>
                                    <span
                                        className={`text-xs px-2 py-1 rounded ${
                                            remoteStreams.size > 0
                                                ? "bg-green-500 text-white"
                                                : "bg-gray-500 text-white"
                                        }`}
                                    >
                                        Remote: {remoteStreams.size} streams
                                    </span>
                                    <span
                                        className={`text-xs px-2 py-1 rounded ${
                                            participants.length > 0
                                                ? "bg-blue-500 text-white"
                                                : "bg-gray-500 text-white"
                                        }`}
                                    >
                                        Participants: {participants.length}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-white text-sm">
                                    Duration: {callDuration}
                                </p>
                                <p className="text-gray-400 text-xs">
                                    {participants.length + 1} participant
                                    {participants.length + 1 !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Video grid */}
                    <div className="flex-1 p-4">
                        {/* Create participants with stream mapping */}
                        {(() => {
                            const participantsWithStreams = participants.map(
                                (participant: Participant) => {
                                    console.log(`[MeetingPage] 🔗 Mapping streams for participant ${participant.id} (${participant.name}):`, {
                                        participantId: participant.id,
                                        totalStreams: remoteStreams.size,
                                        streamKeys: Array.from(remoteStreams.keys())
                                    });

                                    // Get the combined stream for this participant
                                    const participantStream = remoteStreams.get(participant.id);
                                    
                                    console.log(`[MeetingPage] 🔗 Looking for streams for participant ${participant.id} (${participant.name}):`, {
                                        participantId: participant.id,
                                        totalStreams: remoteStreams.size,
                                        streamKeys: Array.from(remoteStreams.keys()),
                                        foundStream: !!participantStream
                                    });

                                    if (participantStream) {
                                        console.log(`[MeetingPage] ✅ Found combined stream for ${participant.id}:`, {
                                            streamId: participantStream.id,
                                            streamActive: participantStream.active,
                                            videoTracks: participantStream.getVideoTracks().length,
                                            audioTracks: participantStream.getAudioTracks().length,
                                            videoTrackStates: participantStream.getVideoTracks().map((t: MediaStreamTrack) => ({
                                                id: t.id,
                                                readyState: t.readyState,
                                                enabled: t.enabled,
                                                muted: t.muted
                                            })),
                                            audioTrackStates: participantStream.getAudioTracks().map((t: MediaStreamTrack) => ({
                                                id: t.id,
                                                readyState: t.readyState,
                                                enabled: t.enabled,
                                                muted: t.muted
                                            }))
                                        });
                                    }

                                    const finalResult = {
                                        ...participant,
                                        videoStream: participantStream || null, // Use combined stream for video
                                        audioStream: participantStream || null, // Use combined stream for audio
                                    };

                                    console.log(`[MeetingPage] 🎬 Final participant with streams for ${participant.id}:`, {
                                        name: participant.name,
                                        hasVideoStream: !!finalResult.videoStream,
                                        hasAudioStream: !!finalResult.audioStream,
                                        streamId: finalResult.videoStream?.id || 'none',
                                        streamActive: finalResult.videoStream?.active || false,
                                        videoTracks: finalResult.videoStream?.getVideoTracks().length || 0,
                                        audioTracks: finalResult.videoStream?.getAudioTracks().length || 0
                                    });

                                    return finalResult;
                                }
                            );

                            console.log(`[MeetingPage] 🌟 All participants with streams mapped:`, {
                                totalParticipants: participantsWithStreams.length,
                                participantsWithVideo: participantsWithStreams.filter((p: any) => p.videoStream).length,
                                participantsWithAudio: participantsWithStreams.filter((p: any) => p.audioStream).length
                            });

                            return (
                                <ImprovedVideoGrid
                                    participants={participantsWithStreams}
                                    localStream={localStream}
                                    currentUserId={currentUserId}
                                    currentUserName={currentUserName}
                                    isLocalVideoMuted={!isVideoEnabled}
                                    isLocalAudioMuted={!isAudioEnabled}
                                    hasLocalStream={!!localStream}
                                    isScreenSharing={isScreenSharing}
                                />
                            );
                        })()}
                    </div>

                    {/* Control panel */}
                    <div className="p-4">
                        <EnhancedControlPanel
                            isAudioEnabled={isAudioEnabled}
                            isVideoEnabled={isVideoEnabled}
                            isScreenSharing={isScreenSharing}
                            isHandRaised={isHandRaised}
                            participantCount={participants.length}
                            callDuration={callDuration}
                            onToggleAudio={toggleAudio}
                            onToggleVideo={toggleVideo}
                            onToggleScreenShare={toggleScreenShare}
                            onToggleHandRaise={toggleHandRaise}
                            onLeaveCall={() => leaveRoom()}
                            onToggleChat={() => setShowChat(!showChat)}
                            onToggleParticipants={() =>
                                setShowParticipants(!showParticipants)
                            }
                            onToggleFullscreen={toggleFullscreen}
                            isFullscreen={isFullscreen}
                            showChat={showChat}
                            showParticipants={showParticipants}
                            isHost={currentRoom?.participants?.[0]?.isHost}
                        />
                    </div>
                </div>

                {/* Chat sidebar */}
                <ChatSidebar
                    showChat={showChat}
                    onClose={() => setShowChat(false)}
                    messages={messages as ChatMessage[]}
                    newMessage={newMessage}
                    onMessageChange={setNewMessage}
                    onSendMessage={handleSendMessage}
                />

                {/* Participants panel */}
                <ParticipantsPanel
                    participants={participants}
                    isVisible={showParticipants}
                    onClose={() => setShowParticipants(false)}
                />
            </div>
        </div>
    );
}
