import { createHash, createPrivateKey, X509Certificate } from 'node:crypto';

import { ACME_KEY_TYPE, TAcmeKeyType } from '@libs/contracts/constants';

export interface IParsedCertificate {
    /** SHA-256 of the leaf certificate, hex. */
    fingerprint: string;
    /** Every name the certificate covers, taken from SAN (or the common name if it has none). */
    domains: string[];
    expiresAt: Date;
    /** Descriptive only: an imported certificate is never re-issued by the panel. */
    keyType: TAcmeKeyType;
    /** Already past its notAfter. Importing one is allowed, but it is not silent. */
    isExpired: boolean;
    issuedAt: Date;
    /** Normalized material, ready to store. */
    fullchainPem: string;
    privateKeyPem: string;
}

/**
 * Reads uploaded material and checks it is usable before anything is stored.
 *
 * The important check is that the key belongs to the certificate: a mismatched
 * pair is accepted by every text field in the world and only fails much later,
 * on the node, as a TLS handshake error nobody connects back to this import.
 */
export function parseCertificateMaterial(
    fullchainInput: string,
    privateKeyInput: string,
): IParsedCertificate {
    const fullchainPem = normalizePem(fullchainInput);
    const privateKeyPem = normalizePem(privateKeyInput);

    let certificate: X509Certificate;

    try {
        certificate = new X509Certificate(fullchainPem);
    } catch (error) {
        throw new Error(`The certificate could not be parsed: ${describe(error)}`);
    }

    let privateKey;

    try {
        privateKey = createPrivateKey(privateKeyPem);
    } catch (error) {
        throw new Error(
            `The private key could not be parsed: ${describe(error)}. Encrypted keys must be decrypted first.`,
        );
    }

    if (!certificate.checkPrivateKey(privateKey)) {
        throw new Error('The private key does not match the certificate');
    }

    const domains = readDomains(certificate);

    if (domains.length === 0) {
        throw new Error('The certificate carries no domain names');
    }

    const expiresAt = new Date(certificate.validTo);

    return {
        domains,
        expiresAt,
        fingerprint: createHash('sha256').update(certificate.raw).digest('hex'),
        fullchainPem,
        isExpired: expiresAt.getTime() <= Date.now(),
        issuedAt: new Date(certificate.validFrom),
        keyType: readKeyType(certificate),
        privateKeyPem,
    };
}

/**
 * Files arrive with whatever line endings and trailing whitespace the editor or
 * the OS left behind. Xray takes the PEM as an array of lines, so it is
 * normalized once here rather than at every place that reads it back.
 */
function normalizePem(input: string): string {
    return `${input.replace(/\r\n/g, '\n').trim()}\n`;
}

function readDomains(certificate: X509Certificate): string[] {
    const altNames = certificate.subjectAltName ?? '';

    const domains = altNames
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.startsWith('DNS:'))
        .map((entry) => entry.slice('DNS:'.length).toLowerCase());

    if (domains.length > 0) {
        return [...new Set(domains)];
    }

    // Certificates old enough to have no SAN still exist in private PKIs. An
    // empty subject comes back as undefined, not as an empty string.
    const commonName = (certificate.subject ?? '')
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.startsWith('CN='))
        ?.slice(3)
        .toLowerCase();

    return commonName ? [commonName] : [];
}

function readKeyType(certificate: X509Certificate): TAcmeKeyType {
    const key = certificate.publicKey;
    const details = key.asymmetricKeyDetails ?? {};

    if (key.asymmetricKeyType === 'ec') {
        return details.namedCurve === 'secp384r1'
            ? ACME_KEY_TYPE.ECDSA_P384
            : ACME_KEY_TYPE.ECDSA_P256;
    }

    if (key.asymmetricKeyType === 'rsa') {
        return (details.modulusLength ?? 0) >= 4096
            ? ACME_KEY_TYPE.RSA_4096
            : ACME_KEY_TYPE.RSA_2048;
    }

    return ACME_KEY_TYPE.ECDSA_P256;
}

function describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
