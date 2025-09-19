"use client";

import { setupCrossTabListener } from "@/lib/storage";
import { useVideoCallStore } from "@/store/videoCallStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useMeetingSwitchDetection(
  roomId: string | null,
  userName?: string,
  userEmail?: string
) {
  const router = useRouter();
  const setMeetingSwitched = useVideoCallStore(
    (state) => state.setMeetingSwitched
  );
  const leaveRoom = useVideoCallStore((state) => state.leaveRoom);

  useEffect(() => {
    if (!roomId || !userName || !userEmail) return;

    console.log(
      "[useMeetingSwitchDetection] Setting up cross-tab listener for:",
      userName,
      "in room:",
      roomId
    );

    const cleanup = setupCrossTabListener(
      roomId,
      // onCloseTab callback - for backward compatibility
      () => {
        console.log("[useMeetingSwitchDetection] Received close tab signal");
        leaveRoom();
        router.push("/");
      },
      userName,
      userEmail,
      // onMeetingSwitched callback - new functionality
      (switchTimestamp: number) => {
        console.log(
          "[useMeetingSwitchDetection] Meeting switched to new tab at:",
          switchTimestamp
        );

        // Leave the room and show the switched page
        leaveRoom();
        setMeetingSwitched(switchTimestamp);

        // Navigate to the switched page
        router.push(`/meeting/${roomId}/switched`);
      }
    );

    return cleanup;
  }, [roomId, userName, userEmail, router, setMeetingSwitched, leaveRoom]);
}
