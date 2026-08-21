import { customAlphabet } from 'nanoid';
import { randomUUID } from 'node:crypto';

import { SHORT_UUID_ALPHABET } from './short-uuid.constants';

const pickFromAlphabet = (predicate: RegExp): string =>
    [...SHORT_UUID_ALPHABET].filter((char) => predicate.test(char)).join('');

const ALPHABETS = {
    nanoid: SHORT_UUID_ALPHABET,
    alpha: pickFromAlphabet(/[A-Za-z]/),
    digits: pickFromAlphabet(/[0-9]/),
    hex: pickFromAlphabet(/[0-9a-f]/),
} as const;

const TOKEN_REGEX = /\{([a-z]+)(?::(\d+))?\}/g;

const LITERAL_REGEX = /^[A-Za-z0-9_-]+$/;

const UUID_ENTROPY_BITS = 122;
const UUID_LENGTH = 36;

export const MIN_SHORT_UUID_ENTROPY_BITS = 64;
export const MIN_SHORT_UUID_LENGTH = 16;
export const MAX_SHORT_UUID_LENGTH = 64;

export interface ICompiledShortUuidPattern {
    entropyBits: number;
    generate: () => string;
    length: number;
}

export function compileShortUuidPattern(pattern: string): ICompiledShortUuidPattern {
    if (pattern.length === 0) {
        throw new Error('pattern must not be empty');
    }

    const parts: Array<() => string> = [];

    let entropyBits = 0;
    let length = 0;
    let cursor = 0;

    const pushLiteral = (literal: string): void => {
        if (literal.length === 0) {
            return;
        }

        if (!LITERAL_REGEX.test(literal)) {
            throw new Error(
                `literal "${literal}" contains characters that are not allowed in a short uuid, allowed characters are A-Z, a-z, 0-9, _ and -`,
            );
        }

        parts.push(() => literal);
        length += literal.length;
    };

    TOKEN_REGEX.lastIndex = 0;

    let match: null | RegExpExecArray;

    while ((match = TOKEN_REGEX.exec(pattern)) !== null) {
        pushLiteral(pattern.slice(cursor, match.index));
        cursor = match.index + match[0].length;

        const [rawToken, tokenName, rawSize] = match;

        if (tokenName === 'uuid') {
            if (rawSize !== undefined) {
                throw new Error(`"${rawToken}" does not accept a length`);
            }

            parts.push(randomUUID);
            entropyBits += UUID_ENTROPY_BITS;
            length += UUID_LENGTH;

            continue;
        }

        const alphabet = ALPHABETS[tokenName as keyof typeof ALPHABETS];

        if (alphabet === undefined) {
            throw new Error(
                `unknown token "${rawToken}", expected one of {nanoid:N}, {alpha:N}, {digits:N}, {hex:N}, {uuid}`,
            );
        }

        const size = rawSize === undefined ? 0 : parseInt(rawSize, 10);

        if (size < 1 || size > MAX_SHORT_UUID_LENGTH) {
            throw new Error(
                `"${rawToken}" must specify a length between 1 and ${MAX_SHORT_UUID_LENGTH}`,
            );
        }

        parts.push(customAlphabet(alphabet, size));
        entropyBits += size * Math.log2(alphabet.length);
        length += size;
    }

    pushLiteral(pattern.slice(cursor));

    if (length < MIN_SHORT_UUID_LENGTH || length > MAX_SHORT_UUID_LENGTH) {
        throw new Error(
            `pattern produces ${length} characters, must be between ${MIN_SHORT_UUID_LENGTH} and ${MAX_SHORT_UUID_LENGTH}`,
        );
    }

    if (entropyBits < MIN_SHORT_UUID_ENTROPY_BITS) {
        throw new Error(
            `pattern has only ~${Math.floor(entropyBits)} bits of randomness, at least ${MIN_SHORT_UUID_ENTROPY_BITS} are required to avoid collisions`,
        );
    }

    return {
        entropyBits,
        generate: () => parts.map((part) => part()).join(''),
        length,
    };
}
