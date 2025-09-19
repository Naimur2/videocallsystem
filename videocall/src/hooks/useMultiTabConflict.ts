"use client";

import { loadUserData } from "@/lib/storage";
import { useCallback, useEffect, useState } from "react";
import { useSocket } from "./useSocket";

export function useMultiTabConflict() {
  const { socket } = useSocket();
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictData, setConflictData] = useState<{
    roomId: string;
    meetingName?: string;
  } | null>(null);
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Listen for connection rejection due to duplicate user
  useEffect(() => {
    if (!socket) return;

    const handleConnectionRejected = (data: {
      reason: string;
      message: string;
      existingSession?: { joinedAt: number; socketId: string };
    }) => {
      if (data.reason === "duplicateUser") {
        console.log("[MultiTabConflict] Connection rejected:", data);
        setConflictData({ roomId: "", meetingName: undefined });
        setShowConflictDialog(true);
        setConflictError(data.message);
      }
    };

    const handleForceDisconnectResult = (data: { success: boolean }) => {
      console.log("[MultiTabConflict] Force disconnect result:", data);
      setIsResolvingConflict(false);

      if (data.success) {
        setShowConflictDialog(false);
        setConflictError(null);
        // The join attempt should now succeed
      } else {
        setConflictError("Failed to close other tabs. Please try again.");
      }
    };

    socket.on("connectionRejected", handleConnectionRejected);
    socket.on("forceDisconnectResult", handleForceDisconnectResult);

    return () => {
      socket.off("connectionRejected", handleConnectionRejected);
      socket.off("forceDisconnectResult", handleForceDisconnectResult);
    };
  }, [socket]);

  const handleCloseOtherTabs = useCallback(
    (roomId: string) => {
      if (!socket) {
        setConflictError("No connection to server");
        return;
      }

      const userData = loadUserData();
      if (!userData?.email) {
        setConflictError("User email not found");
        return;
      }

      setIsResolvingConflict(true);
      setConflictError(null);

      console.log("[MultiTabConflict] Requesting force disconnect for:", {
        userEmail: userData.email,
        roomId,
      });

      // Request backend to force disconnect existing session
      socket.emit("forceDisconnectExisting", {
        userEmail: userData.email,
        roomId,
      });
    },
    [socket]
  );

  const handleLeaveCurrent = useCallback(() => {
    // Close current tab
    window.close();

    // If window.close() doesn't work (security restrictions), go back
    setTimeout(() => {
      window.history.back();
    }, 100);
  }, []);

  const hideConflictDialog = useCallback(() => {
    setShowConflictDialog(false);
    setConflictData(null);
    setConflictError(null);
    setIsResolvingConflict(false);
  }, []);

  return {
    showConflictDialog,
    conflictData,
    conflictError,
    isResolvingConflict,
    handleCloseOtherTabs,
    handleLeaveCurrent,
    hideConflictDialog,
    setConflictData,
  };
}
