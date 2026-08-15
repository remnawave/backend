import { Transactional } from '@nestjs-cls/transactional';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Prisma } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import type { AbuseBlockerReportModel } from '@remnawave/node-contract';

import { GetAbuseBlockerReportsCommand } from '@libs/contracts/commands';

export type AbuseBlockerBackendAction = 'none' | 'initial_block' | 'repeat_block' | 'disabled';

export interface IProcessedAbuseReport {
    action: AbuseBlockerBackendAction;
    created: boolean;
    notify: boolean;
    strikeLevel: number;
}

export const decideAbuseEscalation = (
    state: {
        strikeLevel: number;
        lastBlockingIncidentAt: Date | null;
        manualReviewRequired: boolean;
    } | null,
    now: Date,
    repeatWindowSeconds: number,
): Pick<IProcessedAbuseReport, 'action' | 'notify' | 'strikeLevel'> => {
    if (state?.manualReviewRequired && state.strikeLevel >= 3) {
        return { action: 'none', notify: false, strikeLevel: 3 };
    }

    const isFreshChain =
        !!state?.lastBlockingIncidentAt &&
        now.getTime() - state.lastBlockingIncidentAt.getTime() <= repeatWindowSeconds * 1000;
    if (!isFreshChain) return { action: 'initial_block', notify: true, strikeLevel: 1 };
    if ((state?.strikeLevel ?? 0) === 1) {
        return { action: 'repeat_block', notify: true, strikeLevel: 2 };
    }
    if ((state?.strikeLevel ?? 0) === 2) {
        return { action: 'disabled', notify: true, strikeLevel: 3 };
    }
    return { action: 'none', notify: false, strikeLevel: 3 };
};

const asJson = (value: unknown): Prisma.InputJsonValue =>
    JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

@Injectable()
export class AbuseBlockerRepository {
    constructor(private readonly prisma: TransactionHost<TransactionalAdapterPrisma>) {}

    @Transactional()
    async processReport(
        userId: bigint,
        nodeId: bigint,
        report: AbuseBlockerReportModel,
    ): Promise<IProcessedAbuseReport> {
        if (report.severity === 'blocked') {
            await this.prisma.tx.$executeRaw`
                SELECT pg_advisory_xact_lock(${userId})
            `;
        }

        const existing = await this.prisma.tx.abuseBlockerReports.findUnique({
            where: { eventId: report.eventId },
        });
        if (existing) {
            await this.prisma.tx.abuseBlockerReports.update({
                where: { eventId: report.eventId },
                data: {
                    report: asJson(report),
                    severity: report.severity,
                    score: report.score.after,
                },
            });
            const state = await this.prisma.tx.abuseBlockerUserState.findUnique({
                where: { userId },
            });
            return {
                action: existing.action as AbuseBlockerBackendAction,
                created: false,
                notify: false,
                strikeLevel: state?.strikeLevel ?? 0,
            };
        }

        let action: AbuseBlockerBackendAction = 'none';
        let strikeLevel = 0;
        let notify = report.severity !== 'suspicious';

        if (report.severity === 'blocked') {
            const now = new Date();
            const state = await this.prisma.tx.abuseBlockerUserState.findUnique({
                where: { userId },
            });
            ({ action, notify, strikeLevel } = decideAbuseEscalation(
                state,
                now,
                report.policy.repeatWindowSeconds,
            ));

            await this.prisma.tx.abuseBlockerUserState.upsert({
                where: { userId },
                create: {
                    userId,
                    strikeLevel,
                    lastBlockingIncidentAt: now,
                    manualReviewRequired: strikeLevel === 3,
                    reviewRequestedAt: strikeLevel === 3 ? now : null,
                },
                update: {
                    strikeLevel,
                    lastBlockingIncidentAt: now,
                    manualReviewRequired: strikeLevel === 3,
                    reviewRequestedAt: strikeLevel === 3 ? now : null,
                },
            });
        }

        await this.prisma.tx.abuseBlockerReports.create({
            data: {
                eventId: report.eventId,
                userId,
                nodeId,
                severity: report.severity,
                score: report.score.after,
                sourceIp: report.sourceIp,
                action,
                detectedAt: report.detectedAt,
                report: asJson(report),
            },
        });

        return { action, created: true, notify, strikeLevel };
    }

    async markDisabledByPlugin(userId: bigint, disabled: boolean): Promise<void> {
        await this.prisma.tx.abuseBlockerUserState.update({
            where: { userId },
            data: { disabledByPlugin: disabled },
        });
    }

    async getReports(query: GetAbuseBlockerReportsCommand.RequestQuery) {
        const where: Prisma.AbuseBlockerReportsWhereInput = {
            userId: query.userId === undefined ? undefined : BigInt(query.userId),
            node: query.nodeUuid ? { uuid: query.nodeUuid } : undefined,
            severity: query.severity,
            action: query.action,
            detectedAt:
                query.dateFrom || query.dateTo
                    ? { gte: query.dateFrom, lte: query.dateTo }
                    : undefined,
            report: query.rule
                ? { path: ['detections'], array_contains: [{ rule: query.rule }] }
                : undefined,
        };

        const [records, total] = await Promise.all([
            this.prisma.tx.abuseBlockerReports.findMany({
                where,
                include: {
                    user: { select: { username: true, vlessUuid: true, status: true } },
                    node: { select: { uuid: true, name: true, countryCode: true } },
                },
                orderBy: { detectedAt: 'desc' },
                skip: query.start,
                take: query.size,
            }),
            this.prisma.tx.abuseBlockerReports.count({ where }),
        ]);

        return { records, total };
    }

    async getStats() {
        const [counts] = await this.prisma.tx.$queryRaw<
            Array<{
                total: bigint;
                last24h: bigint;
                users: bigint;
                nodes: bigint;
                suspicious: bigint;
                alert: bigint;
                blocked: bigint;
            }>
        >`
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE detected_at > now() - interval '24 hours') AS last24h,
                COUNT(DISTINCT user_id) AS users,
                COUNT(DISTINCT node_id) AS nodes,
                COUNT(*) FILTER (WHERE severity = 'suspicious') AS suspicious,
                COUNT(*) FILTER (WHERE severity = 'alert') AS alert,
                COUNT(*) FILTER (WHERE severity = 'blocked') AS blocked
            FROM abuse_blocker_reports
        `;
        const [manualReviewRequired, topUserGroups, topNodeGroups] = await Promise.all([
            this.prisma.tx.abuseBlockerUserState.count({
                where: { manualReviewRequired: true },
            }),
            this.prisma.tx.abuseBlockerReports.groupBy({
                by: ['userId'],
                _count: { _all: true },
                orderBy: { _count: { userId: 'desc' } },
                take: 50,
            }),
            this.prisma.tx.abuseBlockerReports.groupBy({
                by: ['nodeId'],
                _count: { _all: true },
                orderBy: { _count: { nodeId: 'desc' } },
                take: 50,
            }),
        ]);
        const [users, nodes] = await Promise.all([
            this.prisma.tx.users.findMany({
                where: { id: { in: topUserGroups.map((item) => item.userId) } },
                select: { id: true, username: true },
            }),
            this.prisma.tx.nodes.findMany({
                where: { id: { in: topNodeGroups.map((item) => item.nodeId) } },
                select: { id: true, uuid: true, name: true, countryCode: true },
            }),
        ]);
        const userMap = new Map(users.map((user) => [user.id, user]));
        const nodeMap = new Map(nodes.map((node) => [node.id, node]));

        return {
            totalReports: Number(counts?.total ?? 0),
            reportsLast24Hours: Number(counts?.last24h ?? 0),
            distinctUsers: Number(counts?.users ?? 0),
            distinctNodes: Number(counts?.nodes ?? 0),
            manualReviewRequired,
            bySeverity: {
                suspicious: Number(counts?.suspicious ?? 0),
                alert: Number(counts?.alert ?? 0),
                blocked: Number(counts?.blocked ?? 0),
            },
            topUsers: topUserGroups.flatMap((item) => {
                const user = userMap.get(item.userId);
                return user
                    ? [
                          {
                              userId: Number(user.id),
                              username: user.username,
                              total: item._count._all,
                          },
                      ]
                    : [];
            }),
            topNodes: topNodeGroups.flatMap((item) => {
                const node = nodeMap.get(item.nodeId);
                return node
                    ? [
                          {
                              uuid: node.uuid,
                              name: node.name,
                              countryCode: node.countryCode,
                              total: item._count._all,
                          },
                      ]
                    : [];
            }),
        };
    }

    async getReviewQueue(start: number, size: number) {
        const where = { manualReviewRequired: true } as const;
        const [records, total] = await Promise.all([
            this.prisma.tx.abuseBlockerUserState.findMany({
                where,
                include: {
                    user: { select: { username: true, vlessUuid: true, status: true } },
                },
                orderBy: { reviewRequestedAt: 'asc' },
                skip: start,
                take: size,
            }),
            this.prisma.tx.abuseBlockerUserState.count({ where }),
        ]);
        return { records, total };
    }

    @Transactional()
    async resolveReview(userUuid: string, action: 'enable' | 'keep_disabled') {
        const user = await this.prisma.tx.users.findFirst({ where: { vlessUuid: userUuid } });
        if (!user) return null;

        await this.prisma.tx.$executeRaw`
            SELECT pg_advisory_xact_lock(${user.id})
        `;
        const now = new Date();
        return this.prisma.tx.abuseBlockerUserState.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                strikeLevel: 0,
                manualReviewRequired: false,
                disabledByPlugin: false,
                reviewedAt: now,
                reviewAction: action,
            },
            update: {
                strikeLevel: 0,
                lastBlockingIncidentAt: null,
                manualReviewRequired: false,
                disabledByPlugin: false,
                reviewedAt: now,
                reviewAction: action,
            },
            include: {
                user: { select: { username: true, vlessUuid: true, status: true } },
            },
        });
    }

    async findReviewStateByUserUuid(userUuid: string) {
        return this.prisma.tx.abuseBlockerUserState.findFirst({
            where: { user: { vlessUuid: userUuid } },
            include: {
                user: { select: { username: true, vlessUuid: true, status: true } },
            },
        });
    }

    async findReviewState(userId: bigint) {
        return this.prisma.tx.abuseBlockerUserState.findUnique({
            where: { userId },
            include: {
                user: { select: { username: true, vlessUuid: true, status: true } },
            },
        });
    }

    async truncateReports(): Promise<void> {
        await this.prisma.tx.abuseBlockerReports.deleteMany();
    }
}
