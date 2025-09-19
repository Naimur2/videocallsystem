"use client";

import { AlertTriangle, X } from "lucide-react";

interface MultiTabConflictDialogProps {
  onCloseOtherTabs: () => void;
  onLeaveCurrent: () => void;
  meetingName?: string;
}

export function MultiTabConflictDialog({
  onCloseOtherTabs,
  onLeaveCurrent,
  meetingName,
}: MultiTabConflictDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-2xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-yellow-500/20 rounded-full">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Already in Meeting
            </h3>
            <p className="text-sm text-gray-300">
              You&apos;re already connected to this meeting from another tab
            </p>
          </div>
        </div>

        {meetingName && (
          <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-sm text-blue-200">
              <span className="font-medium">Meeting:</span> {meetingName}
            </p>
          </div>
        )}

        <p className="text-gray-300 text-sm mb-6">
          You can only join a meeting from one tab at a time. What would you
          like to do?
        </p>

        <div className="space-y-3">
          <button
            onClick={onCloseOtherTabs}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span>Close Other Tabs & Join Here</span>
          </button>

          <button
            onClick={onLeaveCurrent}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Leave This Tab</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            This prevents duplicate connections to the same meeting
          </p>
        </div>
      </div>
    </div>
  );
}
