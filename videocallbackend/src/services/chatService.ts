/**
 * Chat Service - Handles all chat-related business logic
 */

import { ChatMessage, SendChatMessageRequest } from "@/types";
import { generateChatMessageId, getCurrentTimestamp } from "@/utils/helpers";
import { validateChatMessage, validateId } from "@/utils/validation";
import roomService from "./roomService";

class ChatService {
    private readonly MAX_MESSAGE_HISTORY = 1000; // Maximum messages to keep in memory

    sendMessage(data: SendChatMessageRequest): {
        message: ChatMessage;
        error: string | null;
    } {
        // Validate input
        const roomValidation = validateId(data.roomId, "Room ID");
        if (roomValidation) {
            return { message: {} as ChatMessage, error: roomValidation };
        }

        const senderValidation = validateId(data.senderId, "Sender ID");
        if (senderValidation) {
            return { message: {} as ChatMessage, error: senderValidation };
        }

        const messageValidation = validateChatMessage(data.message);
        if (messageValidation) {
            return { message: {} as ChatMessage, error: messageValidation };
        }

        // Check if room exists
        const room = roomService.getRoomById(data.roomId);
        if (!room) {
            return { message: {} as ChatMessage, error: "Room not found" };
        }

        // Check if sender is participant in the room
        const sender = room.participants.find((p) => p.id === data.senderId);
        if (!sender) {
            return {
                message: {} as ChatMessage,
                error: "Sender is not a participant in this room",
            };
        }

        // Create chat message
        const chatMessage: ChatMessage = {
            id: generateChatMessageId(),
            senderId: data.senderId,
            senderName: sender.name,
            content: data.message.trim(),
            timestamp: getCurrentTimestamp(),
            type: data.type || "text",
            isEdited: false,
            reactions: [],
            replyTo: data.replyTo,
        };

        // Add message to room
        room.chatMessages.push(chatMessage);

        // Limit message history
        if (room.chatMessages.length > this.MAX_MESSAGE_HISTORY) {
            room.chatMessages = room.chatMessages.slice(
                -this.MAX_MESSAGE_HISTORY
            );
        }

        return { message: chatMessage, error: null };
    }

    getMessages(
        roomId: string,
        limit: number = 50,
        offset: number = 0
    ): {
        messages: ChatMessage[];
        total: number;
        error: string | null;
    } {
        const roomValidation = validateId(roomId, "Room ID");
        if (roomValidation) {
            return { messages: [], total: 0, error: roomValidation };
        }

        const room = roomService.getRoomById(roomId);
        if (!room) {
            return { messages: [], total: 0, error: "Room not found" };
        }

        const total = room.chatMessages.length;
        const messages = room.chatMessages
            .slice(-limit - offset, total - offset)
            .reverse(); // Most recent first

        return { messages, total, error: null };
    }

    deleteMessage(
        roomId: string,
        messageId: string,
        deleterId: string
    ): {
        success: boolean;
        error: string | null;
    } {
        const roomValidation = validateId(roomId, "Room ID");
        if (roomValidation) {
            return { success: false, error: roomValidation };
        }

        const messageValidation = validateId(messageId, "Message ID");
        if (messageValidation) {
            return { success: false, error: messageValidation };
        }

        const deleterValidation = validateId(deleterId, "Deleter ID");
        if (deleterValidation) {
            return { success: false, error: deleterValidation };
        }

        const room = roomService.getRoomById(roomId);
        if (!room) {
            return { success: false, error: "Room not found" };
        }

        const messageIndex = room.chatMessages.findIndex(
            (msg) => msg.id === messageId
        );
        if (messageIndex === -1) {
            return { success: false, error: "Message not found" };
        }

        const message = room.chatMessages[messageIndex];
        const deleter = room.participants.find((p) => p.id === deleterId);

        if (!deleter) {
            return {
                success: false,
                error: "Deleter is not a participant in this room",
            };
        }

        // Only sender or moderator can delete
        if (message.senderId !== deleterId && !deleter.isModerator) {
            return {
                success: false,
                error: "Only the sender or a moderator can delete this message",
            };
        }

        // Remove message
        room.chatMessages.splice(messageIndex, 1);

        return { success: true, error: null };
    }

    editMessage(
        roomId: string,
        messageId: string,
        newMessage: string,
        editorId: string
    ): {
        message: ChatMessage | null;
        error: string | null;
    } {
        const roomValidation = validateId(roomId, "Room ID");
        if (roomValidation) {
            return { message: null, error: roomValidation };
        }

        const messageValidation = validateId(messageId, "Message ID");
        if (messageValidation) {
            return { message: null, error: messageValidation };
        }

        const editorValidation = validateId(editorId, "Editor ID");
        if (editorValidation) {
            return { message: null, error: editorValidation };
        }

        const contentValidation = validateChatMessage(newMessage);
        if (contentValidation) {
            return { message: null, error: contentValidation };
        }

        const room = roomService.getRoomById(roomId);
        if (!room) {
            return { message: null, error: "Room not found" };
        }

        const message = room.chatMessages.find((msg) => msg.id === messageId);
        if (!message) {
            return { message: null, error: "Message not found" };
        }

        const editor = room.participants.find((p) => p.id === editorId);
        if (!editor) {
            return {
                message: null,
                error: "Editor is not a participant in this room",
            };
        }

        // Only sender can edit their own messages
        if (message.senderId !== editorId) {
            return {
                message: null,
                error: "Only the sender can edit this message",
            };
        }

        // Update message
        message.content = newMessage.trim();
        message.isEdited = true;
        message.editedAt = getCurrentTimestamp();

        return { message, error: null };
    }

    // Get recent messages for a participant (useful for catching up)
    getRecentMessages(
        roomId: string,
        participantId: string,
        sinceTimestamp?: Date
    ): {
        messages: ChatMessage[];
        error: string | null;
    } {
        const roomValidation = validateId(roomId, "Room ID");
        if (roomValidation) {
            return { messages: [], error: roomValidation };
        }

        const participantValidation = validateId(
            participantId,
            "Participant ID"
        );
        if (participantValidation) {
            return { messages: [], error: participantValidation };
        }

        const room = roomService.getRoomById(roomId);
        if (!room) {
            return { messages: [], error: "Room not found" };
        }

        const participant = room.participants.find(
            (p) => p.id === participantId
        );
        if (!participant) {
            return { messages: [], error: "Participant not found in room" };
        }

        let messages = room.chatMessages;

        // Filter messages since timestamp if provided
        if (sinceTimestamp) {
            messages = messages.filter((msg) => msg.timestamp > sinceTimestamp);
        }

        return { messages, error: null };
    }

    // Clear chat history (moderator only)
    clearChatHistory(
        roomId: string,
        moderatorId: string
    ): {
        success: boolean;
        error: string | null;
    } {
        const roomValidation = validateId(roomId, "Room ID");
        if (roomValidation) {
            return { success: false, error: roomValidation };
        }

        const moderatorValidation = validateId(moderatorId, "Moderator ID");
        if (moderatorValidation) {
            return { success: false, error: moderatorValidation };
        }

        const room = roomService.getRoomById(roomId);
        if (!room) {
            return { success: false, error: "Room not found" };
        }

        const moderator = room.participants.find((p) => p.id === moderatorId);
        if (!moderator) {
            return {
                success: false,
                error: "Moderator is not a participant in this room",
            };
        }

        if (!moderator.isModerator) {
            return {
                success: false,
                error: "Only moderators can clear chat history",
            };
        }

        // Clear all messages
        room.chatMessages = [];

        // Add system message
        const systemMessage: ChatMessage = {
            id: generateChatMessageId(),
            senderId: "system",
            senderName: "System",
            content: `Chat history was cleared by ${moderator.name}`,
            timestamp: getCurrentTimestamp(),
            type: "system",
            isEdited: false,
            reactions: [],
        };

        room.chatMessages.push(systemMessage);

        return { success: true, error: null };
    }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;
