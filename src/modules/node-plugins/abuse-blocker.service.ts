import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';

import type { AbuseBlockerReportModel } from '@remnawave/node-contract';

import { INodeConnectionOpts } from '@common/axios';
import { AxiosService } from '@common/axios/axios.service';
import { fail, ok, TResult } from '@common/types';
import {
    GetAbuseBlockerReportsCommand,
    GetAbuseBlockerReviewQueueCommand,
    GetAbuseBlockerStatsCommand,
    ReviewAbuseBlockerUserCommand,
} from '@libs/contracts/commands';
import { ERRORS, EVENTS } from '@libs/contracts/constants';

import { AbuseBlockerEvent } from '@integration-modules/notifications/interfaces';

import { GetNodeByUuidQuery } from '@modules/nodes/queries/get-node-by-uuid';
import { GetUserByUniqueFieldQuery } from '@modules/users/queries/get-user-by-unique-field';
import { UsersService } from '@modules/users/users.service';

import { AbuseBlockerRepository } from './repositories/abuse-blocker.repository';

@Injectable()
export class AbuseBlockerService {
    private readonly logger = new Logger(AbuseBlockerService.name);

    constructor(
        private readonly repository: AbuseBlockerRepository,
        private readonly axios: AxiosService,
        private readonly usersService: UsersService,
        private readonly queryBus: QueryBus,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    async processReport(
        nodeUuid: string,
        connectionOpts: INodeConnectionOpts,
        report: AbuseBlockerReportModel,
    ): Promise<void> {
        try {
            const userId = BigInt(report.userId);
            const [userResult, nodeResult] = await Promise.all([
                this.queryBus.execute(
                    new GetUserByUniqueFieldQuery({ id: userId }, { activeInternalSquads: true }),
                ),
                this.queryBus.execute(new GetNodeByUuidQuery(nodeUuid)),
            ]);
            if (!userResult.isOk || !nodeResult.isOk) {
                this.logger.warn(
                    `Ignoring abuse report ${report.eventId}: user or node was not found.`,
                );
                return;
            }

            const user = userResult.response;
            const node = nodeResult.response;
            let eventUser = user;
            const processed = await this.repository.processReport(user.id, node.id, report);
            if (!processed.created) return;

            if (processed.action === 'repeat_block') {
                const refreshed = await this.axios.refreshAbuseBlock(
                    { ip: report.sourceIp, timeout: report.policy.repeatBlockSeconds },
                    connectionOpts,
                );
                if (!refreshed.isOk || !refreshed.response.accepted) {
                    this.logger.error(
                        `Failed to refresh abuse block for ${report.sourceIp} on ${nodeUuid}.`,
                    );
                }
            } else if (processed.action === 'disabled') {
                const disabled = await this.usersService.disableUser(Number(user.id));
                if (disabled.isOk) {
                    eventUser = disabled.response;
                    await this.repository.markDisabledByPlugin(user.id, true);
                } else {
                    this.logger.warn(
                        `Failed to disable abuse offender ${user.id}: ${disabled.message}`,
                    );
                }
            }

            if (processed.notify) {
                this.eventEmitter.emit(
                    EVENTS.ABUSE_BLOCKER.REPORT,
                    new AbuseBlockerEvent(
                        {
                            node,
                            user: eventUser,
                            report,
                            backendAction: processed.action,
                            strikeLevel: processed.strikeLevel,
                        },
                        EVENTS.ABUSE_BLOCKER.REPORT,
                    ),
                );
            }
        } catch (error) {
            this.logger.error(`Failed to process abuse report ${report.eventId}: ${error}`);
        }
    }

    async getReports(
        query: GetAbuseBlockerReportsCommand.RequestQuery,
    ): Promise<TResult<GetAbuseBlockerReportsCommand.Response['response']>> {
        try {
            const result = await this.repository.getReports(query);
            return ok({
                total: result.total,
                records: result.records.map((record) => ({
                    ...record,
                    userId: Number(record.userId),
                    nodeId: Number(record.nodeId),
                    severity: record.severity as 'suspicious' | 'alert' | 'blocked',
                    action: record.action as 'none' | 'initial_block' | 'repeat_block' | 'disabled',
                })),
            });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    async getStats(): Promise<TResult<GetAbuseBlockerStatsCommand.Response['response']>> {
        try {
            return ok(await this.repository.getStats());
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    async getReviewQueue(
        query: GetAbuseBlockerReviewQueueCommand.RequestQuery,
    ): Promise<TResult<GetAbuseBlockerReviewQueueCommand.Response['response']>> {
        try {
            const result = await this.repository.getReviewQueue(query.start, query.size);
            return ok({
                total: result.total,
                records: result.records.map((record) => ({
                    ...record,
                    userId: Number(record.userId),
                    reviewAction: record.reviewAction as 'enable' | 'keep_disabled' | null,
                })),
            });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    async review(
        userUuid: string,
        action: ReviewAbuseBlockerUserCommand.RequestBody['action'],
    ): Promise<TResult<ReviewAbuseBlockerUserCommand.Response['response']>> {
        try {
            const current = await this.repository.findReviewStateByUserUuid(userUuid);
            if (!current) return fail(ERRORS.USER_NOT_FOUND);

            if (action === 'enable' && current.user.status !== 'ACTIVE') {
                const enabled = await this.usersService.enableUser(Number(current.userId));
                if (!enabled.isOk) return fail(ERRORS.INTERNAL_SERVER_ERROR);
            } else if (action === 'keep_disabled' && current.user.status !== 'DISABLED') {
                const disabled = await this.usersService.disableUser(Number(current.userId));
                if (!disabled.isOk) return fail(ERRORS.INTERNAL_SERVER_ERROR);
            }

            const state = await this.repository.resolveReview(userUuid, action);
            if (!state) return fail(ERRORS.USER_NOT_FOUND);
            const updated = await this.repository.findReviewState(state.userId);
            if (!updated) return fail(ERRORS.USER_NOT_FOUND);
            return ok({
                ...updated,
                userId: Number(updated.userId),
                reviewAction: updated.reviewAction as 'enable' | 'keep_disabled' | null,
            });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    async truncateReports(): Promise<TResult<boolean>> {
        try {
            await this.repository.truncateReports();
            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
