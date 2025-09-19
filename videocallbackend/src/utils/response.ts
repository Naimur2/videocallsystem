/**
 * Response utility functions for consistent API responses
 */

import { Response } from "express";
import { ApiResponse } from "../types";

// HTTP Status codes
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
} as const;

// Response factory functions
export const createApiResponse = <T = any>(
    success: boolean,
    message: string,
    data?: T,
    error?: string
): ApiResponse<T> => ({
    success,
    message,
    ...(data !== undefined && { data }),
    ...(error && { error }),
});

export const createSuccessResponse = <T = any>(
    message: string,
    data?: T
): ApiResponse<T> => createApiResponse(true, message, data);

export const createErrorResponse = (
    message: string,
    error?: string
): ApiResponse => createApiResponse(false, message, undefined, error);

// Response sender functions
export const sendResponse = <T = any>(
    res: Response,
    statusCode: number,
    response: ApiResponse<T>
): void => {
    res.status(statusCode).json(response);
};

export const sendSuccess = <T = any>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = HTTP_STATUS.OK
): void => {
    const response = createSuccessResponse(message, data);
    sendResponse(res, statusCode, response);
};

export const sendError = (
    res: Response,
    message: string,
    statusCode: number = HTTP_STATUS.BAD_REQUEST,
    error?: string
): void => {
    const response = createErrorResponse(message, error);
    sendResponse(res, statusCode, response);
};

export const sendValidationError = (
    res: Response,
    message: string,
    error?: string
): void => {
    sendError(res, message, HTTP_STATUS.UNPROCESSABLE_ENTITY, error);
};

export const sendNotFoundError = (
    res: Response,
    message: string = "Resource not found"
): void => {
    sendError(res, message, HTTP_STATUS.NOT_FOUND);
};

export const sendInternalError = (
    res: Response,
    message: string = "Internal server error",
    error?: string
): void => {
    sendError(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR, error);
};

export const sendCreated = <T = any>(
    res: Response,
    message: string,
    data: T
): void => {
    sendSuccess(res, message, data, HTTP_STATUS.CREATED);
};
