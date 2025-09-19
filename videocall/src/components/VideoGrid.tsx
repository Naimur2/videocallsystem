"use client";

import { Participant } from "@/types";
import React from "react";

interface VideoTileProps {
  participant?: Participant;
  isLocal?: boolean;
  stream?: globalThis.MediaStream | null;
  isVideoEnabled?: boolean;
}

const VideoTile: React.FC<VideoTileProps> = ({ participant, isLocal = false, stream, isVideoEnabled = true }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Determine if we should show video
  const showVideo = stream && isVideoEnabled;

  // Get participant name for display
  const participantName = isLocal ? "You" : (participant?.name || "Unknown");
  const displayInitial = participantName.charAt(0).toUpperCase();

  // Proper video stream assignment with error handling
  React.useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && stream) {
      console.log(`🎥 Setting video stream for ${participantName}:`, stream);
      
      // Clear any existing stream
      if (videoElement.srcObject) {
        videoElement.srcObject = null;
      }
      
      // Set new stream
      videoElement.srcObject = stream;
      
      // Handle video play promise
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`✅ Video playing for ${participantName}`);
          })
          .catch((error) => {
            console.error(`❌ Video play failed for ${participantName}:`, error);
          });
      }
    }
    
    // Cleanup function
    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [stream, participantName]);

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
      {showVideo ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            controls={false}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
            {participantName}
          </div>
        </>
      ) : (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold mb-2">
              {displayInitial}
            </div>
            <div className="text-white text-sm mb-1">{participantName}</div>
            <div className="text-gray-400 text-xs">
              {stream ? "Camera Off" : "No Stream"}
            </div>
          </div>
        </div>
      )}
      
      {/* Audio indicator */}
      {(isLocal || participant) && (
        <div className="absolute top-2 left-2">
          {isLocal ? (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          ) : participant?.isAudioEnabled ? (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          ) : (
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-white rounded-full relative">
                <div className="absolute inset-0 border-t-2 border-white transform rotate-45"></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Calculate grid layout based on participant count
const getGridLayout = (count: number) => {
  if (count === 1) return { rows: 1, cols: 1 };
  if (count === 2) return { rows: 1, cols: 2 };
  if (count <= 4) return { rows: 2, cols: 2 };
  if (count <= 6) return { rows: 2, cols: 3 };
  if (count <= 9) return { rows: 3, cols: 3 };
  if (count <= 12) return { rows: 3, cols: 4 };
  if (count <= 16) return { rows: 4, cols: 4 };
  return { rows: 4, cols: 4 }; // Max 16 visible participants
};

interface VideoGridProps {
  participants: (Participant & { videoStream?: MediaStream })[];
  localStream: MediaStream | null;
  localParticipant?: Participant;
  isLocalVideoEnabled?: boolean;
  isScreenSharing?: boolean;
  screenStream?: MediaStream | null;
  onRetryMedia?: () => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  participants = [],
  localStream,
  localParticipant,
  isLocalVideoEnabled = true,
  isScreenSharing = false,
  screenStream,
  onRetryMedia,
}) => {
  // Combine local and remote participants for grid calculation
  const totalParticipants = (localStream ? 1 : 0) + participants.length;
  const remoteParticipants = participants;

  // Calculate grid layout
  const { rows, cols } = getGridLayout(totalParticipants);

  console.log("[VideoGrid] Rendering with:", {
    totalParticipants,
    remoteParticipants: remoteParticipants.length,
    hasLocalStream: !!localStream,
    isScreenSharing,
    rows,
    cols,
  });

  // Screen sharing layout
  if (isScreenSharing && screenStream) {
    return (
      <div className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-hidden h-full">
        <div className="flex h-full gap-4 p-4">
          {/* Main screen share area */}
          <div className="flex-1 bg-black rounded-lg flex items-center justify-center">
            <div className="w-full h-full max-w-full max-h-full">
              <VideoTile
                participant={localParticipant}
                isLocal={true}
                stream={screenStream}
                isVideoEnabled={true}
              />
            </div>

            {/* Screen sharing indicator overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="bg-black/50 rounded-lg p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  You are presenting
                </h2>
                <p className="text-gray-300 text-lg">
                  Others can see your screen
                </p>
                <div className="mt-4 px-4 py-2 bg-green-500/20 rounded-lg">
                  <p className="text-green-300 text-sm">
                    ✓ Screen sharing active
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Participant thumbnails sidebar */}
          <div className="w-48 flex flex-col gap-2 overflow-y-auto">
            {/* Local participant thumbnail */}
            {localStream && (
              <div className="aspect-video">
                <VideoTile
                  participant={localParticipant}
                  isLocal={true}
                  stream={localStream}
                  isVideoEnabled={isLocalVideoEnabled}
                />
              </div>
            )}

            {/* Remote participant thumbnails */}
            {remoteParticipants.map((participant) => (
              <div key={participant.id} className="aspect-video">
                <VideoTile
                  participant={participant}
                  stream={participant.videoStream || null}
                  isVideoEnabled={participant.isVideoEnabled}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Normal grid layout when not screen sharing
  return (
    <div className="flex-1 p-4 bg-gray-100 dark:bg-gray-900 overflow-hidden h-full">
      {/* Show notification when no media access */}
      {!localStream && (
        <div className="mb-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">
              Camera/microphone access is not available. You can still
              participate in the meeting.
              <button
                onClick={() => onRetryMedia?.()}
                className="ml-2 underline hover:no-underline"
              >
                Try again
              </button>
            </span>
          </div>
        </div>
      )}

      <div
        className="grid gap-4 w-full h-full max-w-full max-h-full"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          maxHeight: "calc(100vh - 200px)",
          height: "calc(100vh - 200px)",
        }}
      >
        {/* Local participant (always first if present) */}
        {localStream && (
          <VideoTile
            participant={localParticipant}
            isLocal={true}
            stream={localStream}
            isVideoEnabled={isLocalVideoEnabled}
          />
        )}

        {/* Remote participants */}
        {remoteParticipants.map((participant) => (
          <VideoTile
            key={participant.id}
            participant={participant}
            stream={participant.videoStream || null}
            isVideoEnabled={participant.isVideoEnabled}
          />
        ))}

        {/* Show participant count if more than visible */}
        {totalParticipants > 16 && (
          <div className="bg-gray-800 rounded-lg flex items-center justify-center text-white">
            <div className="text-center">
              <div className="text-2xl font-bold">
                +{totalParticipants - 16}
              </div>
              <div className="text-sm">more participants</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
