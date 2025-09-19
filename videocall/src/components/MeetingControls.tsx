import { EnhancedControlPanel } from '@/components/EnhancedControlPanel';
import React from 'react';

interface MeetingControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  participants: any[];
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHandRaise: () => void;
  onEndMeeting: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleSettings: () => void;
  onToggleFullscreen: () => void;
  showCopiedToast: boolean;
  roomId: string;
  callDuration: number;
  isFullscreen: boolean;
  showChat: boolean;
  showParticipants: boolean;
}

export const MeetingControls: React.FC<MeetingControlsProps> = ({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isHandRaised,
  participants,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHandRaise,
  onEndMeeting,
  onToggleChat,
  onToggleParticipants,
  onToggleSettings,
  onToggleFullscreen,
  showCopiedToast,
  roomId,
  callDuration,
  isFullscreen,
  showChat,
  showParticipants,
}) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const copyRoomLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch (err) {
      console.error('Failed to copy room link:', err);
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
        {/* Meeting Info Bar */}
        <div className="px-4 py-2 bg-gray-900 border-b border-gray-700 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4 text-gray-300">
            <span>Room: {roomId}</span>
            <span>Duration: {formatDuration(callDuration)}</span>
            <span>Participants: {participants.length + 1}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={copyRoomLink}
              className="text-gray-400 hover:text-white transition-colors"
            >
              📋
            </button>
            {showCopiedToast && (
              <span className="text-green-400 text-xs">Copied!</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-3">
          <EnhancedControlPanel
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={isScreenSharing}
            isHandRaised={isHandRaised}
            participantCount={participants.length + 1}
            callDuration={formatDuration(callDuration)}
            onToggleAudio={onToggleAudio}
            onToggleVideo={onToggleVideo}
            onToggleScreenShare={onToggleScreenShare}
            onToggleHandRaise={onToggleHandRaise}
            onLeaveCall={onEndMeeting}
            onEndMeeting={onEndMeeting}
            onToggleChat={onToggleChat}
            onToggleParticipants={onToggleParticipants}
            onToggleSettings={onToggleSettings}
            onToggleFullscreen={onToggleFullscreen}
            isFullscreen={isFullscreen}
            showChat={showChat}
            showParticipants={showParticipants}
          />
        </div>
      </div>
    </div>
  );
};
