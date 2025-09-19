'use client';

import { useState } from 'react';
import { generateRoomId, generateParticipantName } from '@/lib/utils';

interface JoinRoomProps {
  readonly onJoinRoom: (roomId: string, participantName: string) => void;
  readonly isLoading: boolean;
  readonly error: string | null;
}

export function JoinRoom({ onJoinRoom, isLoading, error }: JoinRoomProps) {
  const [roomId, setRoomId] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalRoomId = roomId.trim() || generateRoomId();
    const finalParticipantName = participantName.trim() || generateParticipantName();
    
    onJoinRoom(finalRoomId, finalParticipantName);
  };

  const createNewRoom = () => {
    setIsCreatingRoom(true);
    const newRoomId = generateRoomId();
    const finalParticipantName = participantName.trim() || generateParticipantName();
    
    onJoinRoom(newRoomId, finalParticipantName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">VideoCall</h1>
          <p className="text-gray-300">Connect with anyone, anywhere</p>
        </div>

        {/* Preview Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          <div className="bg-gray-900 aspect-video flex items-center justify-center relative">
            {/* Camera preview placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 opacity-80"></div>
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-gray-900 mb-4 mx-auto">
                {(participantName || 'You').charAt(0).toUpperCase()}
              </div>
              <p className="text-white font-medium">
                {participantName || 'You'}
              </p>
            </div>
            
            {/* Camera controls overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              <button className="p-2 bg-gray-700/80 rounded-full text-white hover:bg-gray-600/80 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="p-2 bg-gray-700/80 rounded-full text-white hover:bg-gray-600/80 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="participantName" className="block text-sm font-medium text-gray-700 mb-2">
                  Your name
                </label>
                <input
                  type="text"
                  id="participantName"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
                  Room ID (optional)
                </label>
                <input
                  type="text"
                  id="roomId"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter room ID or leave empty to create new room"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Joining...' : roomId ? 'Join Room' : 'Create & Join'}
                </button>
                
                <button
                  type="button"
                  onClick={createNewRoom}
                  disabled={isLoading || isCreatingRoom}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  New Room
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Device Settings */}
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-2">
            Device settings
          </p>
          <div className="flex justify-center space-x-4">
            <select className="px-3 py-2 bg-gray-800 text-white rounded-lg text-sm border border-gray-600">
              <option>Default Microphone</option>
            </select>
            <select className="px-3 py-2 bg-gray-800 text-white rounded-lg text-sm border border-gray-600">
              <option>Default Camera</option>
            </select>
            <select className="px-3 py-2 bg-gray-800 text-white rounded-lg text-sm border border-gray-600">
              <option>Default Speakers</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
