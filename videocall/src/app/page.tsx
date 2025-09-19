"use client";

import config from "@/lib/config";
import {
  isUserAuthenticated,
  loadUserData,
  logoutUser,
  UserData,
} from "@/lib/storage";
import { LogOut, Users, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [userData, setUserData] = useState<Partial<UserData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      try {
        if (!isUserAuthenticated()) {
          router.replace("/auth");
          return;
        }

        const user = loadUserData();
        setUserData(user);
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking auth:", error);
        router.replace("/auth");
      }
    };

    // Use setTimeout to ensure this runs after component mount
    const timer = setTimeout(checkAuth, 200);

    return () => clearTimeout(timer);
  }, [router]);

  const handleLogout = () => {
    logoutUser();
    router.push("/auth");
  };

  const createNewMeeting = async () => {
    if (!userData) return;

    setIsCreating(true);
    // Generate a random room ID
    const newRoomId = Math.random().toString(36).substring(2, 15);

    // Store meeting info in sessionStorage to pass to the meeting page
    sessionStorage.setItem(
      "meetingInfo",
      JSON.stringify({
        meetingName: `${userData.name}'s Meeting`,
        userName: userData.name,
        userEmail: userData.email,
        roomId: newRoomId,
        isHost: true,
      })
    );

    // Use window.location instead of Next.js router for full page navigation
    window.location.href = `/meeting/${newRoomId}`;
  };

  const joinExistingRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() && userData) {
      // Store user info for joining
      sessionStorage.setItem(
        "meetingInfo",
        JSON.stringify({
          meetingName: `Meeting ${roomId.trim()}`,
          userName: userData.name,
          userEmail: userData.email,
          roomId: roomId.trim(),
          isHost: false,
        })
      );

      // Use window.location instead of Next.js router for full page navigation
      window.location.href = `/meeting/${roomId.trim()}`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!userData) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full shadow-2xl">
        {/* User Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {userData.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left">
                <h2 className="text-white font-semibold">{userData.name}</h2>
                <p className="text-gray-300 text-sm">{userData.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          <h1 className="text-4xl font-bold text-white mb-2">
            {config.app.name}
          </h1>
          <p className="text-gray-300">Ready to start or join a meeting?</p>
        </div>

        <div className="space-y-6">
          {/* Create New Meeting */}
          <div className="text-center">
            <button
              onClick={createNewMeeting}
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center space-x-2"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  <span>Create New Meeting</span>
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-400/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-gray-300">or</span>
            </div>
          </div>

          {/* Join Existing Room */}
          <form onSubmit={joinExistingRoom} className="space-y-4">
            <div>
              <label className="flex text-sm font-medium text-gray-300 mb-2 items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Join with Meeting ID</span>
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter meeting ID"
                className="w-full px-4 py-3 bg-white/10 border border-gray-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={!roomId.trim()}
              className="w-full bg-gray-600/50 hover:bg-gray-600/70 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Join Meeting</span>
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Secure, fast, and reliable video calling - v{config.app.version}
          </p>
        </div>
      </div>
    </div>
  );
}
