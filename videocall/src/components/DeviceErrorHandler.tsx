"use client";

import React, { useState } from "react";

interface DeviceErrorHandlerProps {
  error: string;
  onRetry: () => Promise<void>;
  onCheckDevices: () => Promise<{
    hasVideo: boolean;
    hasAudio: boolean;
    devices: MediaDeviceInfo[];
  }>;
  onClearError: () => void;
}

export const DeviceErrorHandler: React.FC<DeviceErrorHandlerProps> = ({
  error,
  onRetry,
  onCheckDevices,
  onClearError,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<{
    hasVideo: boolean;
    hasAudio: boolean;
    devices: MediaDeviceInfo[];
  } | null>(null);
  const [showDeviceInfo, setShowDeviceInfo] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
      onClearError();
    } catch (err) {
      console.error("Retry failed:", err);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCheckDevices = async () => {
    try {
      const info = await onCheckDevices();
      setDeviceInfo(info);
      setShowDeviceInfo(true);
    } catch (err) {
      console.error("Failed to check devices:", err);
    }
  };

  const getErrorType = () => {
    const errorLower = error.toLowerCase();
    if (errorLower.includes("permission") || errorLower.includes("denied")) {
      return "permission";
    }
    if (errorLower.includes("not found") || errorLower.includes("no camera")) {
      return "device-not-found";
    }
    if (errorLower.includes("being used") || errorLower.includes("readable")) {
      return "device-in-use";
    }
    if (errorLower.includes("not supported")) {
      return "not-supported";
    }
    return "generic";
  };

  const getErrorIcon = () => {
    const type = getErrorType();
    switch (type) {
      case "permission":
        return (
          <svg
            className="w-8 h-8 text-yellow-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "device-not-found":
        return (
          <svg
            className="w-8 h-8 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "device-in-use":
        return (
          <svg
            className="w-8 h-8 text-orange-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-8 h-8 text-gray-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getTroubleshootingSteps = () => {
    const type = getErrorType();
    switch (type) {
      case "permission":
        return [
          "Click the camera/microphone icon in your browser's address bar",
          "Select 'Allow' for camera and microphone permissions",
          "Refresh the page after granting permissions",
          "If still not working, check your browser's privacy settings",
        ];
      case "device-not-found":
        return [
          "Check if your camera and microphone are properly connected",
          "Try unplugging and reconnecting your devices",
          "Restart your browser or computer",
          "Check if other applications can access your devices",
        ];
      case "device-in-use":
        return [
          "Close other applications that might be using your camera/microphone",
          "End video calls in other browsers or applications",
          "Check if your camera is being used by desktop applications",
          "Restart your browser if the issue persists",
        ];
      default:
        return [
          "Try refreshing the page",
          "Check your internet connection",
          "Make sure your browser supports video calling",
          "Contact support if the problem continues",
        ];
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-96 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center mb-4">
            {getErrorIcon()}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white ml-3">
              Camera/Microphone Issue
            </h2>
          </div>

          {/* Error Message */}
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300">{error}</p>
          </div>

          {/* Device Info */}
          {showDeviceInfo && deviceInfo && (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Device Status:
              </h3>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center mb-1">
                  <span
                    className={`w-2 h-2 rounded-full mr-2 ${
                      deviceInfo.hasVideo ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  Camera: {deviceInfo.hasVideo ? "Available" : "Not found"}
                </div>
                <div className="flex items-center">
                  <span
                    className={`w-2 h-2 rounded-full mr-2 ${
                      deviceInfo.hasAudio ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  Microphone: {deviceInfo.hasAudio ? "Available" : "Not found"}
                </div>
              </div>
            </div>
          )}

          {/* Troubleshooting Steps */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Try these steps:
            </h3>
            <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
              {getTroubleshootingSteps().map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex-1 min-w-24 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              {isRetrying ? "Retrying..." : "Try Again"}
            </button>

            <button
              onClick={handleCheckDevices}
              className="flex-1 min-w-24 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Check Devices
            </button>

            <button
              onClick={onClearError}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
