import { useCallback, useEffect, useState } from "react";

export interface DeviceCheckResult {
  isAvailable: boolean | null; // null = checking, true = available, false = in use
  error: string | null;
  isChecking: boolean;
  checkDevices: () => Promise<void>;
  clearError: () => void;
}

export const useDeviceCheck = (): DeviceCheckResult => {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkDevices = useCallback(async (): Promise<void> => {
    setIsChecking(true);
    setError(null);

    try {
      console.log("[DeviceCheck] Starting device availability check...");

      // Try to access devices without actually using them
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log("[DeviceCheck] Devices are available");

      // Immediately stop all tracks to free up the devices
      stream.getTracks().forEach((track) => {
        track.stop();
        console.log("[DeviceCheck] Stopped track:", track.kind);
      });

      setIsAvailable(true);
    } catch (err: unknown) {
      console.error("[DeviceCheck] Device check failed:", err);

      const error = err as Error;
      const errorMessage = error.message?.toLowerCase() || "";
      const errorName = error.name?.toLowerCase() || "";

      if (
        errorName.includes("notreadableerror") ||
        errorName.includes("trackstarterror") ||
        errorMessage.includes("could not start video source") ||
        errorMessage.includes("could not start audio source") ||
        errorMessage.includes("device is being used") ||
        errorMessage.includes("already in use") ||
        errorMessage.includes("not readable") ||
        errorMessage.includes("busy")
      ) {
        setError(
          "DEVICE_IN_USE: Camera or microphone is already being used by another application or browser tab"
        );
        setIsAvailable(false);
      } else if (
        errorName.includes("notallowederror") ||
        errorMessage.includes("permission denied") ||
        errorMessage.includes("not allowed")
      ) {
        setError("PERMISSION_DENIED: Camera/microphone access denied");
        setIsAvailable(false);
      } else if (
        errorName.includes("notfounderror") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("no device")
      ) {
        setError("DEVICE_NOT_FOUND: Camera or microphone not found");
        setIsAvailable(false);
      } else {
        setError(`DEVICE_ERROR: ${error.message || "Unknown device error"}`);
        setIsAvailable(false);
      }
    } finally {
      setIsChecking(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setIsAvailable(null);
  }, []);

  // Auto-check devices on mount
  useEffect(() => {
    checkDevices();
  }, [checkDevices]);

  return {
    isAvailable,
    error,
    isChecking,
    checkDevices,
    clearError,
  };
};

// Helper function to check if error is device-in-use specific
export const isDeviceInUseError = (error: string | null): boolean => {
  if (!error) return false;
  return error.startsWith("DEVICE_IN_USE:");
};

// Helper function to check if error is permission denied
export const isPermissionDeniedError = (error: string | null): boolean => {
  if (!error) return false;
  return error.startsWith("PERMISSION_DENIED:");
};

// Helper function to check if error is device not found
export const isDeviceNotFoundError = (error: string | null): boolean => {
  if (!error) return false;
  return error.startsWith("DEVICE_NOT_FOUND:");
};

// Get user-friendly error message
export const getDeviceErrorMessage = (error: string | null): string => {
  if (!error) return "";

  if (isDeviceInUseError(error)) {
    return "Camera or microphone is already being used by another application or browser tab.";
  }

  if (isPermissionDeniedError(error)) {
    return "Please allow camera and microphone access to join the meeting.";
  }

  if (isDeviceNotFoundError(error)) {
    return "Camera or microphone not found. Please check your device connections.";
  }

  return error.replace(/^[A-Z_]+:\s*/, ""); // Remove error prefix
};
