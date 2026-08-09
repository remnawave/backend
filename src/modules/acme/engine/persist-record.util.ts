import { ACME_DIRECTORY, ACME_RECORD_PREFIX } from '@libs/contracts/constants';

/**
 * Issuer domain names as they appear in a persistent authorization record.
 *
 * The authoritative value comes from the challenge object at issuance time; this
 * map is what lets the panel show the record before the first order, and staging
 * shares the production issuer domain.
 */
const ISSUER_DOMAINS: Record<string, string> = {
    [ACME_DIRECTORY.LETSENCRYPT]: 'letsencrypt.org',
    [ACME_DIRECTORY.LETSENCRYPT_STAGING]: 'letsencrypt.org',
    [ACME_DIRECTORY.BUYPASS]: 'buypass.com',
    [ACME_DIRECTORY.BUYPASS_STAGING]: 'buypass.com',
    [ACME_DIRECTORY.GOOGLE]: 'pki.goog',
    [ACME_DIRECTORY.GOOGLE_STAGING]: 'pki.goog',
    [ACME_DIRECTORY.ZEROSSL]: 'zerossl.com',
};

export function resolveIssuerDomain(directoryUrl: string): string {
    const known = ISSUER_DOMAINS[directoryUrl];

    if (known) {
        return known;
    }

    try {
        const host = new URL(directoryUrl).hostname;

        return host.split('.').slice(-2).join('.');
    } catch {
        return directoryUrl;
    }
}

/**
 * The name every domain of the certificate can be authorized from: their longest
 * common suffix.
 *
 * With policy=wildcard a persistent record covers the name itself, its wildcards
 * and its subdomains, so one record at the common suffix serves the whole
 * certificate.
 */
export function resolvePersistBaseDomain(domains: string[]): string {
    const labelSets = domains.map((domain) => stripWildcard(domain).split('.').reverse());

    let common: string[] = labelSets[0] ?? [];

    for (const labels of labelSets.slice(1)) {
        const shared: string[] = [];

        for (let i = 0; i < Math.min(common.length, labels.length); i++) {
            if (common[i] !== labels[i]) {
                break;
            }

            shared.push(common[i]);
        }

        common = shared;
    }

    if (common.length < 2) {
        throw new Error(
            'Domains of a dns-persist-01 certificate must share a registrable suffix; ' +
                'split them into separate certificates.',
        );
    }

    return common.reverse().join('.');
}

/**
 * The record name.
 *
 * A wildcard certificate is authorized on its base name: "*.edge.example.com" is
 * covered by a record at "_validation-persist.edge.example.com" carrying
 * policy=wildcard. Writing the asterisk into the record name produces a name the
 * CA never asks for — a mistake that costs an afternoon to spot, because the
 * provider happily creates such a record.
 */
export function buildPersistRecordName(domains: string[]): string {
    return `${ACME_RECORD_PREFIX.DNS_PERSIST_01}.${resolvePersistBaseDomain(domains)}`;
}

/**
 * The record value: the CA's issuer domain, the account allowed to issue, and
 * policy=wildcard whenever the certificate covers anything other than the base
 * name itself.
 */
export function buildPersistRecordValue(
    issuerDomain: string,
    accountUrl: string,
    domains: string[],
): string {
    const parts = [issuerDomain, `accounturi=${accountUrl}`];

    if (needsWildcardPolicy(domains)) {
        parts.push('policy=wildcard');
    }

    return parts.join('; ');
}

export function needsWildcardPolicy(domains: string[]): boolean {
    const base = resolvePersistBaseDomain(domains);

    return domains.some((domain) => domain.startsWith('*.') || stripWildcard(domain) !== base);
}

function stripWildcard(domain: string): string {
    return domain.replace(/^\*\./, '');
}
