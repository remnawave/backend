export function wrapBigInt(value: number | bigint | string | undefined): bigint | undefined {
    if (value === undefined) {
        return value;
    }

    return BigInt(value);
}

export function wrapBigIntNullable(
    value: number | bigint | undefined | null,
): bigint | undefined | null {
    if (value === undefined || value === null) {
        return value;
    }

    return BigInt(value);
}

export function mapDefined<T, R>(value: T | undefined, fn: (v: T) => R): R | undefined {
    return value !== undefined ? fn(value) : undefined;
}
