import { Router } from "express";
import {
    clearChatHistory,
    deleteMessage,
    editMessage,
    getMessages,
    sendMessage,
} from "../controllers/chatController";

const router = Router();

// Chat message routes
router.get("/:roomId/messages", getMessages);
router.post("/:roomId/messages", sendMessage);
router.put("/:roomId/messages/:messageId", editMessage);
router.delete("/:roomId/messages/:messageId", deleteMessage);
router.delete("/:roomId/clear", clearChatHistory);

export default router;
