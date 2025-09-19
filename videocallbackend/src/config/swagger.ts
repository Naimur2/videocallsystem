import swaggerJSDoc, { Options, SwaggerDefinition } from "swagger-jsdoc";

const swaggerDefinition: SwaggerDefinition = {
    openapi: "3.0.0",
    info: {
        title: "Video Call API",
        version: "1.0.0",
        description: "Multi-party video calling API with MediaSoup integration",
        contact: {
            name: "API Support",
            email: "support@videocall.com",
        },
    },
    servers: [
        {
            url: `http://localhost:${process.env.PORT || 3001}`,
            description: "Development server",
        },
    ],
    components: {
        schemas: {
            ApiResponse: {
                type: "object",
                properties: {
                    success: {
                        type: "boolean",
                        description: "Indicates if the request was successful",
                    },
                    message: {
                        type: "string",
                        description: "Response message",
                    },
                    data: {
                        type: "object",
                        description: "Response data",
                    },
                    error: {
                        type: "string",
                        description: "Error message if request failed",
                    },
                },
                required: ["success", "message"],
            },
            VideoCallRoom: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        description: "Unique room identifier",
                    },
                    name: {
                        type: "string",
                        description: "Room name",
                    },
                    participants: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Participant",
                        },
                        description: "List of room participants",
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                        description: "Room creation timestamp",
                    },
                    isActive: {
                        type: "boolean",
                        description: "Room activity status",
                    },
                },
                required: [
                    "id",
                    "name",
                    "participants",
                    "createdAt",
                    "isActive",
                ],
            },
            Participant: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        description: "Unique participant identifier",
                    },
                    name: {
                        type: "string",
                        description: "Participant name",
                    },
                    socketId: {
                        type: "string",
                        description: "Socket.IO connection ID",
                    },
                    joinedAt: {
                        type: "string",
                        format: "date-time",
                        description: "Join timestamp",
                    },
                },
                required: ["id", "name", "joinedAt"],
            },
            CreateRoomRequest: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "Room name",
                        example: "Daily Standup Meeting",
                    },
                    hostName: {
                        type: "string",
                        description: "Host participant name",
                        example: "John Doe",
                    },
                },
                required: ["name", "hostName"],
            },
            JoinRoomRequest: {
                type: "object",
                properties: {
                    roomId: {
                        type: "string",
                        description: "Room ID to join",
                        example: "room-123",
                    },
                    participantName: {
                        type: "string",
                        description: "Participant name",
                        example: "Jane Smith",
                    },
                },
                required: ["roomId", "participantName"],
            },
        },
    },
};

const options: Options = {
    definition: swaggerDefinition,
    apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
