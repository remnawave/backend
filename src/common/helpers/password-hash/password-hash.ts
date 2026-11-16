import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const PASSWORD_HASH_PREFIX = 'v2$';
const PASSWORD_KEY_CONTEXT = 'remnawave:admin-password:v2';
const SALT_BYTES = 16;
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 1024, r: 8, p: 1 };
const DUMMY_SALT = '0'.repeat(SALT_BYTES * 2);

function derivePasswordKey(
    plainPassword: string,
    salt: string,
    appSecret: string,
): Promise<Buffer> {
    const pepper = createHmac('sha256', appSecret).update(PASSWORD_KEY_CONTEXT).digest();
    const peppered = createHmac('sha256', pepper).update(plainPassword).digest();

    return new Promise((resolve, reject) => {
        scrypt(peppered, salt, KEY_LENGTH, SCRYPT_OPTIONS, (error, key) => {
            if (error) reject(error);
            else resolve(key);
        });
    });
}

export async function hashPassword(plainPassword: string, appSecret: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES).toString('hex');
    const key = await derivePasswordKey(plainPassword, salt, appSecret);

    return `${PASSWORD_HASH_PREFIX}${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(
    plainPassword: string,
    storedHash: string,
    appSecret: string,
): Promise<boolean> {
    if (!storedHash.startsWith(PASSWORD_HASH_PREFIX)) return false;

    const [salt = '', hash = ''] = storedHash.slice(PASSWORD_HASH_PREFIX.length).split('$');

    const expected = Buffer.from(hash, 'hex');
    const actual = await derivePasswordKey(plainPassword, salt, appSecret);

    return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function simulatePasswordVerification(
    plainPassword: string,
    appSecret: string,
): Promise<void> {
    await derivePasswordKey(plainPassword, DUMMY_SALT, appSecret);
}
