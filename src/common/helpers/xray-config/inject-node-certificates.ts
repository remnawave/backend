import { createHash, X509Certificate } from 'node:crypto';
import { TLSCertConfig, XrayConfig } from 'xray-typed';

import { INodeCertificate } from '@modules/acme/queries/get-certificates-for-node';

/**
 * Puts panel-managed certificates into the config a specific node is about to
 * receive.
 *
 * They are injected here rather than stored in the config profile because a
 * profile is shared: writing a certificate into it would hand its private key to
 * every node using that profile, including nodes that never serve the name.
 *
 * Existing entries are matched by common name and replaced; anything else on the
 * inbound is left alone, since an inbound legitimately carries several
 * certificates and Xray picks between them by SNI.
 */
export function injectNodeCertificates(
    config: XrayConfig,
    certificates: INodeCertificate[],
): void {
    if (!config.inbounds || certificates.length === 0) {
        return;
    }

    for (const inbound of config.inbounds) {
        if (inbound.streamSettings?.security !== 'tls') {
            continue;
        }

        const applicable = certificates.filter(
            (certificate) =>
                certificate.inboundTags.length === 0 ||
                (inbound.tag !== undefined && certificate.inboundTags.includes(inbound.tag)),
        );

        if (applicable.length === 0) {
            continue;
        }

        const tlsSettings = (inbound.streamSettings.tlsSettings ??= {});
        const existing: TLSCertConfig[] = (tlsSettings.certificates ??= []);

        for (const certificate of applicable) {
            const entry: TLSCertConfig = {
                certificate: certificate.certificate,
                key: certificate.key,
            };

            const index = existing.findIndex((candidate) => isSameCertificate(candidate, certificate));

            if (index === -1) {
                existing.push(entry);
                continue;
            }

            // Keep whatever else the entry carried (usage, ocspStapling), but drop
            // the file paths: an inline certificate wins over a file that would
            // otherwise be re-read on the node.
            const { certificateFile, keyFile, ...rest } = existing[index];

            existing[index] = { ...rest, ...entry };
        }
    }
}

/**
 * A digest of the certificates a node is being sent.
 *
 * It is mixed into the config hash the node compares against its previous one.
 * Without it a renewal changes nothing the node can see — the profile is
 * identical — and the new certificate would sit in the panel until something
 * else happened to change the config.
 */
export function getCertificatesFingerprint(certificates: INodeCertificate[]): string {
    if (certificates.length === 0) {
        return '';
    }

    const material = certificates
        .map((certificate) => `${certificate.domains.join(',')}:${certificate.fingerprint}`)
        .sort()
        .join('|');

    return createHash('sha256').update(material).digest('hex').slice(0, 16);
}

/**
 * Whether an entry already on the inbound is the same certificate, and should be
 * replaced rather than joined by a second copy.
 *
 * Names, not the common name alone: certificates that carry only SAN have no
 * common name to compare, and matching on it alone would leave the old entry in
 * place next to the new one, with Xray free to serve either.
 *
 * Parsing is deliberately lenient — a hand-written entry that is not valid PEM
 * must not break the whole config.
 */
function isSameCertificate(entry: TLSCertConfig, candidate: INodeCertificate): boolean {
    const pem = Array.isArray(entry.certificate) ? entry.certificate.join('\n') : entry.certificate;

    if (!pem) {
        return false;
    }

    let parsed: X509Certificate;

    try {
        parsed = new X509Certificate(pem);
    } catch {
        return false;
    }

    const names = readNames(parsed);
    const wanted = new Set(candidate.domains.map((domain) => domain.toLowerCase()));

    if (candidate.commonName) {
        wanted.add(candidate.commonName.toLowerCase());
    }

    return names.some((name) => wanted.has(name));
}

/**
 * Common name plus every DNS SAN, lowercased.
 *
 * Both fields are optional at runtime: a certificate with an empty subject —
 * which is what a SAN-only certificate has — reports `subject` as undefined.
 */
function readNames(certificate: X509Certificate): string[] {
    const names = (certificate.subjectAltName ?? '')
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.startsWith('DNS:'))
        .map((entry) => entry.slice('DNS:'.length).toLowerCase());

    const commonName = (certificate.subject ?? '')
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.startsWith('CN='))
        ?.slice(3)
        .toLowerCase();

    if (commonName) {
        names.push(commonName);
    }

    return names;
}
