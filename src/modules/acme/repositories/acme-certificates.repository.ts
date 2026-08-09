import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

import { Injectable } from '@nestjs/common';

import { AcmeCertificateEntity } from '../entities';

/** What the issuance engine writes back after an attempt. */
export interface IAcmeCertificateResult {
    expiresAt?: Date | null;
    failCount?: number;
    fingerprint?: null | string;
    fullchainPem?: null | string;
    issuedAt?: Date | null;
    keyEncrypted?: null | string;
    lastError?: null | string;
    nextRetryAt?: Date | null;
    status?: string;
}

const WITH_RELATIONS = {
    credential: { select: { name: true } },
    nodes: { include: { node: { select: { name: true } } } },
} as const;

@Injectable()
export class AcmeCertificatesRepository {
    constructor(private readonly prisma: TransactionHost<TransactionalAdapterPrisma>) {}

    public async create(
        data: {
            accountUuid?: null | string;
            challengeType: string;
            credentialUuid: string;
            directoryUrl: string;
            domains: string[];
            eabKid?: null | string;
            email: string;
            isEnabled: boolean;
            keyType: string;
            name: string;
            renewBeforeDays: number;
        },
        nodes: { inboundTags: string[]; nodeUuid: string }[],
    ): Promise<AcmeCertificateEntity> {
        const result = await this.prisma.tx.acmeCertificates.create({
            data: {
                ...data,
                nodes: {
                    create: nodes.map((binding) => ({
                        nodeUuid: binding.nodeUuid,
                        inboundTags: binding.inboundTags,
                    })),
                },
            },
            include: WITH_RELATIONS,
        });

        return new AcmeCertificateEntity(result);
    }

    /**
     * Stores material the panel did not issue. Domains, validity and key type
     * come from the certificate itself, so there is nothing for the caller to
     * get wrong, and the certificate is active from the moment it is stored.
     */
    public async createImported(
        data: {
            domains: string[];
            expiresAt: Date;
            fingerprint: string;
            fullchainPem: string;
            isEnabled: boolean;
            issuedAt: Date;
            keyEncrypted: string;
            keyType: string;
            name: string;
        },
        nodes: { inboundTags: string[]; nodeUuid: string }[],
    ): Promise<AcmeCertificateEntity> {
        const result = await this.prisma.tx.acmeCertificates.create({
            data: {
                ...data,
                source: 'IMPORTED',
                status: 'ACTIVE',
                nodes: {
                    create: nodes.map((binding) => ({
                        nodeUuid: binding.nodeUuid,
                        inboundTags: binding.inboundTags,
                    })),
                },
            },
            include: WITH_RELATIONS,
        });

        return new AcmeCertificateEntity(result);
    }

    /** Replaces the material of an imported certificate; this is how it is renewed. */
    public async replaceMaterial(
        uuid: string,
        data: {
            domains: string[];
            expiresAt: Date;
            fingerprint: string;
            fullchainPem: string;
            issuedAt: Date;
            keyEncrypted: string;
            keyType: string;
        },
    ): Promise<AcmeCertificateEntity> {
        const result = await this.prisma.tx.acmeCertificates.update({
            where: { uuid },
            data: {
                ...data,
                status: 'ACTIVE',
                lastError: null,
                failCount: 0,
                nextRetryAt: null,
            },
            include: WITH_RELATIONS,
        });

        return new AcmeCertificateEntity(result);
    }

    /**
     * Updates the certificate and, when bindings are given, replaces them
     * wholesale. Both happen in the caller's transaction, so a half-applied
     * binding set is not observable.
     */
    public async update(
        uuid: string,
        data: {
            challengeType?: string;
            credentialUuid?: string;
            directoryUrl?: string;
            domains?: string[];
            eabKid?: null | string;
            email?: string;
            isEnabled?: boolean;
            keyType?: string;
            name?: string;
            renewBeforeDays?: number;
        },
        nodes?: { inboundTags: string[]; nodeUuid: string }[],
    ): Promise<AcmeCertificateEntity> {
        if (nodes) {
            await this.prisma.tx.acmeCertificateNodes.deleteMany({
                where: { certificateUuid: uuid },
            });
        }

        const result = await this.prisma.tx.acmeCertificates.update({
            where: { uuid },
            data: {
                ...data,
                ...(nodes
                    ? {
                          nodes: {
                              create: nodes.map((binding) => ({
                                  nodeUuid: binding.nodeUuid,
                                  inboundTags: binding.inboundTags,
                              })),
                          },
                      }
                    : {}),
            },
            include: WITH_RELATIONS,
        });

        return new AcmeCertificateEntity(result);
    }

    public async updateResult(
        uuid: string,
        data: IAcmeCertificateResult,
    ): Promise<AcmeCertificateEntity> {
        const result = await this.prisma.tx.acmeCertificates.update({
            where: { uuid },
            data,
            include: WITH_RELATIONS,
        });

        return new AcmeCertificateEntity(result);
    }

    public async findByUUID(uuid: string): Promise<AcmeCertificateEntity | null> {
        const result = await this.prisma.tx.acmeCertificates.findUnique({
            where: { uuid },
            include: WITH_RELATIONS,
        });

        if (!result) {
            return null;
        }

        return new AcmeCertificateEntity(result);
    }

    public async findByName(name: string): Promise<AcmeCertificateEntity | null> {
        const result = await this.prisma.tx.acmeCertificates.findUnique({ where: { name } });

        if (!result) {
            return null;
        }

        return new AcmeCertificateEntity(result);
    }

    public async findAll(): Promise<AcmeCertificateEntity[]> {
        const result = await this.prisma.tx.acmeCertificates.findMany({
            include: WITH_RELATIONS,
            orderBy: { createdAt: 'asc' },
        });

        return result.map((certificate) => new AcmeCertificateEntity(certificate));
    }

    /**
     * Certificates the scheduler should act on: issued by the panel, enabled, not
     * waiting for a manual DNS record, past their renewal window (or never
     * issued), and not held back by the retry backoff.
     *
     * Imported certificates are excluded by construction: the panel has no way to
     * renew what it did not issue.
     */
    public async findDueForRenewal(now: Date): Promise<AcmeCertificateEntity[]> {
        const result = await this.prisma.tx.$queryRaw<{ uuid: string }[]>`
            SELECT uuid
            FROM acme_certificates
            WHERE is_enabled = true
              AND source = 'ACME'
              AND status <> 'AWAITING_DNS'
              AND status <> 'ISSUING'
              AND (next_retry_at IS NULL OR next_retry_at <= ${now})
              AND (
                  expires_at IS NULL
                  OR expires_at - make_interval(days => renew_before_days) <= ${now}
              )
        `;

        if (result.length === 0) {
            return [];
        }

        const certificates = await this.prisma.tx.acmeCertificates.findMany({
            where: { uuid: { in: result.map((row) => row.uuid) } },
            include: WITH_RELATIONS,
        });

        return certificates.map((certificate) => new AcmeCertificateEntity(certificate));
    }

    /**
     * Active certificates bound to a node, with the material needed to inject
     * them into that node's config.
     */
    public async findActiveByNodeUuid(nodeUuid: string): Promise<AcmeCertificateEntity[]> {
        const result = await this.prisma.tx.acmeCertificates.findMany({
            where: {
                isEnabled: true,
                status: 'ACTIVE',
                fullchainPem: { not: null },
                keyEncrypted: { not: null },
                nodes: { some: { nodeUuid } },
            },
            include: {
                credential: { select: { name: true } },
                nodes: { where: { nodeUuid }, include: { node: { select: { name: true } } } },
            },
        });

        return result.map((certificate) => new AcmeCertificateEntity(certificate));
    }

    public async deleteByUUID(uuid: string): Promise<boolean> {
        const result = await this.prisma.tx.acmeCertificates.delete({ where: { uuid } });

        return !!result;
    }
}
