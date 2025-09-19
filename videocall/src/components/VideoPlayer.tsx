'use client';

import React, { useCallback, useEffect, useRef } from 'react';

interface VideoPlayerProps {
  stream?: MediaStream;
  muted?: boolean;
  autoPlay?: boolean;
  playsInline?: boolean;
  className?: string;
  style?: React.CSSProperties;
  userId?: string;
  isLocal?: boolean;
  onLoadedMetadata?: () => void;
  onError?: (error: Event) => void;
  onStreamAssigned?: () => void;
  onStreamError?: (error: Event) => void;
  onTrackEnded?: () => void;
  onTrackMuted?: () => void;
  onTrackUnmuted?: () => void;
}

/**
 * 🎥 ENHANCED VIDEO PLAYER
 * 
 * Handles common WebRTC video display issues:
 * - Proper stream assignment with error handling
 * - Browser autoplay policy compliance
 * - Stream track validation
 * - Loading states and error recovery
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  stream,
  muted = false,
  autoPlay = true,
  playsInline = true,
  className = '',
  style,
  userId = 'unknown',
  isLocal = false,
  onLoadedMetadata,
  onError,
  onStreamAssigned,
  onStreamError,
  onTrackEnded,
  onTrackMuted,
  onTrackUnmuted
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previousStreamId = useRef<string>('');
  
  const handleVideoError = useCallback((event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error(`❌ Video error for ${userId}:`, event);
    onError?.(event.nativeEvent);
    onStreamError?.(event.nativeEvent);
  }, [userId, onError, onStreamError]);
  
  const handleLoadedMetadata = useCallback(() => {
    console.log(`✅ Video metadata loaded for ${userId}`);
    onLoadedMetadata?.();
  }, [userId, onLoadedMetadata]);
  
  const handleTrackEnded = useCallback(() => {
    console.log(`📹 Video track ended for ${userId}`);
    onTrackEnded?.();
  }, [userId, onTrackEnded]);
  
  const handleTrackMuted = useCallback(() => {
    console.log(`🔇 Video track muted for ${userId}`);
    onTrackMuted?.();
  }, [userId, onTrackMuted]);
  
  const handleTrackUnmuted = useCallback(() => {
    console.log(`🔊 Video track unmuted for ${userId}`);
    onTrackUnmuted?.();
  }, [userId, onTrackUnmuted]);
  
  const assignStream = useCallback(async (video: HTMLVideoElement, mediaStream: MediaStream) => {
    try {
      console.log(`🎥 Assigning stream to video element:`, {
        userId,
        streamId: mediaStream.id,
        isLocal,
        active: mediaStream.active,
        videoTracks: mediaStream.getVideoTracks().length,
        audioTracks: mediaStream.getAudioTracks().length
      });
      
      // Validate stream
      if (!mediaStream.active) {
        throw new Error('Stream is not active');
      }
      
      const videoTracks = mediaStream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error('No video tracks in stream');
      }
      
      // Check track state and force enable for remote streams
      const videoTrack = videoTracks[0];
      console.log(`📹 Video track details for ${userId}:`, {
        id: videoTrack.id,
        kind: videoTrack.kind,
        enabled: videoTrack.enabled,
        muted: videoTrack.muted,
        readyState: videoTrack.readyState,
        settings: videoTrack.getSettings?.(),
        capabilities: videoTrack.getCapabilities?.()
      });
      
      // CRITICAL: Force enable video track (especially for remote streams)
      if (!videoTrack.enabled) {
        console.log(`🔧 Force enabling video track for ${userId}`);
        videoTrack.enabled = true;
      }
      
      // CRITICAL: Check for problematic track states - this is likely the issue!
      if (videoTrack.readyState === 'ended') {
        console.error(`❌ Video track has ended for ${userId} - this will cause black video!`);
        throw new Error('Video track has ended');
      }
      
      if (videoTrack.readyState !== 'live') {
        console.error(`❌ Video track is not live for ${userId}, state: ${videoTrack.readyState} - this will cause black video!`);
      }
      
      if (videoTrack.muted) {
        console.warn(`⚠️ Video track is muted for ${userId}, this may cause blank video`);
        // Try to unmute if possible (may not work for remote tracks)
        try {
          videoTrack.enabled = true;
          console.log(`🔧 Attempted to enable muted track for ${userId}`);
        } catch (e) {
          console.warn(`⚠️ Could not unmute track for ${userId}:`, e);
        }
      }
      
      // Clear previous stream
      if (video.srcObject) {
        const oldStream = video.srcObject as MediaStream;
        oldStream.getTracks().forEach(track => {
          track.removeEventListener('ended', handleTrackEnded);
        });
      }
      
      // Assign new stream
      video.srcObject = mediaStream;
      previousStreamId.current = mediaStream.id;
      
      // CRITICAL DEBUG: Verify stream assignment immediately
      console.log(`🔍 Stream assignment verification for ${userId}:`, {
        srcObjectSet: !!video.srcObject,
        srcObjectId: video.srcObject ? (video.srcObject as MediaStream).id : 'null',
        originalStreamId: mediaStream.id,
        videoReady: video.readyState,
        videoDimensions: `${video.videoWidth}x${video.videoHeight}`,
        videoCurrentTime: video.currentTime,
        videoPaused: video.paused,
        videoMuted: video.muted,
        videoAutoplay: video.autoplay,
        videoPlaysInline: video.playsInline
      });
      
      // CRITICAL: Force a play attempt immediately after assignment for debugging
      if (autoPlay && !muted) {
        console.log(`🚀 Attempting immediate play for remote stream ${userId}`);
        try {
          const immediatePlayPromise = video.play();
          if (immediatePlayPromise) {
            immediatePlayPromise
              .then(() => console.log(`✅ Immediate play success for ${userId}`))
              .catch(err => console.warn(`⚠️ Immediate play failed for ${userId}:`, err.name, err.message));
          }
        } catch (immediateErr) {
          console.warn(`⚠️ Immediate play exception for ${userId}:`, immediateErr);
        }
      }
      
      // Add comprehensive video element event listeners for debugging
      video.addEventListener('loadstart', () => {
        console.log(`🎬 Video loadstart for ${userId}`);
      });
      
      video.addEventListener('loadeddata', () => {
        console.log(`📊 Video loadeddata for ${userId} - dimensions: ${video.videoWidth}x${video.videoHeight}`);
      });
      
      video.addEventListener('canplay', () => {
        console.log(`▶️ Video canplay for ${userId}`);
      });
      
      video.addEventListener('playing', () => {
        console.log(`🎯 Video playing for ${userId}`);
      });
      
      video.addEventListener('waiting', () => {
        console.log(`⏳ Video waiting for ${userId}`);
      });
      
      video.addEventListener('stalled', () => {
        console.log(`⚠️ Video stalled for ${userId}`);
      });
      
      // Notify successful assignment
      onStreamAssigned?.();
      
      // Add track listeners
      videoTrack.addEventListener('ended', handleTrackEnded);
      videoTrack.addEventListener('mute', handleTrackMuted);
      videoTrack.addEventListener('unmute', handleTrackUnmuted);
      
      // Force play for autoplay with better error handling
      if (autoPlay) {
        try {
          // CRITICAL: Use the muted prop as-is, don't override it
          // muted={isLocal} from ImprovedVideoTile means:
          // - Local: muted=true (to prevent echo)
          // - Remote: muted=false (to allow audio and proper video rendering)
          video.muted = muted; // Use the prop directly!
          
          console.log(`🎬 Starting video playback for ${userId}:`, {
            isLocal,
            muted: video.muted,
            mutedProp: muted,
            autoplay: video.autoplay,
            playsInline: video.playsInline,
            readyState: video.readyState,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight
          });
          
          const playPromise = video.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log(`✅ Video playing successfully for ${userId}:`, {
              muted: video.muted,
              paused: video.paused,
              currentTime: video.currentTime,
              duration: video.duration,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight
            });
          }
        } catch (playError: any) {
          console.error(`❌ Video play failed for ${userId}:`, {
            error: playError.name,
            message: playError.message,
            muted: video.muted,
            readyState: video.readyState
          });
          
          // Try again with muted = true for better autoplay compliance
          if (!video.muted) {
            console.log(`🔧 Retrying with muted=true for ${userId}`);
            try {
              video.muted = true;
              await video.play();
              console.log(`✅ Video playing with muted=true for ${userId}`);
            } catch (retryError: any) {
              console.error(`❌ Retry failed for ${userId}:`, retryError);
            }
          }
          
          // Add visual indicator for click-to-play
          if (playError.name === 'NotAllowedError' || playError.name === 'AbortError') {
            video.setAttribute('data-needs-click', 'true');
            video.classList.add('needs-interaction');
            
            // Add one-time click handler
            const playOnClick = async (event: Event) => {
              event.stopPropagation();
              try {
                video.muted = muted; // Restore original muted state
                await video.play();
                console.log(`✅ Manual play successful for ${userId}`);
                video.removeAttribute('data-needs-click');
                video.classList.remove('needs-interaction');
                video.removeEventListener('click', playOnClick);
              } catch (clickError) {
                console.error(`❌ Manual play failed for ${userId}:`, clickError);
              }
            };
            
            video.addEventListener('click', playOnClick);
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ Failed to assign stream for ${userId}:`, error);
      throw error;
    }
  }, [userId, isLocal, autoPlay, muted, onStreamAssigned, handleTrackEnded, handleTrackMuted, handleTrackUnmuted]);
  
  // Stream assignment effect
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (stream && stream.id !== previousStreamId.current) {
      assignStream(video, stream).catch(error => {
        console.error(`❌ Stream assignment failed for ${userId}:`, error);
      });
    } else if (!stream && video.srcObject) {
      console.log(`🧹 Clearing video stream for ${userId}`);
      video.srcObject = null;
      previousStreamId.current = '';
    }
  }, [stream, assignStream, userId]);
  
  // Cleanup on unmount
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (video?.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.removeEventListener('ended', handleTrackEnded);
          track.removeEventListener('mute', handleTrackMuted);
          track.removeEventListener('unmute', handleTrackUnmuted);
        });
      }
    };
  }, [handleTrackEnded, handleTrackMuted, handleTrackUnmuted]);
  
  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        autoPlay={autoPlay}
        playsInline={playsInline}
        muted={muted}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleVideoError}
        className="w-full h-full object-cover bg-gray-900"
        style={{ 
          minHeight: '200px', 
          backgroundColor: 'black', // Debugging: make video element visible
          border: process.env.NODE_ENV === 'development' ? '2px solid red' : 'none', // Debug border
          ...style 
        }}
      />
      
      {/* Click to play overlay - improved */}
      {stream && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 cursor-pointer opacity-0 transition-opacity video-needs-click:opacity-100"
          onClick={() => {
            const video = videoRef.current;
            if (video && video.hasAttribute('data-needs-click')) {
              video.click();
            }
          }}
        >
          <div className="text-white text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2 mx-auto hover:bg-opacity-30 transition-all">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <div className="text-sm font-medium">Click to play video</div>
            <div className="text-xs opacity-75 mt-1">Autoplay was blocked</div>
          </div>
        </div>
      )}
      
      {/* Loading indicator */}
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-white text-center">
            <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
            <div className="text-sm">Loading video...</div>
          </div>
        </div>
      )}
      
      {/* Stream info overlay (only in development) */}
      {process.env.NODE_ENV === 'development' && stream && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          <div>User: {userId}</div>
          <div>Stream: {stream.id.substring(0, 8)}...</div>
          <div>Active: {stream.active ? '✅' : '❌'}</div>
          <div>Video Tracks: {stream.getVideoTracks().length}</div>
          <div>Audio Tracks: {stream.getAudioTracks().length}</div>
        </div>
      )}
    </div>
  );
};