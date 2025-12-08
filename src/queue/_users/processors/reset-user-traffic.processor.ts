import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Scope } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { formatExecutionTime, getTime } from '@common/utils/get-elapsed-time';
import { throttleQueue } from '@common/utils/throttle-queue.util';
import { RESET_PERIODS, TResetPeriods } from '@libs/contracts/constants';
import { EVENTS } from '@libs/contracts/constants/events/events';

import { BatchResetLimitedUsersTrafficCommand } from '@modules/users/commands/batch-reset-limited-users-traffic';
import { BatchResetUserTrafficCommand } from '@modules/users/commands/batch-reset-user-traffic';

import { NodesQueuesService } from '@queue/_nodes';
import { QUEUES_NAMES } from '@queue/queue.enum';

import { USERS_JOB_NAMES } from '../constants/users-job-name.constant';
import { UsersQueuesService } from '../users-queues.service';

@Processor(
    {
        name: QUEUES_NAMES.USERS.RESET_USER_TRAFFIC,
        scope: Scope.REQUEST,
    },
    {
        concurrency: 1,
    },
)
export class ResetUserTrafficQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(ResetUserTrafficQueueProcessor.name);

    constructor(
        private readonly commandBus: CommandBus,

        private readonly nodesQueuesService: NodesQueuesService,
        private readonly usersQueuesService: UsersQueuesService,
    ) {
        super();
    }

    async process(job: Job) {
        const activateQueue = await throttleQueue(
            this.usersQueuesService.queues.updateUsersUsage,
            this.logger,
        );

        try {
            switch (job.name) {
                case USERS_JOB_NAMES.RESET_DAILY_USER_TRAFFIC:
                    return this.handleResetUserTraffic(job, RESET_PERIODS.DAY);
                case USERS_JOB_NAMES.RESET_MONTHLY_USER_TRAFFIC:
                    return this.handleResetUserTraffic(job, RESET_PERIODS.MONTH);
                case USERS_JOB_NAMES.RESET_WEEKLY_USER_TRAFFIC:
                    return this.handleResetUserTraffic(job, RESET_PERIODS.WEEK);
                case USERS_JOB_NAMES.RESET_NO_RESET_USER_TRAFFIC:
                    return this.handleResetUserTraffic(job, RESET_PERIODS.NO_RESET);
                case USERS_JOB_NAMES.RESET_ALL_USER_TRAFFIC:
                    return this.handleResetAllUserTraffic(job);
                default:
                    this.logger.warn(`Job "${job.name}" is not handled.`);
                    break;
            }
        } catch (error) {
            this.logger.error(`Error handling "${job.name}" job: ${error}`);
        } finally {
            await activateQueue();
        }
    }

    private async handleResetUserTraffic(job: Job, strategy: TResetPeriods) {
        try {
            await this.commandBus.execute(new BatchResetUserTrafficCommand(strategy));

            const updatedUsersResult = await this.commandBus.execute(
                new BatchResetLimitedUsersTrafficCommand(strategy),
            );

            if (!updatedUsersResult.isOk) {
                return;
            }

            const updatedUsers = updatedUsersResult.response;

            if (updatedUsers.length === 0) {
                return;
            }

            if (updatedUsers.length >= 10_000) {
                this.logger.log(
                    `Job ${job.name} has found more than 10,000 users, skipping webhook/telegram events. Restarting all nodes.`,
                );

                await this.nodesQueuesService.startAllNodes({
                    emitter: job.name,
                });

                return;
            }

            this.logger.log(`Job ${job.name} has found ${updatedUsers.length} users.`);

            await this.usersQueuesService.fireUserEventBulk({
                users: updatedUsers,
                userEvent: EVENTS.USER.ENABLED,
            });

            return;
        } catch (error) {
            this.logger.error(
                `Error handling "${USERS_JOB_NAMES.RESET_DAILY_USER_TRAFFIC}" job: ${error}`,
            );
        }
    }

    private async handleResetAllUserTraffic(job: Job) {
        try {
            const ct = getTime();

            await this.handleResetUserTraffic(job, RESET_PERIODS.NO_RESET);
            await this.handleResetUserTraffic(job, RESET_PERIODS.DAY);
            await this.handleResetUserTraffic(job, RESET_PERIODS.WEEK);
            await this.handleResetUserTraffic(job, RESET_PERIODS.MONTH);

            await this.nodesQueuesService.startAllNodesWithoutDeduplication(
                {
                    emitter: 'resetAllUserTraffic',
                },
                10_000,
            );

            this.logger.log(`Reset All User Traffic. Time: ${formatExecutionTime(ct)}`);
        } catch (error) {
            this.logger.error(
                `Error handling "${USERS_JOB_NAMES.RESET_ALL_USER_TRAFFIC}" job: ${error}`,
            );
        }
    }
}
