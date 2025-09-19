'use client';

import { Participant } from '@/types';
import { Crown, Hand, Mic, MicOff, MoreVertical, Users, Video, VideoOff } from 'lucide-react';
import { useState } from 'react';

interface ParticipantsPanelProps {
  participants: Participant[];
  currentUserId?: string;
  isVisible: boolean;
  onClose: () => void;
}

export function ParticipantsPanel({ participants, currentUserId, isVisible, onClose }: ParticipantsPanelProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);

  if (!isVisible) return null;

  const handleParticipantAction = (participantId: string, action: string) => {
    console.log(`Action ${action} for participant ${participantId}`);
    // TODO: Implement participant actions (mute, remove, etc.)
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-4 top-20 bottom-20 w-80 bg-gray-900/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700 z-50 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Participants ({participants.length + 1})
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Participants List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Current User (You) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                {participants.find(p => p.id === currentUserId)?.name?.[0] || 'Y'}
              </div>
              <div>
                <div className="font-medium text-white flex items-center space-x-2">
                  <span>You</span>
                  <Crown className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="text-sm text-gray-400">Host</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded bg-green-500">
                <Mic className="w-3 h-3 text-white" />
              </div>
              <div className="p-1 rounded bg-green-500">
                <Video className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          {/* Other Participants */}
          {participants.map((participant) => (
            <div 
              key={participant.id} 
              className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-800/50 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                  {participant.name[0]}
                </div>
                <div>
                  <div className="font-medium text-white flex items-center space-x-2">
                    <span>{participant.name}</span>
                    {participant.isHost && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                    {participant.isHandRaised && (
                      <Hand className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  {participant.email && (
                    <div className="text-sm text-gray-400">{participant.email}</div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Audio Status */}
                <div className={`p-1 rounded ${
                  participant.isAudioEnabled ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {participant.isAudioEnabled ? (
                    <Mic className="w-3 h-3 text-white" />
                  ) : (
                    <MicOff className="w-3 h-3 text-white" />
                  )}
                </div>

                {/* Video Status */}
                <div className={`p-1 rounded ${
                  participant.isVideoEnabled ? 'bg-green-500' : 'bg-gray-500'
                }`}>
                  {participant.isVideoEnabled ? (
                    <Video className="w-3 h-3 text-white" />
                  ) : (
                    <VideoOff className="w-3 h-3 text-white" />
                  )}
                </div>

                {/* More Options */}
                <div className="relative">
                  <button
                    onClick={() => setSelectedParticipant(
                      selectedParticipant === participant.id ? null : participant.id
                    )}
                    className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {selectedParticipant === participant.id && (
                    <div className="absolute right-0 top-full mt-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 min-w-[160px] z-10">
                      <button
                        onClick={() => handleParticipantAction(participant.id, 'mute')}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors text-sm"
                      >
                        Mute participant
                      </button>
                      <button
                        onClick={() => handleParticipantAction(participant.id, 'pin')}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors text-sm"
                      >
                        Pin for everyone
                      </button>
                      <button
                        onClick={() => handleParticipantAction(participant.id, 'spotlight')}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors text-sm"
                      >
                        Spotlight
                      </button>
                      <div className="border-t border-gray-600 my-1"></div>
                      <button
                        onClick={() => handleParticipantAction(participant.id, 'remove')}
                        className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 transition-colors text-sm"
                      >
                        Remove participant
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {participants.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>You&apos;re the only one here</p>
              <p className="text-sm">Invite others to join this meeting</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-700">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium">
            Invite participants
          </button>
        </div>
      </div>

      {/* Click outside participant menu to close */}
      {selectedParticipant && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setSelectedParticipant(null)}
        />
      )}
    </>
  );
}
