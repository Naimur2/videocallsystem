'use client';

import React, { useMemo } from 'react';
import ImprovedVideoTile from './ImprovedVideoTile';

interface Participant {
  id: string;
  name: string;
  videoStream?: MediaStream | null;
  audioStream?: MediaStream | null;
  isVideoMuted?: boolean;
  isAudioMuted?: boolean;
  isScreenSharing?: boolean;
}

interface ImprovedVideoGridProps {
  participants: Participant[];
  localStream: MediaStream | null;
  currentUserId: string;
  currentUserName: string;
  isLocalVideoMuted: boolean;
  isLocalAudioMuted: boolean;
  hasLocalStream: boolean;
  isScreenSharing: boolean;
}

const ImprovedVideoGrid: React.FC<ImprovedVideoGridProps> = ({
  participants,
  localStream,
  currentUserId,
  currentUserName,
  isLocalVideoMuted,
  isLocalAudioMuted,
  hasLocalStream,
  isScreenSharing,
}) => {
  // Memoize participants to prevent unnecessary re-renders
  const stableParticipants = useMemo(() => {
    // Only log when participants actually change, not on every render
    const participantIds = participants.map(p => p.id).sort();
    const streamIds = participants.map(p => p.videoStream?.id || 'none').sort();
    
    console.log('[ImprovedVideoGrid] 🔄 Participants changed:', {
      participantIds,
      streamIds,
      count: participants.length
    });
    
    return participants.map(p => ({
      ...p,
      // PRESERVE the mapped streams - don't override with null
      videoStream: p.videoStream,
      audioStream: p.audioStream,
    }));
  }, [participants]);

  // Memoize local participant
  const localParticipant = useMemo(() => ({
    id: currentUserId,
    name: currentUserName,
    videoStream: localStream,
    isVideoMuted: isLocalVideoMuted,
    isAudioMuted: isLocalAudioMuted,
    isScreenSharing,
  }), [currentUserId, currentUserName, localStream, isLocalVideoMuted, isLocalAudioMuted, isScreenSharing]);

  // Calculate grid layout
  const totalParticipants = stableParticipants.length + (hasLocalStream ? 1 : 0);
  
  const getGridCols = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  const gridCols = getGridCols(totalParticipants);

  console.log('[ImprovedVideoGrid] Rendering:', {
    totalParticipants,
    remoteParticipants: stableParticipants.length,
    hasLocalStream,
    isScreenSharing,
    gridCols,
  });

  // Add detailed stream debugging
  console.log('[ImprovedVideoGrid] 🔍 Stream Analysis:', {
    currentUserId,
    currentUserName,
    localStream: {
      exists: !!localStream,
      id: localStream?.id,
      active: localStream?.active,
      videoTracks: localStream?.getVideoTracks()?.length || 0,
      audioTracks: localStream?.getAudioTracks()?.length || 0,
      videoTrackSettings: localStream?.getVideoTracks()[0]?.getSettings(),
    },
    participants: stableParticipants.map(p => ({
      id: p.id,
      name: p.name,
      hasVideoStream: !!p.videoStream,
      hasAudioStream: !!p.audioStream,
      videoStreamId: p.videoStream?.id,
      videoStreamActive: p.videoStream?.active,
      videoTracks: p.videoStream?.getVideoTracks()?.length || 0,
      audioTracks: p.videoStream?.getAudioTracks()?.length || 0,
    }))
  });

  return (
    <div className="w-full h-full p-4">
      {totalParticipants === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-400">
            <p className="text-lg">Waiting for participants...</p>
            <p className="text-sm mt-2">Share the room link to invite others</p>
          </div>
        </div>
      ) : (
        <div className={`grid ${gridCols} gap-4 h-full auto-rows-fr`}>
          {/* Local video tile */}
          {hasLocalStream && (
            <div className="relative min-h-[200px]">
              <ImprovedVideoTile
                stream={localParticipant.videoStream || null}
                name={localParticipant.name}
                isLocal={true}
                isAudioMuted={localParticipant.isAudioMuted}
                isVideoMuted={localParticipant.isVideoMuted}
                isScreenSharing={localParticipant.isScreenSharing}
              />
            </div>
          )}

          {/* Remote video tiles */}
          {stableParticipants.map((participant) => (
            <div key={participant.id} className="relative min-h-[200px]">
              <ImprovedVideoTile
                stream={participant.videoStream || null}
                name={participant.name}
                isLocal={false}
                isAudioMuted={participant.isAudioMuted}
                isVideoMuted={participant.isVideoMuted}
                isScreenSharing={participant.isScreenSharing}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImprovedVideoGrid;