"use client";

import { useVideoCallStore } from "@/store/videoCallStore";
import { useEffect, useState } from "react";

export function VideoCallDebug() {
  const {
    connectionStatus,
    isSocketConnected,
    isConnected,
    isLoading,
    error,
    socket,
    currentRoom,
    participants,
    retry,
    clearError,
  } = useVideoCallStore();

  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const newLog = `[${new Date().toLocaleTimeString()}] Status: ${connectionStatus}, Socket: ${isSocketConnected}, Connected: ${isConnected}, Loading: ${isLoading}`;
    setLogs((prev) => [...prev.slice(-4), newLog]);
  }, [connectionStatus, isSocketConnected, isConnected, isLoading]);

  useEffect(() => {
    if (error) {
      const errorLog = `[${new Date().toLocaleTimeString()}] ERROR: ${error}`;
      setLogs((prev) => [...prev.slice(-4), errorLog]);
    }
  }, [error]);

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-md">
      <div className="space-y-2">
        <div className="font-bold text-center">Video Call Debug</div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            Status:{" "}
            <span
              className={
                connectionStatus === "connected"
                  ? "text-green-400"
                  : connectionStatus === "failed"
                  ? "text-red-400"
                  : "text-yellow-400"
              }
            >
              {connectionStatus}
            </span>
          </div>
          <div>
            Socket:{" "}
            <span
              className={isSocketConnected ? "text-green-400" : "text-red-400"}
            >
              {isSocketConnected ? "Yes" : "No"}
            </span>
          </div>
          <div>
            Room:{" "}
            <span className={isConnected ? "text-green-400" : "text-gray-400"}>
              {isConnected ? "Yes" : "No"}
            </span>
          </div>
          <div>
            Loading:{" "}
            <span className={isLoading ? "text-yellow-400" : "text-gray-400"}>
              {isLoading ? "Yes" : "No"}
            </span>
          </div>
        </div>

        <div className="text-xs">
          <div>Socket ID: {socket?.id || "None"}</div>
          <div>Room ID: {currentRoom?.id || "None"}</div>
          <div>Participants: {participants.length}</div>
        </div>

        {error && (
          <div className="text-red-400 text-xs bg-red-900/20 p-2 rounded">
            Error: {error}
          </div>
        )}

        <div className="space-y-1">
          <div className="font-semibold">Recent Logs:</div>
          {logs.map((log, i) => (
            <div key={i} className="text-xs text-gray-300 font-mono">
              {log}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={retry}
            className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
          >
            Retry
          </button>
          <button
            onClick={clearError}
            className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs"
          >
            Clear
          </button>
          <button
            onClick={() => setLogs([])}
            className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs"
          >
            Clear Logs
          </button>
        </div>
      </div>
    </div>
  );
}
