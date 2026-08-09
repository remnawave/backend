export const ACME_PROVIDER = {
    CLOUDFLARE: 'CLOUDFLARE',
    /**
     * A generic HTTP DNS API (see docs/acme.md for the protocol). Lets the
     * DNS credential live outside the panel: the panel holds only the broker's
     * URL and a client token scoped by the broker's own policy.
     */
    CUSTOM: 'CUSTOM',
    DESEC: 'DESEC',
    DIGITALOCEAN: 'DIGITALOCEAN',
    GANDI: 'GANDI',
    HETZNER: 'HETZNER',
    /**
     * No automation: the panel shows the record and waits for it to be published.
     */
    MANUAL: 'MANUAL',
    PORKBUN: 'PORKBUN',
    POWERDNS: 'POWERDNS',
    VULTR: 'VULTR',
} as const;

export type TAcmeProvider = (typeof ACME_PROVIDER)[keyof typeof ACME_PROVIDER];

export const ACME_PROVIDERS = Object.values(ACME_PROVIDER) as [TAcmeProvider, ...TAcmeProvider[]];

export interface IAcmeProviderField {
    key: string;
    label: string;
    /** Write-only: stored encrypted, never returned by the API. */
    secret: boolean;
    required: boolean;
    placeholder?: string;
    description?: string;
}

export interface IAcmeProviderInfo {
    provider: TAcmeProvider;
    label: string;
    description?: string;
    fields: IAcmeProviderField[];
}

/**
 * Single source of truth for what each provider needs. The backend validates
 * credential payloads against it; the UI renders the credential form from it.
 */
export const ACME_PROVIDER_REGISTRY: IAcmeProviderInfo[] = [
    {
        provider: ACME_PROVIDER.CLOUDFLARE,
        label: 'Cloudflare',
        fields: [
            {
                key: 'apiToken',
                label: 'API token',
                secret: true,
                required: true,
                placeholder: 'Cloudflare API token',
                description: 'Needs Zone:Read and DNS:Edit',
            },
        ],
    },
    {
        provider: ACME_PROVIDER.DESEC,
        label: 'deSEC',
        fields: [
            {
                key: 'apiToken',
                label: 'API token',
                secret: true,
                required: true,
                placeholder: 'deSEC token',
            },
        ],
    },
    {
        provider: ACME_PROVIDER.DIGITALOCEAN,
        label: 'DigitalOcean',
        fields: [
            {
                key: 'apiToken',
                label: 'API token',
                secret: true,
                required: true,
                placeholder: 'DigitalOcean personal access token',
                description: 'Needs domain read and write',
            },
        ],
    },
    {
        provider: ACME_PROVIDER.GANDI,
        label: 'Gandi LiveDNS',
        fields: [
            {
                key: 'apiToken',
                label: 'Personal access token',
                secret: true,
                required: true,
                placeholder: 'Gandi PAT',
                description: 'Needs "Manage domain name technical configurations"',
            },
        ],
    },
    {
        provider: ACME_PROVIDER.HETZNER,
        label: 'Hetzner DNS',
        fields: [
            {
                key: 'apiToken',
                label: 'API token',
                secret: true,
                required: true,
                placeholder: 'dns.hetzner.com API token',
            },
        ],
    },
    {
        provider: ACME_PROVIDER.PORKBUN,
        label: 'Porkbun',
        fields: [
            {
                key: 'apiKey',
                label: 'API key',
                secret: true,
                required: true,
                placeholder: 'pk1_…',
            },
            {
                key: 'secretApiKey',
                label: 'Secret API key',
                secret: true,
                required: true,
                placeholder: 'sk1_…',
            },
        ],
    },
    {
        provider: ACME_PROVIDER.POWERDNS,
        label: 'PowerDNS',
        fields: [
            {
                key: 'baseUrl',
                label: 'API URL',
                secret: false,
                required: true,
                placeholder: 'http://powerdns:8081',
            },
            {
                key: 'apiKey',
                label: 'API key',
                secret: true,
                required: true,
            },
            {
                key: 'serverId',
                label: 'Server ID',
                secret: false,
                required: false,
                placeholder: 'localhost',
                description: 'Leave empty for the default server',
            },
        ],
    },
    {
        provider: ACME_PROVIDER.VULTR,
        label: 'Vultr',
        fields: [
            {
                key: 'apiToken',
                label: 'API key',
                secret: true,
                required: true,
                placeholder: 'Vultr API key',
            },
        ],
    },
    {
        provider: ACME_PROVIDER.CUSTOM,
        label: 'Custom (HTTP API)',
        description:
            'A DNS broker speaking the simple HTTP protocol from the documentation. Keeps the real DNS credential outside the panel.',
        fields: [
            {
                key: 'baseUrl',
                label: 'URL',
                secret: false,
                required: true,
                placeholder: 'http://dns-broker:8080',
            },
            {
                key: 'token',
                label: 'Token',
                secret: true,
                required: true,
                placeholder: 'Client token',
            },
        ],
    },
    {
        provider: ACME_PROVIDER.MANUAL,
        label: 'Manual',
        description:
            'Nothing is published automatically. Pairs with dns-persist-01, where one record is added by hand; it cannot answer dns-01.',
        fields: [],
    },
];

export const ACME_CERTIFICATE_SOURCE = {
    /** Ordered and renewed by the panel. */
    ACME: 'ACME',
    /**
     * Uploaded material. The panel stores and delivers it, but never renews it:
     * whoever issued it also renews it, and the new PEM is imported again.
     */
    IMPORTED: 'IMPORTED',
} as const;

export type TAcmeCertificateSource =
    (typeof ACME_CERTIFICATE_SOURCE)[keyof typeof ACME_CERTIFICATE_SOURCE];

export const ACME_CERTIFICATE_SOURCES = Object.values(ACME_CERTIFICATE_SOURCE) as [
    TAcmeCertificateSource,
    ...TAcmeCertificateSource[],
];

export const ACME_CHALLENGE_TYPE = {
    /**
     * A fresh TXT record per issuance.
     */
    DNS_01: 'DNS_01',
    /**
     * A persistent authorization record bound to the ACME account
     * (draft-ietf-acme-dns-persist). Once published, renewals touch no DNS at all.
     */
    DNS_PERSIST_01: 'DNS_PERSIST_01',
} as const;

export type TAcmeChallengeType = (typeof ACME_CHALLENGE_TYPE)[keyof typeof ACME_CHALLENGE_TYPE];

export const ACME_CHALLENGE_TYPES = Object.values(ACME_CHALLENGE_TYPE) as [
    TAcmeChallengeType,
    ...TAcmeChallengeType[],
];

/** Record name prefixes defined by the ACME challenge specifications. */
export const ACME_RECORD_PREFIX = {
    DNS_01: '_acme-challenge',
    DNS_PERSIST_01: '_validation-persist',
} as const;

export const ACME_KEY_TYPE = {
    ECDSA_P256: 'ECDSA_P256',
    ECDSA_P384: 'ECDSA_P384',
    RSA_2048: 'RSA_2048',
    RSA_4096: 'RSA_4096',
} as const;

export type TAcmeKeyType = (typeof ACME_KEY_TYPE)[keyof typeof ACME_KEY_TYPE];

export const ACME_KEY_TYPES = Object.values(ACME_KEY_TYPE) as [TAcmeKeyType, ...TAcmeKeyType[]];

export const ACME_CERTIFICATE_STATUS = {
    /** Created, never issued yet. */
    PENDING: 'PENDING',
    /** Waiting for a record to be published by hand (MANUAL credentials). */
    AWAITING_DNS: 'AWAITING_DNS',
    /** An order is in flight. */
    ISSUING: 'ISSUING',
    /** A valid certificate is stored. */
    ACTIVE: 'ACTIVE',
    /** The last attempt failed; see lastError and nextRetryAt. */
    ERROR: 'ERROR',
} as const;

export type TAcmeCertificateStatus =
    (typeof ACME_CERTIFICATE_STATUS)[keyof typeof ACME_CERTIFICATE_STATUS];

export const ACME_CERTIFICATE_STATUSES = Object.values(ACME_CERTIFICATE_STATUS) as [
    TAcmeCertificateStatus,
    ...TAcmeCertificateStatus[],
];

/**
 * Known ACME directories, staging endpoints included.
 *
 * Staging is not a curiosity here: it is the only place to rehearse a new
 * certificate without spending the production rate limit, and — as of 2026-08 —
 * the only place where dns-persist-01 works at all.
 */
export const ACME_DIRECTORY = {
    LETSENCRYPT: 'https://acme-v02.api.letsencrypt.org/directory',
    LETSENCRYPT_STAGING: 'https://acme-staging-v02.api.letsencrypt.org/directory',
    BUYPASS: 'https://api.buypass.com/acme/directory',
    BUYPASS_STAGING: 'https://api.test4.buypass.no/acme/directory',
    GOOGLE: 'https://dv.acme-v02.api.pki.goog/directory',
    GOOGLE_STAGING: 'https://dv.acme-v02.test-api.pki.goog/directory',
    ZEROSSL: 'https://acme.zerossl.com/v2/DV90',
} as const;

export type TAcmeDirectory = (typeof ACME_DIRECTORY)[keyof typeof ACME_DIRECTORY];

export interface IAcmeDirectoryPreset {
    name: string;
    url: string;
    isStaging: boolean;
    /** External Account Binding is mandatory for this CA. */
    requiresEab: boolean;
}

export const ACME_DIRECTORY_PRESETS: IAcmeDirectoryPreset[] = [
    {
        name: "Let's Encrypt",
        url: ACME_DIRECTORY.LETSENCRYPT,
        isStaging: false,
        requiresEab: false,
    },
    {
        name: "Let's Encrypt (staging)",
        url: ACME_DIRECTORY.LETSENCRYPT_STAGING,
        isStaging: true,
        requiresEab: false,
    },
    {
        name: 'Buypass Go',
        url: ACME_DIRECTORY.BUYPASS,
        isStaging: false,
        requiresEab: false,
    },
    {
        name: 'Buypass Go (staging)',
        url: ACME_DIRECTORY.BUYPASS_STAGING,
        isStaging: true,
        requiresEab: false,
    },
    {
        name: 'Google Trust Services',
        url: ACME_DIRECTORY.GOOGLE,
        isStaging: false,
        requiresEab: true,
    },
    {
        name: 'Google Trust Services (staging)',
        url: ACME_DIRECTORY.GOOGLE_STAGING,
        isStaging: true,
        requiresEab: true,
    },
    {
        name: 'ZeroSSL',
        url: ACME_DIRECTORY.ZEROSSL,
        isStaging: false,
        requiresEab: true,
    },
];

export const ACME_EVENT_LEVEL = {
    INFO: 'INFO',
    ERROR: 'ERROR',
} as const;

export type TAcmeEventLevel = (typeof ACME_EVENT_LEVEL)[keyof typeof ACME_EVENT_LEVEL];

export const ACME_EVENT_LEVELS = Object.values(ACME_EVENT_LEVEL) as [
    TAcmeEventLevel,
    ...TAcmeEventLevel[],
];
