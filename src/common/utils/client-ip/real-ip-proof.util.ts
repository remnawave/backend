import { createHmac, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';

import { ROLE } from '@libs/contracts/constants';

const PROOF_CONTEXT = 'remnawave-real-ip:v1';
const MAX_CLOCK_SKEW_SECONDS = 300;
const MAX_PROOF_LENGTH = 1024;
const UNSPECIFIED_IPS = new Set(['0.0.0.0', '::', '::0', '0:0:0:0:0:0:0:0']);

interface IProofTokenPayload {
    exp?: unknown;
    role?: unknown;
    uuid?: unknown;
}

function parseJson<T>(segment: string): null | T {
    try {
        return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as T;
    } catch {
        return null;
    }
}

export function isUsableIp(ip: string): boolean {
    return isIP(ip) !== 0 && !UNSPECIFIED_IPS.has(ip);
}

export function verifyRealIpProof(
    ip: string,
    proof: string,
    appSecret: string,
    nowSeconds = Math.floor(Date.now() / 1000),
): null | string {
    if (proof.length > MAX_PROOF_LENGTH || !isUsableIp(ip)) return null;

    const parts = proof.split('.');
    if (parts.length !== 4) return null;

    const [header, payload, timestamp, mac] = parts;

    if (!/^\d{1,12}$/.test(timestamp)) return null;
    if (Math.abs(nowSeconds - Number(timestamp)) > MAX_CLOCK_SKEW_SECONDS) return null;

    if (parseJson<{ alg?: unknown }>(header)?.alg !== 'HS256') return null;

    const claims = parseJson<IProofTokenPayload>(payload);

    if (!claims || claims.role !== ROLE.API || typeof claims.uuid !== 'string') return null;
    if (typeof claims.exp !== 'number' || claims.exp <= nowSeconds) return null;

    const tokenSignature = createHmac('sha256', appSecret).update(`${header}.${payload}`).digest();

    const expected = createHmac('sha256', tokenSignature)
        .update(`${PROOF_CONTEXT}|${ip}|${timestamp}`)
        .digest();
    const actual = Buffer.from(mac, 'base64url');

    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

    return claims.uuid;
}
