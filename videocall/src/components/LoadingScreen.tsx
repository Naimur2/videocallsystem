import React from 'react';

interface LoadingScreenProps {
  connectionStatus: string;
  isSocketConnected: boolean;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onGoHome: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  connectionStatus,
  isSocketConnected,
  isLoading,
  error,
  onRetry,
  onGoHome,
}) => {
  const getConnectionStatus = () => {
    if (connectionStatus === "connecting") {
      return "Connecting to server...";
    }
    if (connectionStatus === "failed" || error) {
      return "Connection failed";
    }
    if (!isSocketConnected) {
      return "Establishing connection...";
    }
    if (isLoading) {
      return "Joining meeting...";
    }
    return "Loading...";
  };

  const getStatusColor = () => {
    if (connectionStatus === "connecting" || isLoading) {
      return "text-blue-400";
    }
    if (connectionStatus === "failed" || error) {
      return "text-red-400";
    }
    return "text-gray-400";
  };

  return (
    <div className="h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="mb-4">
          {connectionStatus === "connecting" ||
          (!isSocketConnected && !error) ? (
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          ) : isLoading ? (
            <div className="animate-pulse w-8 h-8 bg-green-600 rounded-full mx-auto mb-4"></div>
          ) : (
            <div className="w-8 h-8 bg-red-600 rounded-full mx-auto mb-4"></div>
          )}
        </div>
        <div className={`text-xl mb-4 ${getStatusColor()}`}>
          {getConnectionStatus()}
        </div>
        {error && (
          <div className="text-red-400 max-w-md mx-auto">
            <div className="mb-4">{error}</div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={onRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Retry Connection
              </button>
              <button
                onClick={onGoHome}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        )}
        {!error && connectionStatus !== "failed" && (
          <div className="text-sm text-gray-400 mt-4">
            <div>Make sure the backend server is running on port 3001</div>
            <div className="mt-2">
              If the problem persists, try refreshing the page
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
