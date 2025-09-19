"use client";

import { useVideoCallStore } from "@/store/videoCallStore";

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className = "" }: ConnectionStatusProps) {
  const { connectionStatus, isSocketConnected, retry } = useVideoCallStore();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-green-400";
      case "connecting":
        return "bg-yellow-400 animate-pulse";
      case "failed":
        return "bg-red-400";
      case "disconnected":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "failed":
        return "Connection Failed";
      case "disconnected":
        return "Disconnected";
      default:
        return "Unknown";
    }
  };

  const handleRetry = () => {
    if (connectionStatus === "failed" || !isSocketConnected) {
      retry();
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
      <span className="text-sm text-gray-300">{getStatusText()}</span>
      {(connectionStatus === "failed" || !isSocketConnected) && (
        <button
          onClick={handleRetry}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
