import { Hand, Mic, MicOff, Video, VideoOff, X } from "lucide-react";
import React from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export interface Participant {
    id: string;
    name: string;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isHandRaised: boolean;
    isScreenSharing: boolean;
    isModerator: boolean;
}

export interface ParticipantListProps {
    participants: Participant[];
    onClose: () => void;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
    participants,
    onClose,
}) => {
    return (
        <div className="flex flex-col h-full bg-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-white font-semibold">
                    Participants ({participants.length})
                </h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="text-gray-400 hover:text-white border-gray-600"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Participants List */}
            <div className="flex-1 overflow-y-auto">
                {participants.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                        <p>No participants</p>
                    </div>
                ) : (
                    participants.map((participant) => (
                        <div
                            key={participant.id}
                            className="flex items-center justify-between p-4 border-b border-gray-700 hover:bg-gray-700"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                        {participant.name
                                            .charAt(0)
                                            .toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-white font-medium">
                                        {participant.name}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1">
                                        {participant.isAudioEnabled ? (
                                            <Mic className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <MicOff className="w-4 h-4 text-red-400" />
                                        )}
                                        {participant.isVideoEnabled ? (
                                            <Video className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <VideoOff className="w-4 h-4 text-red-400" />
                                        )}
                                        {participant.isHandRaised && (
                                            <Hand className="w-4 h-4 text-yellow-400" />
                                        )}
                                        {participant.isScreenSharing && (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                Sharing
                                            </Badge>
                                        )}
                                        {participant.isModerator && (
                                            <Badge
                                                variant="default"
                                                className="text-xs"
                                            >
                                                Host
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
