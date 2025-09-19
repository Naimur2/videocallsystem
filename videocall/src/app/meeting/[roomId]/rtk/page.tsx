'use client';

import { VideoGrid } from '@/components/VideoGrid';
import { useRTKMediaSoup } from '@/hooks/useRTKMediaSoup';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

export default function RTKMeetingPage(): React.JSX.Element {
  const params = useParams();
  const roomId = params?.roomId as string;
  
  // Generate stable user identity
  const [currentUserId] = useState(() => `user-${Math.random().toString(36).substr(2, 9)}`);
  const [currentUserName] = useState(() => `User-${Math.random().toString(36).substr(2, 9)}`);
  const [userInteracted, setUserInteracted] = useState(false);
  
  // Use our RTK Query MediaSoup hook
  const {
    isLoading,
    isError,
    error,
    isReady,
    isConnected,
    hasVideo,
    hasAudio,
    localVideoStream,
    participants,
    participantCount,
    startVideo,
    startAudio,
    stopVideo,
    stopAudio,
    restartSession,
  } = useRTKMediaSoup({
    serverUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
    roomId,
    userId: currentUserId,
    userName: currentUserName,
    autoReconnect: true
  });

  // Handle first user interaction to enable autoplay
  const handleUserInteraction = useCallback(() => {
    if (!userInteracted) {
      setUserInteracted(true);
      console.log('🎬 User interaction detected, enabling autoplay for all videos');
      
      // Try to play all videos that need user interaction
      setTimeout(() => {
        const videos = document.querySelectorAll('video[data-needs-click]');
        videos.forEach(video => {
          const videoElement = video as HTMLVideoElement;
          videoElement.play().catch(err => 
            console.warn('Video autoplay still blocked:', err)
          );
        });
      }, 100);
    }
  }, [userInteracted]);

  // Add global click listener for user interaction
  useEffect(() => {
    if (!userInteracted) {
      document.addEventListener('click', handleUserInteraction, { once: true });
      document.addEventListener('touchstart', handleUserInteraction, { once: true });
      
      return () => {
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
      };
    }
  }, [userInteracted, handleUserInteraction]);

  // Type guard for error
  const errorMessage = isError && error 
    ? typeof error === 'string' 
      ? error 
      : 'error' in (error as any) 
        ? String((error as any).error)
        : 'Unknown connection error'
    : null;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">RTK Query Video Meeting</h1>
            <p className="text-sm text-gray-400">Room: {roomId}</p>
          </div>
          <div className="flex items-center space-x-4">
            {!userInteracted && (
              <div className="bg-yellow-600 text-white px-3 py-1 rounded text-xs">
                Click anywhere to enable video autoplay
              </div>
            )}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-300">
                {isLoading ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              {participantCount} participant{participantCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {isError && errorMessage && (
        <div className="bg-red-600 text-white px-6 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span>Connection Error: {errorMessage}</span>
            <button 
              onClick={() => restartSession()}
              className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-xs"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 p-6">
          <VideoGrid 
            participants={participants.map(p => ({
              ...p,
              videoStream: p.videoStream,
              audioStream: p.audioStream,
              isVideoEnabled: !!p.videoStream,
              isAudioEnabled: !!p.audioStream,
              isHost: false,
              isScreenSharing: false,
              joinedAt: new Date()
            }))}
            localStream={localVideoStream}
            localParticipant={{
              id: currentUserId,
              name: currentUserName,
              isVideoEnabled: hasVideo,
              isAudioEnabled: hasAudio,
              isHost: true,
              isScreenSharing: false,
              joinedAt: new Date()
            }}
            isLocalVideoEnabled={hasVideo}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
        <div className="flex items-center justify-center space-x-4">
          
          {/* Video Control */}
          <button
            onClick={hasVideo ? stopVideo : startVideo}
            disabled={!isReady}
            className={`p-3 rounded-full ${
              hasVideo 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-600 hover:bg-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            title={hasVideo ? 'Stop Video' : 'Start Video'}
          >
            {hasVideo ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            )}
          </button>

          {/* Audio Control */}
          <button
            onClick={hasAudio ? stopAudio : startAudio}
            disabled={!isReady}
            className={`p-3 rounded-full ${
              hasAudio 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-gray-600 hover:bg-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            title={hasAudio ? 'Mute Audio' : 'Unmute Audio'}
          >
            {hasAudio ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>

          {/* Leave Button */}
          <button
            onClick={() => window.close()}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
            title="Leave Meeting"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12l-4-4v3H6v2h6v3l4-4z" />
            </svg>
          </button>

          {/* Debug Info */}
          <div className="ml-8 text-xs text-gray-400">
            <div>Status: {isReady ? '✅ Ready' : '⏳ Initializing'}</div>
            <div>Video: {hasVideo ? '✅' : '❌'} | Audio: {hasAudio ? '✅' : '❌'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}