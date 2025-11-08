import { createPrivateKey, createPublicKey, KeyObject } from 'node:crypto';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';

import { generateEncryptionFromDecryption } from '../vless-encryption/generate-encryption-from-decryption';

export async function resolveInboundAndPublicKey(inbounds: any[]): Promise<Map<string, string>> {
    const publicKeyMap = new Map<string, string>();

    for (const inbound of inbounds) {
        if (inbound.streamSettings?.realitySettings?.privateKey) {
            try {
                if (publicKeyMap.has(inbound.tag)) {
                    continue;
                }

                const { publicKey: jwkPublicKey } = await createX25519KeyPairFromBase64(
                    inbound.streamSettings.realitySettings.privateKey,
                );

                const publicKeyJwk = jwkPublicKey.export({ format: 'jwk' });

                if (!publicKeyJwk) {
                    continue;
                }

                const pubKeyRaw = publicKeyJwk.x;

                if (!pubKeyRaw) {
                    continue;
                }

                publicKeyMap.set(inbound.tag, pubKeyRaw);
            } catch {
                continue;
            }
        }
    }

    return publicKeyMap;
}

export async function resolveInboundAndMlDsa65PublicKey(
    inbounds: any[],
): Promise<Map<string, string>> {
    const mldsa65PublicKeyMap = new Map<string, string>();

    for (const inbound of inbounds) {
        if (inbound.streamSettings?.realitySettings?.mldsa65Seed) {
            try {
                if (mldsa65PublicKeyMap.has(inbound.tag)) {
                    continue;
                }

                const publicKey = getMlDsa65PublicKey(
                    inbound.streamSettings.realitySettings.mldsa65Seed,
                );

                if (!publicKey) {
                    continue;
                }

                mldsa65PublicKeyMap.set(inbound.tag, publicKey);
            } catch {
                continue;
            }
        }
    }

    return mldsa65PublicKeyMap;
}

export async function resolveEncryptionFromDecryption(
    inbounds: any[],
): Promise<Map<string, string>> {
    const encryptionMap = new Map<string, string>();

    for (const inbound of inbounds) {
        try {
            if (inbound.protocol !== 'vless') {
                continue;
            }

            if (!inbound.settings) {
                continue;
            }

            if (!inbound.settings.decryption) {
                continue;
            }

            if (inbound.settings.decryption === 'none') {
                continue;
            }

            if (encryptionMap.has(inbound.tag)) {
                continue;
            }

            const encryption = await generateEncryptionFromDecryption(inbound.settings.decryption);

            encryptionMap.set(inbound.tag, encryption.encryption);
        } catch {
            continue;
        }
    }

    return encryptionMap;
}

async function createX25519KeyPairFromBase64(base64PrivateKey: string): Promise<{
    publicKey: KeyObject;
    privateKey: KeyObject;
}> {
    return new Promise((resolve, reject) => {
        try {
            const rawPrivateKey = Buffer.from(base64PrivateKey, 'base64');

            const jwkPrivateKey = {
                kty: 'OKP',
                crv: 'X25519',
                d: Buffer.from(rawPrivateKey).toString('base64url'),
                x: '',
            };

            const privateKey = createPrivateKey({
                key: jwkPrivateKey,
                format: 'jwk',
            });

            const publicKey = createPublicKey(privateKey);

            resolve({ publicKey, privateKey });
        } catch (error) {
            reject(error);
        }
    });
}

export function getMlDsa65PublicKey(seed: string): string | null {
    try {
        const seedBuffer = Buffer.from(seed, 'base64');
        const { publicKey } = ml_dsa65.keygen(seedBuffer);
        return Buffer.from(publicKey).toString('base64url');
    } catch {
        return null;
    }
}
