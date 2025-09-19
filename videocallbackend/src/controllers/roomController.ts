import { Request, Response } from "express";
import { roomService } from "../services/roomService";
import {
    sendCreated,
    sendNotFoundError,
    sendSuccess,
    sendValidationError,
} from "../utils/response";
import { validateRequired } from "../utils/validation";

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Get all rooms
 *     tags: [Rooms]
 */
export const getAllRooms = (_req: Request, res: Response): void => {
    const rooms = roomService.getAllRooms();
    sendSuccess(res, "Rooms retrieved successfully", { rooms });
};

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Create a new room
 *     tags: [Rooms]
 */
export const createRoom = (req: Request, res: Response): void => {
    const { name, hostName } = req.body;

    // Validation
    const nameValidation = validateRequired(name, "Room name");
    if (nameValidation) {
        sendValidationError(res, nameValidation);
        return;
    }

    const hostValidation = validateRequired(hostName, "Host name");
    if (hostValidation) {
        sendValidationError(res, hostValidation);
        return;
    }

    const { room, error } = roomService.createRoom({ name, hostName });

    if (error) {
        sendValidationError(res, error);
        return;
    }

    sendCreated(res, "Room created successfully", { room });
};

/**
 * @swagger
 * /api/rooms/{roomId}:
 *   get:
 *     summary: Get room by ID
 *     tags: [Rooms]
 */
export const getRoomById = (req: Request, res: Response): void => {
    const { roomId } = req.params;

    const room = roomService.getRoomById(roomId);
    if (!room) {
        sendNotFoundError(res, "Room not found");
        return;
    }

    sendSuccess(res, "Room retrieved successfully", { room });
};

/**
 * @swagger
 * /api/rooms/{roomId}/join:
 *   post:
 *     summary: Join a room
 *     tags: [Rooms]
 */
export const joinRoom = (req: Request, res: Response): void => {
    const { roomId } = req.params;
    const { participantName } = req.body;

    // Validation
    const nameValidation = validateRequired(
        participantName,
        "Participant name"
    );
    if (nameValidation) {
        sendValidationError(res, nameValidation);
        return;
    }

    const { room, participant, error } = roomService.joinRoom(
        roomId,
        participantName
    );

    if (error) {
        if (error.includes("not found")) {
            sendNotFoundError(res, error);
        } else {
            sendValidationError(res, error);
        }
        return;
    }

    sendSuccess(res, "Joined room successfully", { room, participant });
};

/**
 * @swagger
 * /api/rooms/{roomId}/leave:
 *   post:
 *     summary: Leave a room
 *     tags: [Rooms]
 */
export const leaveRoom = (req: Request, res: Response): void => {
    const { roomId } = req.params;
    const { participantId } = req.body;

    // Validation
    const participantValidation = validateRequired(
        participantId,
        "Participant ID"
    );
    if (participantValidation) {
        sendValidationError(res, participantValidation);
        return;
    }

    const { room, error } = roomService.leaveRoom(roomId, participantId);

    if (error) {
        if (error.includes("not found")) {
            sendNotFoundError(res, error);
        } else {
            sendValidationError(res, error);
        }
        return;
    }

    sendSuccess(res, "Left room successfully", { room });
};

/**
 * @swagger
 * /api/rooms/{roomId}:
 *   delete:
 *     summary: Delete a room
 *     tags: [Rooms]
 */
export const deleteRoom = (req: Request, res: Response): void => {
    const { roomId } = req.params;

    const { success, error } = roomService.deleteRoom(roomId);

    if (error) {
        if (error.includes("not found")) {
            sendNotFoundError(res, error);
        } else {
            sendValidationError(res, error);
        }
        return;
    }

    sendSuccess(res, "Room deleted successfully", { success });
};

/**
 * @swagger
 * /api/rooms/{roomId}/stats:
 *   get:
 *     summary: Get room statistics
 *     tags: [Rooms]
 */
export const getRoomStats = (req: Request, res: Response): void => {
    const stats = roomService.getRoomStats();
    sendSuccess(res, "Room stats retrieved successfully", { stats });
};

/**
 * @swagger
 * /api/rooms/{roomId}/participants:
 *   get:
 *     summary: Get room participants
 *     tags: [Rooms]
 */
export const getParticipantsByRoom = (req: Request, res: Response): void => {
    const { roomId } = req.params;

    const { participants, error } = roomService.getParticipantsByRoom(roomId);

    if (error) {
        sendNotFoundError(res, error);
        return;
    }

    sendSuccess(res, "Participants retrieved successfully", { participants });
};
