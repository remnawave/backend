import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';

import {
    generateEncryptionFromDecryption,
    generateX25519PublicKey,
} from '../vless-encryption/generate-encryption-from-decryption';

const x25519PublicKeyCache = new Map<string, string>();
const mldsa65PublicKeyCache = new Map<string, string>();
const encryptionCache = new Map<string, string>();

export async function resolveInboundAndPublicKey(inbounds: any[]): Promise<Map<string, string>> {
    const publicKeyMap = new Map<string, string>();

    for (const inbound of inbounds) {
        const privateKey = inbound.streamSettings?.realitySettings?.privateKey;

        if (!privateKey || publicKeyMap.has(inbound.tag)) {
            continue;
        }

        try {
            let pubKeyRaw = x25519PublicKeyCache.get(privateKey);

            if (pubKeyRaw === undefined) {
                pubKeyRaw = await generateX25519PublicKey(privateKey);
                x25519PublicKeyCache.set(privateKey, pubKeyRaw);
            }

            publicKeyMap.set(inbound.tag, pubKeyRaw);
        } catch {
            continue;
        }
    }

    return publicKeyMap;
}

export async function resolveInboundAndMlDsa65PublicKey(
    inbounds: any[],
): Promise<Map<string, string>> {
    const mldsa65PublicKeyMap = new Map<string, string>();

    for (const inbound of inbounds) {
        const seed = inbound.streamSettings?.realitySettings?.mldsa65Seed;

        if (!seed || mldsa65PublicKeyMap.has(inbound.tag)) {
            continue;
        }

        try {
            let publicKey = mldsa65PublicKeyCache.get(seed);

            if (publicKey === undefined) {
                const derived = getMlDsa65PublicKey(seed);

                if (!derived) {
                    continue;
                }

                publicKey = derived;
                mldsa65PublicKeyCache.set(seed, publicKey);
            }

            mldsa65PublicKeyMap.set(inbound.tag, publicKey);
        } catch {
            continue;
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

            const decryption = inbound.settings?.decryption;

            if (!decryption || decryption === 'none') {
                continue;
            }

            if (encryptionMap.has(inbound.tag)) {
                continue;
            }

            let encryption = encryptionCache.get(decryption);

            if (encryption === undefined) {
                const generated = await generateEncryptionFromDecryption(decryption);
                encryption = generated.encryption;
                encryptionCache.set(decryption, encryption);
            }

            encryptionMap.set(inbound.tag, encryption);
        } catch {
            continue;
        }
    }

    return encryptionMap;
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
