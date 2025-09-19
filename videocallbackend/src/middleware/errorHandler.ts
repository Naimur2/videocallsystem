import { ApiResponse } from "@/types";
import { NextFunction, Request, Response } from "express";

// Pure functions for creating error responses
const createErrorResponse = (message: string, error?: string): ApiResponse => ({
    success: false,
    message,
    ...(error && { error }),
});

const createNotFoundResponse = (method: string, path: string): ApiResponse => ({
    success: false,
    message: `Route ${method} ${path} not found`,
});

// Pure function to extract status code
const extractStatusCode = (err: any): number =>
    err.statusCode || err.status || 500;

// Pure function to extract error message
const extractErrorMessage = (err: any): string =>
    err.message || "Something went wrong";

// Higher-order function for logging errors
const withErrorLogging =
    (logFn: (message: string, error: any) => void) =>
    (err: any): any => {
        logFn("Error:", err);
        return err;
    };

// Default error logging function
const defaultErrorLogger = (message: string, error: any): void => {
    console.error(message, error);
};

// Function composition for error handling
const logError = withErrorLogging(defaultErrorLogger);

// Main error handler using functional approach
export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Log error as side effect
    logError(err);

    const statusCode = extractStatusCode(err);
    const errorMessage = extractErrorMessage(err);
    const response = createErrorResponse("Internal Server Error", errorMessage);

    res.status(statusCode).json(response);
};

// Not found handler using functional approach
export const notFoundHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const response = createNotFoundResponse(req.method, req.path);
    res.status(404).json(response);
};

// Higher-order function for async error handling
export const asyncHandler = <T extends any[]>(
    fn: (
        req: Request,
        res: Response,
        next: NextFunction,
        ...args: T
    ) => Promise<any>
) => {
    return (
        req: Request,
        res: Response,
        next: NextFunction,
        ...args: T
    ): void => {
        Promise.resolve(fn(req, res, next, ...args)).catch(next);
    };
};

// Functional approach for validation middleware
export const validateRequest =
    <T>(
        validator: (data: any) => T | null,
        errorMessage: string = "Validation failed"
    ) =>
    (req: Request, res: Response, next: NextFunction): void => {
        const validationResult = validator(req.body);

        if (validationResult === null) {
            const response = createErrorResponse(errorMessage);
            res.status(400).json(response);
            return;
        }

        // Attach validated data to request
        (req as any).validatedBody = validationResult;
        next();
    };

// Functional middleware for request logging
export const requestLogger =
    (logFn: (message: string) => void = console.log) =>
    (req: Request, res: Response, next: NextFunction): void => {
        const logMessage = `${new Date().toISOString()} - ${req.method} ${
            req.path
        }`;
        logFn(logMessage);
        next();
    };
