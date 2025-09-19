import { Request, Response } from "express";
import { ApiResponse } from "../types";

// Pure function to create API response
const createApiResponse = <T>(message: string, data: T): ApiResponse<T> => ({
    success: true,
    message,
    data,
});

// Pure function to get current timestamp
const getCurrentTimestamp = (): string => new Date().toISOString();

// Pure function to get system info
const getSystemInfo = () => ({
    timestamp: getCurrentTimestamp(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
});

// Pure function to get server metadata
const getServerMetadata = () => ({
    name: "Video Call Backend API",
    version: "1.0.0",
    description: "TypeScript Express backend for video call application",
    endpoints: [
        "GET /api/v1/health - Health check",
        "GET /api/v1/info - Server information",
        "GET /api/v1/rooms - List rooms",
        "POST /api/v1/rooms - Create room",
        "GET /api/v1/rooms/:id - Get room details",
        "POST /api/v1/rooms/:id/join - Join room",
        "DELETE /api/v1/rooms/:id/leave - Leave room",
    ],
});

// Higher-order function to send JSON response
const sendJsonResponse =
    <T>(statusCode: number) =>
    (response: ApiResponse<T>) =>
    (res: Response): void => {
        res.status(statusCode).json(response);
    };

// Compose functions for health check
const createHealthResponse = () =>
    createApiResponse("Server is running successfully", getSystemInfo());

const sendHealthResponse =
    sendJsonResponse<ReturnType<typeof getSystemInfo>>(200);

// Compose functions for server info
const createServerInfoResponse = () =>
    createApiResponse("Server information retrieved", getServerMetadata());

const sendServerInfoResponse =
    sendJsonResponse<ReturnType<typeof getServerMetadata>>(200);

// Main controller functions using composition
export const healthCheck = (req: Request, res: Response): void => {
    const response = createHealthResponse();
    sendHealthResponse(response)(res);
};

export const getServerInfo = (req: Request, res: Response): void => {
    const response = createServerInfoResponse();
    sendServerInfoResponse(response)(res);
};
