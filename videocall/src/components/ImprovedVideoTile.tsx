"use client";

import React from "react";
import { VideoPlayer } from "./VideoPlayer";

interface ImprovedVideoTileProps {
  stream: MediaStream | null;
  name: string;
  isLocal?: boolean;
  isAudioMuted?: boolean;
  isVideoMuted?: boolean;
  isScreenSharing?: boolean;
}

const ImprovedVideoTile: React.FC<ImprovedVideoTileProps> = ({
  stream,
  name,
  isLocal = false,
  isAudioMuted = false,
  isVideoMuted = false,
  isScreenSharing = false,
}) => {
  console.log(`[ImprovedVideoTile] Rendering for ${name}:`, {
    hasStream: !!stream,
    streamId: stream?.id,
    isLocal,
    isVideoMuted,
    isAudioMuted,
    isScreenSharing
  });

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Enhanced VideoPlayer Component */}
      <VideoPlayer
        stream={stream || undefined}
        muted={isLocal} // Only mute local video to prevent echo, remote videos should not be muted
        autoPlay={true}
        playsInline={true}
        className="w-full h-full object-cover"
        style={{
          transform: isLocal ? 'scaleX(-1)' : 'none',
        }}
        userId={name || 'unknown'}
        isLocal={isLocal}
        onStreamAssigned={() => console.log(`[ImprovedVideoTile] Stream assigned for ${name}`)}
        onStreamError={(error: Event) => console.error(`[ImprovedVideoTile] Stream error for ${name}:`, error)}
        onTrackEnded={() => console.log(`[ImprovedVideoTile] Track ended for ${name}`)}
        onTrackMuted={() => console.log(`[ImprovedVideoTile] Track muted for ${name}`)}
        onTrackUnmuted={() => console.log(`[ImprovedVideoTile] Track unmuted for ${name}`)}
      />

      {/* Video Muted Overlay */}
      {(isVideoMuted || !stream) && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-2 mx-auto">
              <span className="text-2xl font-bold text-white">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-white text-sm">{name}</p>
            {isVideoMuted && (
              <p className="text-gray-400 text-xs mt-1">Video muted</p>
            )}
          </div>
        </div>
      )}

      {/* Audio Muted Indicator */}
      {isAudioMuted && (
        <div className="absolute top-2 left-2 bg-red-500 text-white p-1 rounded">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Screen Sharing Indicator */}
      {isScreenSharing && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1h-5l-2 3h-2l-2-3H4a1 1 0 01-1-1V4z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* User Name Label */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        {name} {isLocal && '(You)'}
      </div>
    </div>
  );
};

export default ImprovedVideoTile;
