import { createPrivateKey, createPublicKey } from 'node:crypto';
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js';

enum KeyType {
    MLKEM768 = 'mlkem768',
    X25519 = 'x25519',
}

interface IKeyWithType {
    type: KeyType;
    value: string;
}

interface IDecryptionParsed {
    protocol: string; // 'mlkem768x25519plus'
    mode: string; // 'native' | 'xorpub' | 'random'
    ticketLifetime: string; // '600s' | '0s' | '300-600s'
    padding?: string; // '100-111-1111.75-0-111.50-0-3333'
    keys: IKeyWithType[]; // array of keys (can be X25519 or ML-KEM-768 in any order)
}

interface IPublicKeyWithType {
    type: KeyType;
    value: string;
}

interface IEncryptionGenerated {
    encryption: string;
    publicKeys: IPublicKeyWithType[]; // array of public keys in the same order
}

function detectKeyType(keyValue: string): KeyType {
    const buffer = Buffer.from(keyValue, 'base64');
    const length = buffer.length;

    if (length === 32) {
        return KeyType.X25519;
    }

    if (length === 64) {
        return KeyType.MLKEM768;
    }

    throw new Error(
        `Cannot detect key type: length ${length}. ` +
            `Expected 32 bytes for X25519 or 64 bytes for ML-KEM-768`,
    );
}

/**
 * Parses the decryption string (server configuration)
 *
 * Format: mlkem768x25519plus.{mode}.{ticket}.{padding}.{keys}...
 * Keys can be X25519 (32 bytes) or ML-KEM-768 (64 bytes) in any order
 *
 * @param decryption - decryption string from server configuration
 * @returns parsed object with parameters and keys
 * @throws Error if the string format is incorrect
 *
 */
export function parseDecryption(decryption: string): IDecryptionParsed {
    if (!decryption || typeof decryption !== 'string') {
        throw new Error('Decryption string is required');
    }

    const parts = decryption.split('.');

    const [protocol, mode, ticketLifetime, ...rest] = parts;

    if (protocol !== 'mlkem768x25519plus') {
        throw new Error(`Invalid protocol: ${protocol}. Expected 'mlkem768x25519plus'`);
    }

    const validModes = ['native', 'xorpub', 'random'];
    if (!validModes.includes(mode)) {
        throw new Error(`Invalid mode: ${mode}. Expected one of: ${validModes.join(', ')}`);
    }

    if (!ticketLifetime || ticketLifetime.length === 0) {
        throw new Error('Ticket lifetime is required (e.g., "600s", "0s", "300-600s")');
    }

    const paddingParts: string[] = [];
    const keyParts: string[] = [];
    let foundFirstKey = false;

    for (const part of rest) {
        if (!part || part.trim().length === 0) {
            if (!foundFirstKey) {
                paddingParts.push(part);
            }
            continue;
        }

        try {
            const buffer = Buffer.from(part, 'base64');
            const length = buffer.length;

            if (length === 32 || length === 64) {
                foundFirstKey = true;
                keyParts.push(part);
            } else if (!foundFirstKey) {
                paddingParts.push(part);
            } else {
                throw new Error(
                    `Invalid key length: ${length} bytes at position after keys started`,
                );
            }
        } catch (error) {
            if (!foundFirstKey) {
                paddingParts.push(part);
            } else {
                throw new Error(
                    `Invalid key format: ${error instanceof Error ? error.message : 'Unknown error'}`,
                );
            }
        }
    }

    if (keyParts.length === 0) {
        throw new Error('At least one key is required');
    }

    const keys: IKeyWithType[] = [];
    for (const keyValue of keyParts) {
        if (!keyValue || keyValue.trim().length === 0) {
            continue;
        }

        const keyType = detectKeyType(keyValue);
        keys.push({
            type: keyType,
            value: keyValue,
        });
    }

    if (keys.length === 0) {
        throw new Error('No valid keys found in decryption string');
    }

    const padding = paddingParts.join('.') || undefined;

    return {
        protocol,
        mode,
        ticketLifetime,
        padding,
        keys,
    };
}

export async function generateX25519PublicKey(privateKeyBase64: string): Promise<string> {
    try {
        const rawPrivateKey = Buffer.from(privateKeyBase64, 'base64');

        if (rawPrivateKey.length !== 32) {
            throw new Error(
                `Invalid X25519 private key length: ${rawPrivateKey.length}. Expected 32 bytes`,
            );
        }

        const jwkPrivateKey = {
            kty: 'OKP',
            crv: 'X25519',
            d: rawPrivateKey.toString('base64url'),
            x: '',
        };

        const privateKeyObj = createPrivateKey({
            key: jwkPrivateKey,
            format: 'jwk',
        });

        const publicKeyObj = createPublicKey(privateKeyObj);
        const publicKeyJwk = publicKeyObj.export({ format: 'jwk' });

        if (!publicKeyJwk.x) {
            throw new Error('Failed to generate public key: missing x coordinate');
        }

        return publicKeyJwk.x;
    } catch (error) {
        throw new Error(
            `Failed to generate X25519 public key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}

export function generateMlkem768PublicKey(seedBase64: string): string {
    try {
        const seedBuffer = Buffer.from(seedBase64, 'base64');

        if (seedBuffer.length !== 64) {
            throw new Error(
                `Invalid ML-KEM-768 seed length: ${seedBuffer.length}. Expected 64 bytes`,
            );
        }

        const { publicKey } = ml_kem768.keygen(seedBuffer);

        return Buffer.from(publicKey).toString('base64url');
    } catch (error) {
        throw new Error(
            `Failed to generate ML-KEM-768 public key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}

/**
 * Generates the encryption string from the decryption string
 *
 *
 * @param decryption - decryption string from server configuration
 * @returns object with encryption string and array of public keys
 * @throws Error if the decryption is invalid or the generation of keys failed
 *
 */
export async function generateEncryptionFromDecryption(
    decryption: string,
): Promise<IEncryptionGenerated> {
    const parsed = parseDecryption(decryption);

    const publicKeys: IPublicKeyWithType[] = [];

    for (const key of parsed.keys) {
        try {
            let publicKeyValue: string;

            if (key.type === KeyType.X25519) {
                publicKeyValue = await generateX25519PublicKey(key.value);
            } else {
                // ML-KEM-768
                publicKeyValue = generateMlkem768PublicKey(key.value);
            }

            publicKeys.push({
                type: key.type,
                value: publicKeyValue,
            });
        } catch (error) {
            throw new Error(
                `Failed to generate public key for ${key.type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    let rttMode = '1rtt';

    if (parsed.ticketLifetime === '0s') {
        rttMode = '1rtt';
    } else {
        rttMode = '0rtt';
    }

    const flatKeys: string[] = publicKeys.map((key) => key.value);

    const encryptionParts = [
        parsed.protocol, // mlkem768x25519plus
        parsed.mode, // native/xorpub/random
        rttMode, // 0rtt/1rtt
    ];

    if (parsed.padding) {
        encryptionParts.push(parsed.padding);
    }

    encryptionParts.push(...flatKeys);

    const encryption = encryptionParts.join('.');

    return {
        encryption,
        publicKeys,
    };
}
