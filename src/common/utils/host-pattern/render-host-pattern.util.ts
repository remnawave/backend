import { isPlainObject } from 'lodash';
import { customAlphabet } from 'nanoid';
import { randomUUID } from 'node:crypto';

const ALPHABETS = {
    nanoid: '0123456789abcdefghijklmnopqrstuvwxyz',
    alpha: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789',
    hex: '0123456789abcdef',
} as const;

type TAlphabet = keyof typeof ALPHABETS;
type TPatternPart = (() => string) | string;

const WILDCARD_LENGTH = 10;
const MAX_TOKEN_LENGTH = 63;
const MAX_CACHED_PATTERNS = 1000;

const TOKEN_SOURCE = String.raw`\{uuid\}|\{(nanoid|alpha|digits|hex):(\d{1,2})\}|\{range:(\d{1,9})-(\d{1,9})\}|\{pick:([^{}]*)\}`;

const HOST_PATTERN_REGEX = new RegExp(String.raw`\*|${TOKEN_SOURCE}`, 'g');
const RANDOM_TOKEN_REGEX = new RegExp(TOKEN_SOURCE, 'g');

const generators = new Map<string, () => string>();
const hostPatterns = new Map<string, TPatternPart[]>();
const randomTokenPatterns = new Map<string, TPatternPart[]>();

function getGenerator(alphabet: TAlphabet, size: number): () => string {
    const key = `${alphabet}:${size}`;
    let generator = generators.get(key);

    if (!generator) {
        generator = customAlphabet(ALPHABETS[alphabet], size);
        generators.set(key, generator);
    }

    return generator;
}

function createRange(token: string, rawFrom: string, rawTo: string): TPatternPart {
    const from = Number(rawFrom);
    const span = Number(rawTo) - from + 1;

    if (span < 1) return token;

    const width = rawFrom.length > 1 && rawFrom.startsWith('0') ? rawFrom.length : 0;

    return () => (from + Math.floor(Math.random() * span)).toString().padStart(width, '0');
}

function createPart(match: RegExpExecArray): TPatternPart {
    const [token, alphabet, rawSize, rangeFrom, rangeTo, pickOptions] = match;

    if (token === '*') return getGenerator('nanoid', WILDCARD_LENGTH);
    if (token === '{uuid}') return randomUUID;

    if (rangeFrom !== undefined && rangeTo !== undefined) {
        return createRange(token, rangeFrom, rangeTo);
    }

    if (pickOptions !== undefined) {
        const options = pickOptions.split('|');

        return () => options[Math.floor(Math.random() * options.length)];
    }

    const size = Number(rawSize);

    if (size < 1 || size > MAX_TOKEN_LENGTH) return token;

    return getGenerator(alphabet as TAlphabet, size);
}

function compilePattern(value: string, regex: RegExp): TPatternPart[] {
    const parts: TPatternPart[] = [];
    let cursor = 0;

    for (const match of value.matchAll(regex)) {
        if (match.index > cursor) parts.push(value.slice(cursor, match.index));

        parts.push(createPart(match));
        cursor = match.index + match[0].length;
    }

    if (cursor < value.length) parts.push(value.slice(cursor));

    return parts;
}

function renderPattern(value: string, regex: RegExp, cache: Map<string, TPatternPart[]>): string {
    let parts = cache.get(value);

    if (!parts) {
        parts = compilePattern(value, regex);

        if (cache.size >= MAX_CACHED_PATTERNS) cache.clear();
        cache.set(value, parts);
    }

    let result = '';

    for (const part of parts) {
        result += typeof part === 'string' ? part : part();
    }

    return result;
}

export function renderHostPattern(value: string): string {
    if (!value.includes('{') && !value.includes('*')) return value;

    return renderPattern(value, HOST_PATTERN_REGEX, hostPatterns);
}

function renderRandomTokenString(value: string): string {
    if (!value.includes('{')) return value;

    return renderPattern(value, RANDOM_TOKEN_REGEX, randomTokenPatterns);
}

export function renderRandomTokens<T>(value: T): T {
    if (typeof value === 'string') return renderRandomTokenString(value) as T;

    if (Array.isArray(value)) return value.map((item) => renderRandomTokens(item)) as T;

    if (isPlainObject(value)) {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, item]) => [
                key,
                renderRandomTokens(item),
            ]),
        ) as T;
    }

    return value;
}
