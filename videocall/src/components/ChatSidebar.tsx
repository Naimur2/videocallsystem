import type { ChatMessage } from '@/types';
import React from 'react';

interface ChatSidebarProps {
  showChat: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

const formatMessageTime = (timestamp: Date | number) => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  showChat,
  onClose,
  messages,
  newMessage,
  onMessageChange,
  onSendMessage,
}) => {
  if (!showChat) return null;

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-white font-medium">Chat</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-sm text-center">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message: ChatMessage) => (
            <div key={message.id} className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-300">
                  {message.senderName}
                </span>
                <span className="text-xs text-gray-500">
                  {formatMessageTime(message.timestamp)}
                </span>
              </div>
              <div className="text-sm text-gray-200 bg-gray-700 p-2 rounded">
                {message.content}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-700">
        <form onSubmit={onSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
