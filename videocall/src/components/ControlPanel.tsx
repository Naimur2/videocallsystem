"use client";

interface ControlPanelProps {
  readonly isAudioEnabled: boolean;
  readonly isVideoEnabled: boolean;
  readonly isScreenSharing: boolean;
  readonly isHandRaised: boolean;
  readonly onToggleAudio: () => void;
  readonly onToggleVideo: () => void;
  readonly onToggleScreenShare?: () => void;
  readonly onToggleHandRaise: () => void;
  readonly onLeaveCall: () => void;
  readonly onEndMeeting?: () => void;
  readonly onToggleChat?: () => void;
  readonly isHost?: boolean;
}

export function ControlPanel({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isHandRaised,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHandRaise,
  onLeaveCall,
  onEndMeeting,
  onToggleChat,
  isHost = false,
}: ControlPanelProps) {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-900/90 backdrop-blur-sm rounded-full px-6 py-3 flex items-center space-x-4 shadow-lg border border-gray-700">
        {/* Audio Toggle */}
        <button
          onClick={onToggleAudio}
          className={`p-3 rounded-full transition-colors ${
            isAudioEnabled
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
          title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          {isAudioEnabled ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* Video Toggle */}
        <button
          onClick={onToggleVideo}
          className={`p-3 rounded-full transition-colors ${
            isVideoEnabled
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
          title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {isVideoEnabled ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 13V7a1 1 0 00-1.447-.894l-2 1A1 1 0 0014 8v.586l-2-2V6a2 2 0 00-2-2H4.414l-1.707-1.707zM4 8.586V14a2 2 0 002 2h6a2 2 0 002-2v-.586L4 8.586z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* Screen Share */}
        {onToggleScreenShare && (
          <button
            onClick={onToggleScreenShare}
            className={`p-3 rounded-full transition-colors ${
              isScreenSharing
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-white"
            }`}
            title={
              isScreenSharing ? "Stop screen sharing" : "Start screen sharing"
            }
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1h-5v2h3a1 1 0 110 2H6a1 1 0 110-2h3v-2H4a1 1 0 01-1-1V4zm1 1v6h12V5H4z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}

        {/* Hand Raise */}
        <button
          onClick={onToggleHandRaise}
          className={`p-3 rounded-full transition-colors ${
            isHandRaised
              ? "bg-yellow-500 hover:bg-yellow-600 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-white"
          }`}
          title={isHandRaised ? "Lower hand" : "Raise hand"}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M9 3a1 1 0 012 0v5.5a.5.5 0 001 0V4a1 1 0 112 0v4.5a.5.5 0 001 0V6a1 1 0 112 0v6a7 7 0 11-14 0V9a1 1 0 012 0v2.5a.5.5 0 001 0V4a1 1 0 012 0v4.5a.5.5 0 001 0V3z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Chat Toggle */}
        {onToggleChat && (
          <button
            onClick={onToggleChat}
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            title="Toggle chat"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
          </button>
        )}

        {/* Divider */}
        <div className="w-px h-8 bg-gray-600"></div>

        {/* End Meeting (Host only) */}
        {isHost && onEndMeeting && (
          <button
            onClick={onEndMeeting}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
            title="End meeting for everyone"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}

        {/* Leave Call */}
        <button
          onClick={onLeaveCall}
          className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
          title="Leave call"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
              transform="rotate(225 10 10)"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
