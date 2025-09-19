"use client";

import { useVideoCallStore } from "@/store/videoCallStore";

export default function DebugPage() {
  const { participants, remoteStreams, isConnected, currentRoom } = useVideoCallStore();

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Video Call Debug Info</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
          <p>Connected: {isConnected ? '✅ Yes' : '❌ No'}</p>
          <p>Current Room: {currentRoom?.id || 'None'}</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Participants ({participants.length})</h2>
          {participants.length === 0 ? (
            <p className="text-gray-400">No participants</p>
          ) : (
            <ul className="space-y-2">
              {participants.map((p) => (
                <li key={p.id} className="bg-gray-800 p-3 rounded">
                  <p><strong>Name:</strong> {p.name}</p>
                  <p><strong>ID:</strong> {p.id}</p>
                  <p><strong>Video:</strong> {p.isVideoEnabled ? '✅' : '❌'}</p>
                  <p><strong>Audio:</strong> {p.isAudioEnabled ? '✅' : '❌'}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Remote Streams ({remoteStreams.size})</h2>
          {remoteStreams.size === 0 ? (
            <p className="text-gray-400">No remote streams</p>
          ) : (
            <ul className="space-y-2">
              {Array.from(remoteStreams.entries()).map(([key, stream]) => (
                <li key={key} className="bg-gray-800 p-3 rounded">
                  <p><strong>Key:</strong> {key}</p>
                  <p><strong>Video Tracks:</strong> {stream.getVideoTracks().length}</p>
                  <p><strong>Audio Tracks:</strong> {stream.getAudioTracks().length}</p>
                  <p><strong>Stream ID:</strong> {stream.id}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
