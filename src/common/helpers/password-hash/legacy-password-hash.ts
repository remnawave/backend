import { createHmac, scrypt, timingSafeEqual } from 'node:crypto';

const LEGACY_PASSWORD_HASH_REGEX = /^[\da-f]{32}:[\da-f]{128}$/;
const LEGACY_KEY_LENGTH = 64;

export function isLegacyPasswordHash(storedHash: string): boolean {
    return LEGACY_PASSWORD_HASH_REGEX.test(storedHash);
}

export async function verifyLegacyPassword(
    plainPassword: string,
    storedHash: string,
    appSecret: string,
): Promise<boolean> {
    if (!isLegacyPasswordHash(storedHash)) return false;

    const [salt, hash] = storedHash.split(':');
    const peppered = createHmac('sha256', appSecret).update(plainPassword).digest('hex');

    const actual = await new Promise<Buffer>((resolve, reject) => {
        scrypt(peppered, salt, LEGACY_KEY_LENGTH, (error, key) => {
            if (error) reject(error);
            else resolve(key);
        });
    });

    return timingSafeEqual(Buffer.from(hash, 'hex'), actual);
}
