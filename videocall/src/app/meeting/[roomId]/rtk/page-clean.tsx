'use client';

import { VideoGrid } from '@/components/VideoGrid';
import { useRTKMediaSoup } from '@/hooks/useRTKMediaSoup';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';

export default function RTKMeetingPage(): React.JSX.Element {
  const params = useParams();
  const roomId = params?.roomId as string;
  
  // Generate stable user identity
  const [currentUserId] = useState(() => `user-${Math.random().toString(36).substr(2, 9)}`);
  const [currentUserName] = useState(() => `User-${Math.random().toString(36).substr(2, 9)}`);
  
  // Use our RTK Query MediaSoup hook
  const hookResult = useRTKMediaSoup({
    serverUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
    roomId,
    userId: currentUserId,
    userName: currentUserName,
    autoReconnect: true
  });

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
  } = hookResult;

  // Type guard for error
  const getErrorMessage = (): string => {
    if (!isError || !error) return '';
    if (typeof error === 'string') return error;
    if (typeof error === 'object' && error !== null && 'error' in error) {
      return String((error as any).error);
    }
    return 'Unknown connection error';
  };

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
      {isError && (
        <div className="bg-red-600 text-white px-6 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span>Connection Error: {getErrorMessage()}</span>
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
        {/* Video Grid */}
        <div className="flex-1 p-6">
          <VideoGrid
            localStream={localVideoStream}
            participants={participants.map(p => ({
              ...p,
              isHost: false,
              isAudioEnabled: !!p.audioStream,
              isVideoEnabled: !!p.videoStream,
              isScreenSharing: false,
              joinedAt: new Date()
            }))}
            localParticipant={{
              id: currentUserId,
              name: currentUserName,
              isHost: true,
              isAudioEnabled: hasAudio,
              isVideoEnabled: hasVideo,
              isScreenSharing: false,
              joinedAt: new Date()
            }}
            isLocalVideoEnabled={hasVideo}
          />
        </div>

        {/* Controls Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-6">
          <div className="space-y-6">
            {/* Connection Status */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Connection Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                    {isLoading ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ready:</span>
                  <span className={isReady ? 'text-green-400' : 'text-yellow-400'}>
                    {isReady ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Participants:</span>
                  <span className="text-white">{participantCount}</span>
                </div>
              </div>
            </div>

            {/* Media Controls */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Media Controls</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Video:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={startVideo}
                      disabled={!isReady || hasVideo}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-700"
                    >
                      Start
                    </button>
                    <button
                      onClick={stopVideo}
                      disabled={!hasVideo}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-red-700"
                    >
                      Stop
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Audio:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={startAudio}
                      disabled={!isReady || hasAudio}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-green-700"
                    >
                      Start
                    </button>
                    <button
                      onClick={stopAudio}
                      disabled={!hasAudio}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-red-700"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Debug Info */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Debug Info</h3>
              <div className="space-y-1 text-xs text-gray-400">
                <div>Room: {roomId}</div>
                <div>User: {currentUserId}</div>
                <div>Video Stream: {localVideoStream ? 'Active' : 'Inactive'}</div>
                <div>Has Video: {hasVideo ? 'Yes' : 'No'}</div>
                <div>Has Audio: {hasAudio ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}