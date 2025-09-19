"use client";

import { ChatSidebar } from "@/components/ChatSidebar";
import { EnhancedControlPanel } from "@/components/EnhancedControlPanel";
import ImprovedVideoGrid from "@/components/ImprovedVideoGrid";
import { ParticipantsPanel } from "@/components/ParticipantsPanel";
import { useVideoCallStore } from "@/store/videoCallStore";
import type { ChatMessage } from "@/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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

    // Start meeting timer when room is joined
    useEffect(() => {
        if (currentRoom && !meetingStartTime) {
            setMeetingStartTime(Date.now());
        }
    }, [currentRoom, meetingStartTime]);

    // Update call duration
    useEffect(() => {
        if (!meetingStartTime) return;

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
    if (!isSocketConnected) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-white">Connecting to meeting...</p>
                    <p className="text-gray-400 text-sm">Room: {roomId}</p>
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
                                                ? "bg-green-600 text-white"
                                                : "bg-red-600 text-white"
                                        }`}
                                    >
                                        Socket: {isSocketConnected ? "Connected" : "Disconnected"}
                                    </span>
                                    <span
                                        className={`text-xs px-2 py-1 rounded ${
                                            currentRoom
                                                ? "bg-green-600 text-white"
                                                : "bg-yellow-600 text-white"
                                        }`}
                                    >
                                        Room: {currentRoom ? "Joined" : "Not joined"}
                                    </span>
                                    <span
                                        className={`text-xs px-2 py-1 rounded ${
                                            localStream
                                                ? "bg-green-600 text-white"
                                                : "bg-red-600 text-white"
                                        }`}
                                    >
                                        Local: {localStream ? "Stream Active" : "No Stream"}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded bg-blue-600 text-white">
                                        Remote: {remoteStreams.size} streams
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded bg-gray-600 text-white">
                                        Participants: {participants.length}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-mono text-sm">
                                    {callDuration}
                                </p>
                                <p className="text-gray-400 text-xs">
                                    {participants.length} participants
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Video grid */}
                    <div className="flex-1 p-4">
                        <ImprovedVideoGrid
                            localStream={localStream}
                            remoteStreams={remoteStreams}
                            participants={participants}
                            currentUserId={currentUserId}
                            muted={false}
                        />
                    </div>

                    {/* Enhanced control panel */}
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
    );
}