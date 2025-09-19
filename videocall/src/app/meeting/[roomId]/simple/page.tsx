'use client';

import { useParams } from 'next/navigation';

export default function MeetingPageSimple() {
  const params = useParams();
  const roomId = params?.roomId as string;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Video Meeting</h1>
        <p className="text-gray-300 mb-4">Room ID: {roomId}</p>
        <p className="text-green-400">Application is working! ✅</p>
        <p className="text-sm text-gray-400 mt-4">
          This is a simple working page to test the Cloudflare tunnel.
        </p>
      </div>
    </div>
  );
}