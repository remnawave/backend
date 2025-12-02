import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

import { UsersQueuesService } from '@queue/_users';

import { JOBS_INTERVALS } from '../../../intervals';

@Injectable()
export class FindUsersForThresholdNotificationTask implements OnApplicationBootstrap {
    private static readonly CRON_NAME = 'findUsersForThresholdNotification';
    private readonly logger = new Logger(FindUsersForThresholdNotificationTask.name);

    constructor(
        private readonly usersQueuesService: UsersQueuesService,
        private readonly configService: ConfigService,
        private schedulerRegistry: SchedulerRegistry,
    ) {}

    public async onApplicationBootstrap() {
        const isBandwidthUsageNotificationsEnabled = this.configService.getOrThrow<string>(
            'BANDWIDTH_USAGE_NOTIFICATIONS_ENABLED',
        );
        const isTelegramLoggerEnabled = this.configService.getOrThrow<string>(
            'IS_TELEGRAM_NOTIFICATIONS_ENABLED',
        );
        const isWebhookLoggerEnabled = this.configService.getOrThrow<string>('WEBHOOK_ENABLED');

        if (
            isBandwidthUsageNotificationsEnabled === 'true' &&
            (isTelegramLoggerEnabled === 'true' || isWebhookLoggerEnabled === 'true')
        ) {
            const job = this.schedulerRegistry.getCronJob(
                FindUsersForThresholdNotificationTask.CRON_NAME,
            );

            if (job) {
                job.start();
                this.logger.log('Find users for threshold notification job enabled.');
            } else {
                this.logger.warn('Find users for threshold notification job not found.');
            }
        } else {
            try {
                this.schedulerRegistry.deleteCronJob(
                    FindUsersForThresholdNotificationTask.CRON_NAME,
                );

                this.logger.log('Find users for threshold notification job disabled.');
            } catch (error) {
                this.logger.error(
                    `Error deleting "${FindUsersForThresholdNotificationTask.CRON_NAME}" cron job: ${error}`,
                );
            }
        }
    }

    @Cron(JOBS_INTERVALS.BANDWIDTH_USAGE_NOTIFICATIONS.FIND_USERS_TO_SEND_NOTIFICATIONS, {
        name: FindUsersForThresholdNotificationTask.CRON_NAME,
        waitForCompletion: true,
        disabled: true,
    })
    async handleCron() {
        try {
            await this.usersQueuesService.findUsersForThresholdNotification();
        } catch (error) {
            this.logger.error(`Error in FindUsersForThresholdNotificationTask: ${error}`);
        }
    }
}
