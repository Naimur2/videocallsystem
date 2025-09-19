// Functional programming utilities

// Maybe type for handling null/undefined values
export type Maybe<T> = T | null | undefined;

// Result type for error handling
export type Result<T, E = Error> =
    | { success: true; data: T }
    | { success: false; error: E };

// Pipe function for function composition
export const pipe =
    <T>(...fns: Array<(arg: T) => T>) =>
    (value: T): T =>
        fns.reduce((acc, fn) => fn(acc), value);

// Compose function (right to left composition)
export const compose =
    <T>(...fns: Array<(arg: T) => T>) =>
    (value: T): T =>
        fns.reduceRight((acc, fn) => fn(acc), value);

// Curry function to convert multi-argument functions to curried form (simplified)
export const curry =
    <A, B, R>(fn: (a: A, b: B) => R) =>
    (a: A) =>
    (b: B): R =>
        fn(a, b);

export const curry3 =
    <A, B, C, R>(fn: (a: A, b: B, c: C) => R) =>
    (a: A) =>
    (b: B) =>
    (c: C): R =>
        fn(a, b, c);

// Partial application
export const partial =
    <T extends any[], R>(fn: (...args: T) => R, ...partialArgs: Partial<T>) =>
    (...remainingArgs: any[]): R =>
        fn(...(partialArgs.concat(remainingArgs) as T));

// Map function for arrays
export const map =
    <T, U>(fn: (item: T) => U) =>
    (array: T[]): U[] =>
        array.map(fn);

// Filter function for arrays
export const filter =
    <T>(predicate: (item: T) => boolean) =>
    (array: T[]): T[] =>
        array.filter(predicate);

// Reduce function for arrays
export const reduce =
    <T, U>(reducer: (acc: U, current: T) => U, initialValue: U) =>
    (array: T[]): U =>
        array.reduce(reducer, initialValue);

// Find function for arrays
export const find =
    <T>(predicate: (item: T) => boolean) =>
    (array: T[]): T | undefined =>
        array.find(predicate);

// Identity function
export const identity = <T>(x: T): T => x;

// Constant function
export const constant =
    <T>(value: T) =>
    (): T =>
        value;

// Tap function for side effects without changing the value
export const tap =
    <T>(fn: (value: T) => void) =>
    (value: T): T => {
        fn(value);
        return value;
    };

// Maybe utilities
export const isSome = <T>(value: Maybe<T>): value is T =>
    value !== null && value !== undefined;

export const isNone = <T>(value: Maybe<T>): value is null | undefined =>
    value === null || value === undefined;

export const mapMaybe =
    <T, U>(fn: (value: T) => U) =>
    (maybe: Maybe<T>): Maybe<U> =>
        isSome(maybe) ? fn(maybe) : (maybe as Maybe<U>);

export const flatMapMaybe =
    <T, U>(fn: (value: T) => Maybe<U>) =>
    (maybe: Maybe<T>): Maybe<U> =>
        isSome(maybe) ? fn(maybe) : (maybe as Maybe<U>);

export const getOrElse =
    <T>(defaultValue: T) =>
    (maybe: Maybe<T>): T =>
        isSome(maybe) ? maybe : defaultValue;

// Result utilities
export const ok = <T, E = Error>(data: T): Result<T, E> => ({
    success: true,
    data,
});

export const err = <T, E = Error>(error: E): Result<T, E> => ({
    success: false,
    error,
});

export const isOk = <T, E>(
    result: Result<T, E>
): result is { success: true; data: T } => result.success;

export const isErr = <T, E>(
    result: Result<T, E>
): result is { success: false; error: E } => !result.success;

export const mapResult =
    <T, U, E>(fn: (value: T) => U) =>
    (result: Result<T, E>): Result<U, E> =>
        isOk(result) ? ok(fn(result.data)) : (result as Result<U, E>);

export const flatMapResult =
    <T, U, E>(fn: (value: T) => Result<U, E>) =>
    (result: Result<T, E>): Result<U, E> =>
        isOk(result) ? fn(result.data) : (result as Result<U, E>);

export const getOrElseResult =
    <T, E>(defaultValue: T) =>
    (result: Result<T, E>): T =>
        isOk(result) ? result.data : defaultValue;

// Async utilities
export const asyncPipe =
    <T>(...fns: Array<(arg: T) => Promise<T>>) =>
    async (value: T): Promise<T> => {
        let result = value;
        for (const fn of fns) {
            result = await fn(result);
        }
        return result;
    };

export const asyncMap =
    <T, U>(fn: (item: T) => Promise<U>) =>
    async (array: T[]): Promise<U[]> =>
        Promise.all(array.map(fn));

// Predicate utilities
export const not =
    <T>(predicate: (value: T) => boolean) =>
    (value: T): boolean =>
        !predicate(value);

export const and =
    <T>(...predicates: Array<(value: T) => boolean>) =>
    (value: T): boolean =>
        predicates.every((predicate) => predicate(value));

export const or =
    <T>(...predicates: Array<(value: T) => boolean>) =>
    (value: T): boolean =>
        predicates.some((predicate) => predicate(value));
