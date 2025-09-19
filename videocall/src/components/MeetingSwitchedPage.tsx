"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface MeetingSwitchedPageProps {
  roomId: string;
  userName: string;
  newTabTimestamp?: number;
}

export default function MeetingSwitchedPage({
  roomId,
  userName,
  newTabTimestamp,
}: MeetingSwitchedPageProps) {
  const router = useRouter();
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    if (newTabTimestamp) {
      const updateTimeAgo = () => {
        const now = Date.now();
        const diff = Math.floor((now - newTabTimestamp) / 1000);

        if (diff < 60) {
          setTimeAgo(`${diff} seconds ago`);
        } else if (diff < 3600) {
          setTimeAgo(`${Math.floor(diff / 60)} minutes ago`);
        } else {
          setTimeAgo(`${Math.floor(diff / 3600)} hours ago`);
        }
      };

      updateTimeAgo();
      const interval = setInterval(updateTimeAgo, 1000);

      return () => clearInterval(interval);
    }
  }, [newTabTimestamp]);

  const handleReturnHome = () => {
    router.push("/");
  };

  const handleRejoinMeeting = () => {
    // Force a fresh join attempt
    router.push(`/meeting/${roomId}?forceRejoin=true`);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m0-4l4-4"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-4">Meeting Switched</h1>

        {/* Message */}
        <div className="text-gray-300 mb-6 space-y-2">
          <p>This meeting has been switched to a new tab.</p>
          <p className="text-sm text-gray-400">
            You ({userName}) opened the same meeting in another browser tab{" "}
            {timeAgo && <span className="text-blue-400">{timeAgo}</span>}.
          </p>
        </div>

        {/* Meeting Info */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-400 mb-1">Meeting ID</div>
          <div className="text-white font-mono text-lg">{roomId}</div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRejoinMeeting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Return to Meeting
          </button>

          <button
            onClick={handleReturnHome}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Go to Home
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 text-xs text-gray-500">
          <p>To avoid this message, use only one browser tab per meeting.</p>
        </div>
      </div>
    </div>
  );
}
