import { CipherType } from '@remnawave/node-contract';

export enum ShadowsocksMethod {
    AES_128_GCM = 'aes-128-gcm',
    AES_256_GCM = 'aes-256-gcm',
    CHACHA20_IETF_POLY1305 = 'chacha20-ietf-poly1305',
    SS2022_BLAKE3_AES_256_GCM = '2022-blake3-aes-256-gcm',
}

export const SHADOWSOCKS_METHODS = [
    ShadowsocksMethod.AES_128_GCM,
    ShadowsocksMethod.AES_256_GCM,
    ShadowsocksMethod.CHACHA20_IETF_POLY1305,
    ShadowsocksMethod.SS2022_BLAKE3_AES_256_GCM,
];

type RawInbound = {
    settings?: {
        method?: string;
        [key: string]: any;
    };
    [key: string]: any;
} | null;

function getMethodFromRawInbound(rawInbound: RawInbound): string | undefined {
    return rawInbound?.settings?.method;
}

export function getCipherTypeFromString(rawInbound: RawInbound): CipherType {
    const method = getMethodFromRawInbound(rawInbound);
    switch (method) {
        case ShadowsocksMethod.CHACHA20_IETF_POLY1305:
            return CipherType.CHACHA20_POLY1305;
        case ShadowsocksMethod.AES_128_GCM:
            return CipherType.AES_128_GCM;
        case ShadowsocksMethod.AES_256_GCM:
            return CipherType.AES_256_GCM;
        default:
            return CipherType.CHACHA20_POLY1305;
    }
}

export function isSS2022Method(rawInbound: RawInbound): boolean {
    return getMethodFromRawInbound(rawInbound) === ShadowsocksMethod.SS2022_BLAKE3_AES_256_GCM;
}

export function isSS2022MethodFromMethod(method: string | undefined): boolean {
    if (!method) {
        return false;
    }
    return method === ShadowsocksMethod.SS2022_BLAKE3_AES_256_GCM;
}

export function encodeSS2022Password(password: string): string {
    return Buffer.from(password).toString('base64');
}

export function getSsPassword(password: string, isSS2022: boolean): string {
    return isSS2022 ? encodeSS2022Password(password) : password;
}
