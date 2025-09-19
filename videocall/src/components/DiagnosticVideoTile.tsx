"use client";

import { Participant } from "@/types";
import React from "react";

interface DiagnosticVideoTileProps {
  participant?: Participant;
  isLocal?: boolean;
  stream?: globalThis.MediaStream | null;
  isVideoEnabled?: boolean;
}

export const DiagnosticVideoTile: React.FC<DiagnosticVideoTileProps> = ({
  participant,
  isLocal = false,
  stream,
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [diagnostics, setDiagnostics] = React.useState<any>({});
  
  // Comprehensive diagnostics
  React.useEffect(() => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      const trackDetails = {
        streamId: stream.id,
        streamActive: stream.active,
        videoTracks: videoTracks.map(track => ({
          id: track.id,
          label: track.label,
          kind: track.kind,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings?.(),
          constraints: track.getConstraints?.(),
          capabilities: track.getCapabilities?.(),
        })),
        audioTracks: audioTracks.map(track => ({
          id: track.id,
          label: track.label,
          kind: track.kind,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings?.(),
        }))
      };
      
      setDiagnostics(trackDetails);
      console.log(`[DiagnosticVideoTile] Complete track analysis for ${participant?.name}:`, trackDetails);
    }
  }, [stream, participant?.name]);

  // Set up video with multiple fallback strategies
  React.useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current;
      
      console.log(`[DiagnosticVideoTile] Setting up video for ${participant?.name}`);
      
      // Strategy 1: Direct assignment with properties
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = isLocal;
      
      // Strategy 2: Force play with error handling
      const forcePlay = async () => {
        try {
          await video.play();
          console.log(`[DiagnosticVideoTile] ✅ Video playing for ${participant?.name}`);
        } catch (error) {
          console.error(`[DiagnosticVideoTile] ❌ Play failed for ${participant?.name}:`, error);
        }
      };
      
      // Try to play immediately
      forcePlay();
      
      // Event handlers for debugging
      const handleLoadedMetadata = () => {
        console.log(`[DiagnosticVideoTile] Metadata loaded for ${participant?.name}:`, {
          duration: video.duration,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState
        });
        forcePlay();
      };
      
      const handleLoadedData = () => {
        console.log(`[DiagnosticVideoTile] Data loaded for ${participant?.name}`);
        forcePlay();
      };
      
      const handleCanPlay = () => {
        console.log(`[DiagnosticVideoTile] Can play ${participant?.name}`);
        forcePlay();
      };
      
      const handlePlay = () => {
        console.log(`[DiagnosticVideoTile] ✅ Started playing ${participant?.name}`);
      };
      
      const handleError = (e: Event) => {
        console.error(`[DiagnosticVideoTile] ❌ Video error for ${participant?.name}:`, {
          error: (e.target as HTMLVideoElement)?.error,
          networkState: video.networkState,
          readyState: video.readyState
        });
      };
      
      const handlePause = () => {
        console.log(`[DiagnosticVideoTile] ⏸️ Video paused for ${participant?.name}`);
        // Auto-resume if paused unexpectedly
        setTimeout(() => forcePlay(), 100);
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('play', handlePlay);
      video.addEventListener('error', handleError);
      video.addEventListener('pause', handlePause);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('error', handleError);
        video.removeEventListener('pause', handlePause);
      };
    }
  }, [stream, participant?.name, isLocal]);
  
  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video min-h-0 min-w-0 w-full h-full max-w-full max-h-full">
      {stream ? (
        <>
          {/* Primary video element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className="w-full h-full object-cover max-w-full max-h-full"
            style={{ backgroundColor: 'red' }}
          />
          
          {/* Enhanced debug overlay */}
          <div className="absolute top-0 left-0 bg-green-500 text-white text-xs p-1 max-w-full overflow-hidden">
            <div>Stream: {stream.id.slice(0, 8)}...</div>
            <div>Tracks: V:{diagnostics.videoTracks?.length || 0} A:{diagnostics.audioTracks?.length || 0}</div>
            <div>Active: {stream.active ? 'YES' : 'NO'}</div>
            {diagnostics.videoTracks?.[0] && (
              <div>
                State: {diagnostics.videoTracks[0].readyState}
                {diagnostics.videoTracks[0].enabled ? ' EN' : ' DIS'}
                {diagnostics.videoTracks[0].muted ? ' MUT' : ' UNM'}
              </div>
            )}
          </div>
          
          {/* Detailed diagnostics overlay (bottom) */}
          <div className="absolute bottom-0 left-0 bg-black bg-opacity-80 text-white text-xs p-1 max-w-full overflow-hidden">
            <div>Video: {diagnostics.videoTracks?.[0]?.settings?.width}x{diagnostics.videoTracks?.[0]?.settings?.height}</div>
            <div>FPS: {diagnostics.videoTracks?.[0]?.settings?.frameRate}</div>
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
      
      {/* Participant info */}
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
        {isLocal ? "You" : participant?.name || "Unknown"}
      </div>
    </div>
  );
};
