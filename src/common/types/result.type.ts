export type TResult<T> =
    | { isOk: true; response: T }
    | { isOk: false; code?: string; message?: string };

export function fail<E extends { code: string; message: string }>(error: E) {
    return { isOk: false as const, ...error };
}

export function ok<T>(response: T): TResult<T> {
    return { isOk: true as const, response };
}
