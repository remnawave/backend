import { Prisma } from '@prisma/client';

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

export function wrapDbNull<T>(value: T, filterEmptyObj?: boolean): T | typeof Prisma.DbNull {
    if (value === null) return Prisma.DbNull;
    if (filterEmptyObj && typeof value === 'object' && Object.keys(value).length === 0)
        return Prisma.DbNull;
    return value;
}

export function mapDefined<T, R>(value: T | undefined, fn: (v: T) => R): R | undefined {
    return value !== undefined ? fn(value) : undefined;
}

export function hasContent<T>(value: T | undefined | null): value is NonNullable<T> {
    if (value === null || value === undefined) return false;
    if (typeof value === 'object' && Object.keys(value).length === 0) return false;
    return true;
}
