"use client";

import {
  getOtherActiveTabs,
  registerActiveTab,
  startTabHeartbeat,
} from "@/lib/storage";
import { ArrowRight, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

interface MultiTabDetectionProps {
  roomId: string;
  onContinueHere: () => void;
  onGoToOtherTab: () => void;
  userName?: string;
}

export default function MultiTabDetection({
  roomId,
  onContinueHere,
  onGoToOtherTab,
  userName,
}: MultiTabDetectionProps) {
  const [otherTabs, setOtherTabs] = useState<
    Array<{ tabId: string; timestamp: number; url: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for other tabs on mount
    const checkOtherTabs = () => {
      const tabs = getOtherActiveTabs(roomId);
      setOtherTabs(tabs);
    };

    checkOtherTabs();

    // Check periodically for changes
    const interval = setInterval(checkOtherTabs, 2000);

    return () => clearInterval(interval);
  }, [roomId]);

  const handleContinueHere = async () => {
    setIsLoading(true);
    try {
      // Register this tab as active
      registerActiveTab(roomId);

      // Start heartbeat for this tab
      startTabHeartbeat(roomId);

      onContinueHere();
    } catch (error) {
      console.error("Error continuing in this tab:", error);
      setIsLoading(false);
    }
  };

  const handleGoToOtherTab = () => {
    try {
      // Try to focus the other tab/window
      if (otherTabs.length > 0) {
        const otherTabUrl = otherTabs[0].url;
        // Open the other tab (this will focus it if it's already open)
        window.open(otherTabUrl, "_blank");
      }
      onGoToOtherTab();
    } catch (error) {
      console.error("Error switching to other tab:", error);
    }
  };

  if (otherTabs.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Glass morphism container */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Icon and Status */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
              <Monitor className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Meeting Already Open
            </h2>
            <p className="text-gray-300 text-sm">
              {userName ? `${userName}, you're` : "You're"} using this meeting
              in another tab or window
            </p>
          </div>

          {/* Meeting info */}
          <div className="bg-black/20 rounded-xl p-4 mb-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Room ID</p>
                <p className="text-gray-400 text-sm font-mono">{roomId}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">{otherTabs.length}</p>
                <p className="text-gray-400 text-sm">
                  {otherTabs.length === 1 ? "other tab" : "other tabs"}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGoToOtherTab}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Switch to Other Tab
            </button>

            <button
              onClick={handleContinueHere}
              disabled={isLoading}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Continuing...
                </div>
              ) : (
                "Continue Here Instead"
              )}
            </button>
          </div>

          {/* Help text */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-xs">
              Similar to Google Meet, you can only be in one tab at a time for
              the same meeting
            </p>
          </div>
        </div>

        {/* Background decorative elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        </div>
      </div>
    </div>
  );
}
