import { hkdfSync, timingSafeEqual } from 'node:crypto';

const HKDF_INFO = 'rw-v1';
const TLDS = ['com', 'net', 'org', 'io', 'dev', 'app'];

export function deriveSni(caCertPem: string, jwtPublicKey: string): string {
    const canon = (pem: string) =>
        pem.replace(/-----[^-]+-----/g, '').replace(/[^A-Za-z0-9+/=]/g, '');

    const ikm = Buffer.concat([
        Buffer.from(canon(jwtPublicKey), 'utf8'),
        Buffer.from(canon(caCertPem), 'utf8'),
    ]);

    const okm = Buffer.from(hkdfSync('sha256', ikm, Buffer.alloc(0), HKDF_INFO, 22));
    const host = okm.subarray(0, 16).toString('hex');
    return `${host}.${okm.subarray(16, 21).toString('hex')}.${TLDS[okm[21] % TLDS.length]}`;
}

export function makeSniVerifier(
    caCertPem: string,
    jwtPublicKey: string,
): (servername: string) => boolean {
    const expected = Buffer.from(deriveSni(caCertPem, jwtPublicKey));

    return (servername: string): boolean => {
        if (!servername) return false;
        const got = Buffer.from(servername);
        if (got.length !== expected.length) return false;
        return timingSafeEqual(got, expected);
    };
}
