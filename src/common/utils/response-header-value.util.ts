import { validateHeaderValue } from 'node:http';

/**
 * Headers that clients accept as `base64:<base64 of UTF-8>`,
 * same output as the `rwEncodeBase64:` template prefix.
 */
const BASE64_CAPABLE_HEADERS = new Set(['announce', 'profile-title']);

const NON_PRINTABLE_ASCII_REGEX = /[^\x20-\x7e]/;

/**
 * Returns a value that can be safely passed to `res.setHeader()`.
 * `announce` and `profile-title` with non-ASCII text are base64-encoded,
 * any other value Node.js would reject yields `null`.
 */
export function toSafeHeaderValue(key: string, value: string): string | null {
    if (BASE64_CAPABLE_HEADERS.has(key.toLowerCase()) && NON_PRINTABLE_ASCII_REGEX.test(value)) {
        return `base64:${Buffer.from(value, 'utf8').toString('base64')}`;
    }

    try {
        validateHeaderValue(key, value);
        return value;
    } catch {
        return null;
    }
}
