"use client";

import MeetingSwitchedPage from "@/components/MeetingSwitchedPage";
import { loadUserData } from "@/lib/storage";
import { useVideoCallStore } from "@/store/videoCallStore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SwitchedPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;

  const { isMeetingSwitched, meetingSwitchedTimestamp, clearMeetingSwitched } =
    useVideoCallStore();

  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    // Load user data to show in the switched page
    const userData = loadUserData();
    if (userData?.name) {
      setUserName(userData.name);
    }

    // If we're not in a switched state, redirect to the meeting page
    if (!isMeetingSwitched) {
      console.log(
        "[SwitchedPage] Not in switched state, redirecting to meeting"
      );
      router.replace(`/meeting/${roomId}`);
      return;
    }

    // Clear the switched state when component unmounts
    return () => {
      clearMeetingSwitched();
    };
  }, [isMeetingSwitched, roomId, router, clearMeetingSwitched]);

  // Don't render if we're not in switched state
  if (!isMeetingSwitched) {
    return null;
  }

  return (
    <MeetingSwitchedPage
      roomId={roomId}
      userName={userName}
      newTabTimestamp={meetingSwitchedTimestamp || undefined}
    />
  );
}
