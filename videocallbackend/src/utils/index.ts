// Export all utility functions
export * from "./functional";
export * from "./helpers";
export * from "./response";
export * from "./validation";

// Legacy utilities (keeping for backward compatibility)
export const generateId = (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const formatError = (error: any): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
};

export const isValidString = (value: any): value is string => {
    return typeof value === "string" && value.trim().length > 0;
};

export const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
