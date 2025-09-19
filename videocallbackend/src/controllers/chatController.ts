/**
 * Chat Controller - Handles HTTP requests for chat management
 */

import { Request, Response } from "express";
import chatService from "../services/chatService";
import { SendChatMessageRequest } from "../types";
import {
    sendCreated,
    sendNotFoundError,
    sendSuccess,
    sendValidationError,
} from "../utils/response";

/**
 * @swagger
 * /api/chat/{roomId}/messages:
 *   post:
 *     summary: Send a chat message
 *     tags: [Chat]
 */
export const sendMessage = (req: Request, res: Response): void => {
    const { roomId } = req.params;
    const messageData: Omit<SendChatMessageRequest, "roomId"> = req.body;

    const requestData: SendChatMessageRequest = {
        roomId,
        ...messageData,
    };

    const { message, error } = chatService.sendMessage(requestData);

    if (error) {
        if (error.includes("not found")) {
            sendNotFoundError(res, error);
        } else {
            sendValidationError(res, error);
        }
        return;
    }

    sendCreated(res, "Message sent successfully", message);
};

/**
 * @swagger
 * /api/chat/{roomId}/messages:
 *   get:
 *     summary: Get chat messages for a room
 *     tags: [Chat]
 */
export const getMessages = (req: Request, res: Response): void => {
    const { roomId } = req.params;
    const messages = chatService.getMessages(roomId);
    sendSuccess(res, "Messages retrieved successfully", { messages });
};

/**
 * @swagger
 * /api/chat/{roomId}/messages/{messageId}:
 *   put:
 *     summary: Edit a chat message
 *     tags: [Chat]
 */
export const editMessage = (req: Request, res: Response): void => {
    const { roomId, messageId } = req.params;
    const { content, editorId } = req.body;

    const { message, error } = chatService.editMessage(
        roomId,
        messageId,
        content,
        editorId
    );

    if (error) {
        if (error.includes("not found")) {
            sendNotFoundError(res, error);
        } else {
            sendValidationError(res, error);
        }
        return;
    }

    sendSuccess(res, "Message updated successfully", message);
};

/**
 * @swagger
 * /api/chat/{roomId}/messages/{messageId}:
 *   delete:
 *     summary: Delete a chat message
 *     tags: [Chat]
 */
export const deleteMessage = (req: Request, res: Response): void => {
    const { roomId, messageId } = req.params;
    const { deleterId } = req.body;

    const { success, error } = chatService.deleteMessage(
        roomId,
        messageId,
        deleterId
    );

    if (error) {
        if (error.includes("not found")) {
            sendNotFoundError(res, error);
        } else {
            sendValidationError(res, error);
        }
        return;
    }

    sendSuccess(res, "Message deleted successfully", { deleted: success });
};

/**
 * @swagger
 * /api/chat/{roomId}/clear:
 *   delete:
 *     summary: Clear all chat messages in a room
 *     tags: [Chat]
 */
export const clearChatHistory = (req: Request, res: Response): void => {
    const { roomId } = req.params;
    const { moderatorId } = req.body;

    const count = chatService.clearChatHistory(roomId, moderatorId);
    sendSuccess(res, "Chat history cleared successfully", {
        deletedCount: count,
    });
};
