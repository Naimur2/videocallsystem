/**
 * Validation utility functions
 */

export const validateRequired = (
    value: any,
    fieldName: string
): string | null => {
    if (!value || (typeof value === "string" && value.trim() === "")) {
        return `${fieldName} is required`;
    }
    return null;
};

export const validateEmail = (email: string): string | null => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return "Please provide a valid email address";
    }
    return null;
};

export const validateStringLength = (
    value: string,
    fieldName: string,
    minLength: number = 1,
    maxLength: number = 255
): string | null => {
    if (!value) return `${fieldName} is required`;
    if (value.length < minLength) {
        return `${fieldName} must be at least ${minLength} characters long`;
    }
    if (value.length > maxLength) {
        return `${fieldName} must not exceed ${maxLength} characters`;
    }
    return null;
};

export const validateRoomName = (name: string): string | null => {
    return validateStringLength(name, "Room name", 3, 100);
};

export const validateParticipantName = (name: string): string | null => {
    return validateStringLength(name, "Participant name", 2, 50);
};

export const validateChatMessage = (message: string): string | null => {
    return validateStringLength(message, "Chat message", 1, 500);
};

export const validateUuid = (id: string, fieldName: string): string | null => {
    if (!id) return `${fieldName} is required`;
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return `${fieldName} must be a valid UUID`;
    }
    return null;
};

export const validateId = (id: string, fieldName: string): string | null => {
    return validateRequired(id, fieldName);
};

export const combineValidationErrors = (
    ...errors: (string | null)[]
): string | null => {
    const validErrors = errors.filter((error) => error !== null);
    return validErrors.length > 0 ? validErrors.join(", ") : null;
};
