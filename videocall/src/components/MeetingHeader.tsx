import React from 'react';

interface MeetingHeaderProps {
  roomId: string;
  callDuration: number;
  participantCount: number;
  onCopyLink: () => void;
  showCopiedToast: boolean;
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const MeetingHeader: React.FC<MeetingHeaderProps> = ({
  roomId,
  callDuration,
  participantCount,
  onCopyLink,
  showCopiedToast,
}) => {
  return (
    <div className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-6 text-sm text-gray-300">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>Room: {roomId}</span>
        </div>
        <div>Duration: {formatDuration(callDuration)}</div>
        <div>Participants: {participantCount}</div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={onCopyLink}
          className="text-gray-400 hover:text-white transition-colors text-sm"
          title="Copy room link"
        >
          📋 Copy Link
        </button>
        {showCopiedToast && (
          <span className="text-green-400 text-sm">Copied!</span>
        )}
      </div>
    </div>
  );
};
