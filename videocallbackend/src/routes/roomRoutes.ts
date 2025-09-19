import { Router } from "express";
import {
    createRoom,
    deleteRoom,
    getAllRooms,
    getParticipantsByRoom,
    getRoomById,
    getRoomStats,
    joinRoom,
    leaveRoom,
} from "../controllers/roomController";

const router = Router();

// GET /api/rooms - Get all active rooms
router.get("/", getAllRooms);

// POST /api/rooms - Create a new room
router.post("/", createRoom);

// GET /api/rooms/:roomId - Get room by ID
router.get("/:roomId", getRoomById);

// POST /api/rooms/:roomId/join - Join a room
router.post("/:roomId/join", joinRoom);

// POST /api/rooms/:roomId/leave - Leave a room
router.post("/:roomId/leave", leaveRoom);

// DELETE /api/rooms/:roomId - Delete a room
router.delete("/:roomId", deleteRoom);

// GET /api/rooms/:roomId/stats - Get room statistics
router.get("/:roomId/stats", getRoomStats);

// GET /api/rooms/:roomId/participants - Get room participants
router.get("/:roomId/participants", getParticipantsByRoom);

export default router;
