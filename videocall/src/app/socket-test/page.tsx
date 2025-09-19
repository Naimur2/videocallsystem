// Test page for socket improvements
'use client';

import { useRTKMediaSoup } from '@/hooks/useRTKMediaSoup';
import { useState } from 'react';

export default function SocketTestPage() {
  const [roomId] = useState(`test-room-${Date.now()}`);
  const [userId] = useState(`user-${Math.random().toString(36).substring(7)}`);
  const [userName] = useState(`TestUser-${Math.random().toString(36).substring(7)}`);
  
  const {
    session,
    isLoading,
    isError,
    error,
    isReady,
    isConnected,
    hasVideo,
    hasAudio,
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
    userId,
    userName,
    autoReconnect: true
  });

  const errorMessage = error 
    ? typeof error === 'string' 
      ? error 
      : typeof error === 'object' && error !== null && 'error' in error
        ? String((error as any).error)
        : 'Unknown error'
    : null;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">🧪 Socket Improvement Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Connection Status Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              🔌 Connection Status
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Loading:</span>
                <span className={`font-semibold ${isLoading ? 'text-blue-600' : 'text-gray-500'}`}>
                  {isLoading ? '🔄 Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Connected:</span>
                <span className={`font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Ready:</span>
                <span className={`font-semibold ${isReady ? 'text-green-600' : 'text-yellow-600'}`}>
                  {isReady ? '✅ Yes' : '⏳ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Error:</span>
                <span className={`font-semibold ${isError ? 'text-red-600' : 'text-gray-500'}`}>
                  {isError ? '❌ Yes' : '✅ No'}
                </span>
              </div>
            </div>
            
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded text-sm">
                <strong>Error Details:</strong>
                <pre className="mt-1 text-xs overflow-x-auto">
                  {errorMessage}
                </pre>
              </div>
            )}
          </div>
          
          {/* Session Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              ℹ️ Session Info
            </h2>
            <div className="space-y-2 text-sm">
              <div><strong>Room ID:</strong> {roomId}</div>
              <div><strong>User ID:</strong> {userId}</div>
              <div><strong>User Name:</strong> {userName}</div>
              <div><strong>Socket Key:</strong> {session?.socketKey || 'N/A'}</div>
              <div><strong>Device:</strong> {session?.device ? '✅ Ready' : '❌ Not Ready'}</div>
              <div><strong>Send Transport:</strong> {session?.sendTransport ? '✅ Ready' : '❌ Not Ready'}</div>
              <div><strong>Recv Transport:</strong> {session?.recvTransport ? '✅ Ready' : '❌ Not Ready'}</div>
            </div>
          </div>
          
          {/* Media Controls Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              🎥 Media Controls
            </h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Video:</span>
                <span className={`font-semibold ${hasVideo ? 'text-green-600' : 'text-gray-500'}`}>
                  {hasVideo ? '✅ Active' : '❌ Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Audio:</span>
                <span className={`font-semibold ${hasAudio ? 'text-green-600' : 'text-gray-500'}`}>
                  {hasAudio ? '✅ Active' : '❌ Inactive'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={startVideo}
                disabled={!isReady || hasVideo}
                className="px-3 py-2 bg-blue-500 text-white rounded text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                📹 Start Video
              </button>
              <button
                onClick={stopVideo}
                disabled={!hasVideo}
                className="px-3 py-2 bg-red-500 text-white rounded text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                🛑 Stop Video
              </button>
              <button
                onClick={startAudio}
                disabled={!isReady || hasAudio}
                className="px-3 py-2 bg-green-500 text-white rounded text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                🎤 Start Audio
              </button>
              <button
                onClick={stopAudio}
                disabled={!hasAudio}
                className="px-3 py-2 bg-red-500 text-white rounded text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                🔇 Stop Audio
              </button>
            </div>
          </div>
          
          {/* Participants Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              👥 Participants ({participantCount})
            </h2>
            {participants.length === 0 ? (
              <div className="text-gray-500 text-sm">No other participants</div>
            ) : (
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div key={participant.id} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="font-medium">{participant.name}</div>
                    <div className="text-xs text-gray-600">ID: {participant.id}</div>
                    <div className="flex gap-2 mt-1">
                      <span className={participant.videoStream ? 'text-green-600' : 'text-gray-400'}>
                        📹 {participant.videoStream ? 'Video' : 'No Video'}
                      </span>
                      <span className={participant.audioStream ? 'text-green-600' : 'text-gray-400'}>
                        🎤 {participant.audioStream ? 'Audio' : 'No Audio'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Actions Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              🔧 Actions
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => restartSession()}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
              >
                🔄 Restart Session
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
              >
                🔃 Reload Page
              </button>
            </div>
          </div>
          
          {/* Test Instructions Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              📋 Test Instructions
            </h2>
            <div className="text-sm space-y-2">
              <div>✅ Watch connection status</div>
              <div>✅ Try starting/stopping media</div>
              <div>✅ Open in multiple tabs</div>
              <div>✅ Close tabs and check cleanup</div>
              <div>✅ Test auto-reconnection</div>
              <div>✅ Monitor console logs</div>
            </div>
          </div>
          
        </div>
        
        {/* Debug Console */}
        <div className="mt-8 bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
          <div className="mb-2 text-white">🖥️ Console Debug Output:</div>
          <div>Check browser console for detailed logs...</div>
          <div className="text-gray-400 mt-2">
            • Socket management improvements implemented ✅<br/>
            • Auto-reconnection enabled ✅<br/>
            • Proper cleanup on unmount ✅<br/>
            • Better error handling ✅
          </div>
        </div>
      </div>
    </div>
  );
}