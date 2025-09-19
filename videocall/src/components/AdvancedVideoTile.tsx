"use client";

import { Participant } from "@/types";
import React from "react";

interface AdvancedVideoTileProps {
  participant?: Participant;
  isLocal?: boolean;
  stream?: globalThis.MediaStream | null;
  isVideoEnabled?: boolean;
}

export const AdvancedVideoTile: React.FC<AdvancedVideoTileProps> = ({
  participant,
  isLocal = false,
  stream,
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  // Removed unused canvasRef

  // Stable video setup - preventing infinite re-renders
  React.useEffect(() => {
    if (stream && videoRef.current) {
      const video = videoRef.current;
      const participantName = participant?.name || 'unknown';
      
      console.log(`[AdvancedVideoTile] Setting up video for ${participantName}`, { streamId: stream.id });

      // Configure video element once
      video.autoplay = true;
      video.playsInline = true;
      video.muted = isLocal;
      video.controls = false;
      video.preload = 'metadata';
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      
      // Set stream
      video.srcObject = stream;

      // Single play attempt - no loops
      const playVideo = async () => {
        try {
          await video.play();
          console.log(`[AdvancedVideoTile] ✅ Video playing for ${participantName}`);
        } catch (error) {
          console.warn(`[AdvancedVideoTile] Play failed for ${participantName}, trying muted:`, error);
          video.muted = true;
          try {
            await video.play();
            console.log(`[AdvancedVideoTile] ✅ Muted play successful for ${participantName}`);
          } catch (mutedError) {
            console.error(`[AdvancedVideoTile] Both play attempts failed:`, mutedError);
          }
        }
      };

      // Minimal event handlers - no cascading calls
      const handleLoadedMetadata = () => {
        console.log(`[AdvancedVideoTile] Metadata loaded for ${participantName}`, {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        });
      };

      const handleError = (e: Event) => {
        const errorInfo = (e.target as HTMLVideoElement)?.error;
        console.error(`[AdvancedVideoTile] Video error for ${participantName}:`, {
          code: errorInfo?.code,
          message: errorInfo?.message
        });
      };

      // Only essential event listeners
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('error', handleError);

      // Single play attempt with delay
      setTimeout(playVideo, 100);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('error', handleError);
        if (video.srcObject) {
          video.srcObject = null;
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream?.id, isLocal, participant?.name]); // Stream.id is stable, full stream object would cause infinite re-renders

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video min-h-0 min-w-0 w-full h-full">
      {stream ? (
        <>
          {/* Primary video element */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ backgroundColor: '#000000' }}
            poster=""
          />
          
          {/* Participant name overlay */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
            {isLocal ? "You" : participant?.name || "Unknown"}
          </div>
        </>
      ) : (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold mb-2">
              {participant?.name ? participant.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="text-white text-sm">No Stream Available</div>
          </div>
        </div>
      )}
    </div>
  );
};
