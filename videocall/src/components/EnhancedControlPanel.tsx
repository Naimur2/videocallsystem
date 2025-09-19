"use client";

import {
  Grid,
  Hand,
  Maximize,
  MessageSquare,
  Mic,
  MicOff,
  Minimize,
  Monitor,
  MoreVertical,
  Phone,
  Settings,
  Users,
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";
import { useState } from "react";

interface EnhancedControlPanelProps {
  readonly isAudioEnabled: boolean;
  readonly isVideoEnabled: boolean;
  readonly isScreenSharing: boolean;
  readonly isHandRaised: boolean;
  readonly participantCount: number;
  readonly callDuration: string;
  readonly onToggleAudio: () => void;
  readonly onToggleVideo: () => void;
  readonly onToggleScreenShare?: () => void;
  readonly onToggleHandRaise: () => void;
  readonly onLeaveCall: () => void;
  readonly onEndMeeting?: () => void;
  readonly onToggleChat?: () => void;
  readonly onToggleParticipants?: () => void;
  readonly onToggleSettings?: () => void;
  readonly onToggleLayout?: () => void;
  readonly onToggleFullscreen?: () => void;
  readonly isFullscreen?: boolean;
  readonly showChat?: boolean;
  readonly showParticipants?: boolean;
  readonly isHost?: boolean;
}

export function EnhancedControlPanel({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isHandRaised,
  participantCount,
  callDuration,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHandRaise,
  onLeaveCall,
  onEndMeeting,
  onToggleChat,
  onToggleParticipants,
  onToggleSettings,
  onToggleLayout,
  onToggleFullscreen,
  isFullscreen = false,
  showChat = false,
  showParticipants = false,
  isHost = false,
}: EnhancedControlPanelProps) {
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  return (
    <>
      {/* Top Bar with Meeting Info */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Meeting Info */}
          <div className="flex items-center space-x-4">
            <div className="text-white">
              <div className="font-medium">Meeting in progress</div>
              <div className="text-sm text-gray-400">{callDuration}</div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Users className="w-4 h-4" />
              <span>
                {participantCount} participant
                {participantCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center space-x-2">
            {/* Layout Toggle */}
            {onToggleLayout && (
              <button
                onClick={onToggleLayout}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                title="Change layout"
              >
                <Grid className="w-5 h-5" />
              </button>
            )}

            {/* Fullscreen Toggle */}
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Settings */}
            {onToggleSettings && (
              <button
                onClick={onToggleSettings}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}

            {/* More Options */}
            <div className="relative">
              <button
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                title="More options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showMoreOptions && (
                <div className="absolute right-0 top-full mt-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 min-w-[200px] z-50">
                  <button className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center space-x-3">
                    <Volume2 className="w-4 h-4" />
                    <span>Speaker settings</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center space-x-3">
                    <Mic className="w-4 h-4" />
                    <span>Microphone settings</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center space-x-3">
                    <Video className="w-4 h-4" />
                    <span>Camera settings</span>
                  </button>
                  <div className="border-t border-gray-600 my-2"></div>
                  <button className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors">
                    Report an issue
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Control Panel */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center space-x-3 shadow-2xl border border-gray-700">
          {/* Audio Toggle */}
          <button
            onClick={onToggleAudio}
            className={`p-4 rounded-xl transition-all duration-200 ${
              isAudioEnabled
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25"
            }`}
            title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            {isAudioEnabled ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </button>

          {/* Video Toggle */}
          <button
            onClick={onToggleVideo}
            className={`p-4 rounded-xl transition-all duration-200 ${
              isVideoEnabled
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25"
            }`}
            title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {isVideoEnabled ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </button>

          {/* Screen Share */}
          {onToggleScreenShare && (
            <button
              onClick={onToggleScreenShare}
              className={`p-4 rounded-xl transition-all duration-200 ${
                isScreenSharing
                  ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-gray-700 hover:bg-gray-600 text-white"
              }`}
              title={
                isScreenSharing ? "Stop screen sharing" : "Start screen sharing"
              }
            >
              <Monitor className="w-6 h-6" />
            </button>
          )}

          {/* Hand Raise */}
          <button
            onClick={onToggleHandRaise}
            className={`p-4 rounded-xl transition-all duration-200 ${
              isHandRaised
                ? "bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/25"
                : "bg-gray-700 hover:bg-gray-600 text-white"
            }`}
            title={isHandRaised ? "Lower hand" : "Raise hand"}
          >
            <Hand className="w-6 h-6" />
          </button>

          {/* Divider */}
          <div className="w-px h-10 bg-gray-600"></div>

          {/* Chat Toggle */}
          {onToggleChat && (
            <button
              onClick={onToggleChat}
              className={`p-4 rounded-xl transition-all duration-200 ${
                showChat
                  ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-gray-700 hover:bg-gray-600 text-white"
              }`}
              title="Toggle chat"
            >
              <MessageSquare className="w-6 h-6" />
            </button>
          )}

          {/* Participants Toggle */}
          {onToggleParticipants && (
            <button
              onClick={onToggleParticipants}
              className={`p-4 rounded-xl transition-all duration-200 relative ${
                showParticipants
                  ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-gray-700 hover:bg-gray-600 text-white"
              }`}
              title="Toggle participants"
            >
              <Users className="w-6 h-6" />
              {participantCount > 1 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {participantCount}
                </div>
              )}
            </button>
          )}

          {/* Divider */}
          <div className="w-px h-10 bg-gray-600"></div>

          {/* End Meeting (Host only) */}
          {isHost && onEndMeeting && (
            <button
              onClick={onEndMeeting}
              className="p-4 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all duration-200 shadow-lg shadow-red-600/25"
              title="End meeting for everyone"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}

          {/* Leave Call */}
          <button
            onClick={onLeaveCall}
            className="p-4 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all duration-200 shadow-lg shadow-red-500/25"
            title="Leave call"
          >
            <Phone className="w-6 h-6 rotate-[135deg]" />
          </button>
        </div>
      </div>

      {/* Click outside to close more options */}
      {showMoreOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMoreOptions(false)}
        />
      )}
    </>
  );
}
