import { z } from 'zod';

import {
    ACME_CERTIFICATE_SOURCES,
    ACME_CERTIFICATE_STATUSES,
    ACME_CHALLENGE_TYPES,
    ACME_EVENT_LEVELS,
    ACME_KEY_TYPES,
    ACME_PROVIDERS,
} from '../constants/acme';

/**
 * A domain a certificate may cover: a hostname, or a wildcard covering one level.
 */
export const AcmeDomainSchema = z
    .string()
    .min(3)
    .max(253)
    .regex(
        /^(\*\.)?([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/,
        'Must be a domain name, optionally prefixed with "*."',
    );

/**
 * Credentials never travel outwards. The response says whether a secret is
 * stored plus the non-secret fields — enough for the UI, and
 * nothing an attacker could reuse.
 */
export const AcmeCredentialSchema = z.object({
    uuid: z.uuid(),
    name: z.string(),
    provider: z.enum(ACME_PROVIDERS),
    hasSecret: z.boolean(),
    /** Non-secret provider fields (registry keys marked secret never appear). */
    config: z.record(z.string(), z.string()),
    certificatesCount: z.number().int(),
    createdAt: z.iso.datetime().transform((str) => new Date(str)),
    updatedAt: z.iso.datetime().transform((str) => new Date(str)),
});

/**
 * A certificate delivered to one node. An empty inboundTags means every TLS
 * inbound the node runs.
 */
export const AcmeCertificateNodeSchema = z.object({
    nodeUuid: z.uuid(),
    nodeName: z.nullable(z.string()),
    inboundTags: z.array(z.string()),
});

export const AcmeCertificateSchema = z.object({
    uuid: z.uuid(),
    name: z.string(),
    domains: z.array(AcmeDomainSchema),

    source: z.enum(ACME_CERTIFICATE_SOURCES),

    challengeType: z.enum(ACME_CHALLENGE_TYPES),
    keyType: z.enum(ACME_KEY_TYPES),
    renewBeforeDays: z.number().int(),
    isEnabled: z.boolean(),

    /** Null for imported certificates: there is no CA and no account behind them. */
    directoryUrl: z.nullable(z.string()),
    email: z.nullable(z.string()),
    eabKid: z.nullable(z.string()),

    status: z.enum(ACME_CERTIFICATE_STATUSES),
    lastError: z.nullable(z.string()),
    issuedAt: z.nullable(z.iso.datetime().transform((str) => new Date(str))),
    expiresAt: z.nullable(z.iso.datetime().transform((str) => new Date(str))),
    fingerprint: z.nullable(z.string()),
    failCount: z.number().int(),
    nextRetryAt: z.nullable(z.iso.datetime().transform((str) => new Date(str))),

    credentialUuid: z.nullable(z.uuid()),
    credentialName: z.nullable(z.string()),

    nodes: z.array(AcmeCertificateNodeSchema),

    createdAt: z.iso.datetime().transform((str) => new Date(str)),
    updatedAt: z.iso.datetime().transform((str) => new Date(str)),
});

export const AcmeEventSchema = z.object({
    id: z.number().int(),
    certificateUuid: z.nullable(z.uuid()),
    level: z.enum(ACME_EVENT_LEVELS),
    message: z.string(),
    createdAt: z.iso.datetime().transform((str) => new Date(str)),
});

/**
 * The persistent authorization record for dns-persist-01: what to publish, and
 * whether it is already visible in DNS.
 */
export const AcmePersistRecordSchema = z.object({
    name: z.string(),
    value: z.string(),
    isPublished: z.boolean(),
    canPublish: z.boolean(),
});

/** What a credential test reports about itself. */
export const AcmeCredentialTestSchema = z.object({
    isOk: z.boolean(),
    message: z.string(),
    allow: z.array(z.string()),
    zones: z.array(z.string()),
});
