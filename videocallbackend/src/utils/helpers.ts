/**
 * ID generation and common utility functions
 */

import { v4 as uuidv4 } from "uuid";

export const generateUuid = (): string => uuidv4();

export const generateId = (): string =>
    Math.random().toString(36).substring(2) + Date.now().toString(36);

export const generateRoomId = (): string => `room_${generateUuid()}`;

export const generateParticipantId = (): string =>
    `participant_${generateUuid()}`;

export const generateChatMessageId = (): string => `msg_${generateUuid()}`;

export const getCurrentTimestamp = (): Date => new Date();

export const formatTimestamp = (date: Date): string => date.toISOString();

export const isValidDate = (date: any): date is Date =>
    date instanceof Date && !isNaN(date.getTime());

export const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    delay: number
): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    delay: number
): ((...args: Parameters<T>) => void) => {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func(...args);
        }
    };
};

export const safeJsonParse = <T = any>(
    jsonString: string,
    defaultValue: T
): T => {
    try {
        return JSON.parse(jsonString) as T;
    } catch {
        return defaultValue;
    }
};

export const safeJsonStringify = (
    obj: any,
    defaultValue: string = "{}"
): string => {
    try {
        return JSON.stringify(obj);
    } catch {
        return defaultValue;
    }
};

export const removeEmpty = <T extends Record<string, any>>(
    obj: T
): Partial<T> => {
    return Object.fromEntries(
        Object.entries(obj).filter(
            ([_, value]) =>
                value !== null && value !== undefined && value !== ""
        )
    ) as Partial<T>;
};

export const pick = <T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach((key) => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
};

export const omit = <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach((key) => delete result[key]);
    return result;
};
