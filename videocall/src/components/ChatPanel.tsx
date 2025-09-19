import { Send, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";

export interface Message {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: Date;
    type: "text" | "system";
}

export interface ChatPanelProps {
    messages: Message[];
    onSendMessage: (message: string) => void;
    onClose: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
    messages,
    onSendMessage,
    onClose,
}) => {
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(newMessage.trim());
            setNewMessage("");
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="flex flex-col h-full bg-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-white font-semibold">Chat</h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="text-gray-400 hover:text-white border-gray-600"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div key={message.id} className="flex flex-col">
                            <div className="flex items-center space-x-2 mb-1">
                                <span className="text-white font-medium text-sm">
                                    {message.senderName}
                                </span>
                                <span className="text-gray-400 text-xs">
                                    {formatTime(message.timestamp)}
                                </span>
                            </div>
                            <div className="bg-gray-700 rounded-lg p-3">
                                <p className="text-white text-sm">
                                    {message.content}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={500}
                    />
                    <Button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="px-4 py-2"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
};
