import { Job } from 'bullmq';
import pMap from 'p-map';

import { CommandBus, EventBus, QueryBus } from '@nestjs/cqrs';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger, Scope } from '@nestjs/common';

import { formatExecutionTime, getTime } from '@common/utils/get-elapsed-time';
import { ICommandResponse } from '@common/types/command-response.type';
import { RESET_PERIODS, TResetPeriods } from '@libs/contracts/constants';
import { EVENTS } from '@libs/contracts/constants/events/events';

import { UserEvent } from '@integration-modules/notifications/interfaces';

import { BatchResetLimitedUsersTrafficCommand } from '@modules/users/commands/batch-reset-limited-users-traffic';
import { BatchResetUserTrafficCommand } from '@modules/users/commands/batch-reset-user-traffic';
import { GetUserByUniqueFieldQuery } from '@modules/users/queries/get-user-by-unique-field';
import { AddUserToNodeEvent } from '@modules/nodes/events/add-user-to-node';

import { StartAllNodesQueueService } from '@queue/start-all-nodes';

import { ResetUserTrafficJobNames } from './enums';
import { QueueNames } from '../queue.enum';

@Processor(
    {
        name: QueueNames.resetUserTraffic,
        scope: Scope.REQUEST,
    },
    {
        concurrency: 3,
    },
)
export class ResetUserTrafficQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(ResetUserTrafficQueueProcessor.name);

    constructor(
        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
        private readonly eventBus: EventBus,
        private readonly eventEmitter: EventEmitter2,
        private readonly startAllNodesQueueService: StartAllNodesQueueService,
    ) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case ResetUserTrafficJobNames.resetDailyUserTraffic:
                return this.handleResetUserTraffic(job, RESET_PERIODS.DAY);
            case ResetUserTrafficJobNames.resetMonthlyUserTraffic:
                return this.handleResetUserTraffic(job, RESET_PERIODS.MONTH);
            case ResetUserTrafficJobNames.resetWeeklyUserTraffic:
                return this.handleResetUserTraffic(job, RESET_PERIODS.WEEK);
            case ResetUserTrafficJobNames.resetNoResetUserTraffic:
                return this.handleResetUserTraffic(job, RESET_PERIODS.NO_RESET);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleResetUserTraffic(job: Job, strategy: TResetPeriods) {
        let users: { uuid: string }[] | null = null;

        try {
            const ct = getTime();

            const batchResetResponse = await this.batchResetUserTraffic({
                strategy,
            });

            if (!batchResetResponse.isOk) {
                this.logger.debug('No users found for Batch Reset Daily Users Traffic.');
            } else {
                this.logger.debug(
                    `Batch Reset ${strategy} Users Traffic. Time: ${formatExecutionTime(ct)}`,
                );
            }

            const updatedUsersUuids = await this.batchResetLimitedUsersTraffic({
                strategy,
            });

            if (!updatedUsersUuids.isOk || !updatedUsersUuids.response) {
                return;
            }

            const updatedUsers = updatedUsersUuids.response;

            if (updatedUsers.length === 0) {
                return;
            }

            users = updatedUsersUuids.response;

            if (users.length >= 10_000) {
                this.logger.log(
                    `Job ${job.name} has found more than 10,000 users, skipping webhook/telegram events. Restarting all nodes.`,
                );

                await this.startAllNodesQueueService.startAllNodes({
                    emitter: job.name,
                });

                return;
            }

            this.logger.log(`Job ${job.name} has found ${users.length} users.`);

            await pMap(
                users,
                async (userUuid) => {
                    try {
                        const userResponse = await this.queryBus.execute(
                            new GetUserByUniqueFieldQuery({
                                uuid: userUuid.uuid,
                            }),
                        );

                        if (!userResponse.isOk || !userResponse.response) {
                            return;
                        }

                        this.eventEmitter.emit(
                            EVENTS.USER.ENABLED,
                            new UserEvent({
                                user: userResponse.response,
                                event: EVENTS.USER.ENABLED,
                            }),
                        );

                        this.eventBus.publish(new AddUserToNodeEvent(userResponse.response.uuid));
                    } catch (error) {
                        this.logger.error(`Error handling "${job.name}" job: ${error}`);
                    }
                },
                { concurrency: 40 },
            );

            return;
        } catch (error) {
            this.logger.error(
                `Error handling "${ResetUserTrafficJobNames.resetDailyUserTraffic}" job: ${error}`,
            );
        }
    }

    private async batchResetUserTraffic(
        dto: BatchResetUserTrafficCommand,
    ): Promise<ICommandResponse<{ affectedRows: number }>> {
        return this.commandBus.execute<
            BatchResetUserTrafficCommand,
            ICommandResponse<{
                affectedRows: number;
            }>
        >(new BatchResetUserTrafficCommand(dto.strategy));
    }

    private async batchResetLimitedUsersTraffic(
        dto: BatchResetLimitedUsersTrafficCommand,
    ): Promise<ICommandResponse<{ uuid: string }[]>> {
        return this.commandBus.execute<
            BatchResetLimitedUsersTrafficCommand,
            ICommandResponse<
                {
                    uuid: string;
                }[]
            >
        >(new BatchResetLimitedUsersTrafficCommand(dto.strategy));
    }
}
