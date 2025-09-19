"use client";

import { Participant } from "@/types";
import { useEffect, useRef } from "react";

interface SimpleVideoTileProps {
  participant?: Participant;
  isLocal?: boolean;
  stream?: MediaStream | null;
  isVideoEnabled?: boolean;
}

export const SimpleVideoTile = ({
  participant,
  isLocal = false,
  stream,
}: SimpleVideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Single, stable video setup
  useEffect(() => {
    if (!stream || !videoRef.current) return;

    const video = videoRef.current;
    const participantName = participant?.name || 'unknown';
    
    // Simple video setup
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = isLocal;
    video.controls = false;

    // Single play attempt
    const playVideo = async () => {
      try {
        await video.play();
        console.log(`[SimpleVideoTile] Playing video for ${participantName}`);
      } catch (error) {
        console.warn(`[SimpleVideoTile] Play failed, trying muted for ${participantName}`);
        video.muted = true;
        try {
          await video.play();
        } catch (e) {
          console.error(`[SimpleVideoTile] All play attempts failed for ${participantName}`);
        }
      }
    };

    // Minimal error handling
    const handleError = () => {
      console.error(`[SimpleVideoTile] Video error for ${participantName}`);
    };

    video.addEventListener('error', handleError);
    
    // Play with small delay
    setTimeout(playVideo, 50);

    return () => {
      video.removeEventListener('error', handleError);
      if (video.srcObject) {
        video.srcObject = null;
      }
    };
  }, [stream, isLocal]); // Minimal dependencies

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video min-h-0 min-w-0 w-full h-full">
      {stream ? (
        <>
          <video
            ref={videoRef}
            className="w-full h-full object-cover bg-black"
          />
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
            <div className="text-white text-sm">No Stream</div>
          </div>
        </div>
      )}
    </div>
  );
};
