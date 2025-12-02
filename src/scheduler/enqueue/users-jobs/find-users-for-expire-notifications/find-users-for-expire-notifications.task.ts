import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

import { UsersQueuesService } from '@queue/_users';

import { JOBS_INTERVALS } from '../../../intervals';

@Injectable()
export class FindUsersForExpireNotificationsTask implements OnApplicationBootstrap {
    private static readonly CRON_NAME = 'findUsersForExpireNotifications';
    private readonly logger = new Logger(FindUsersForExpireNotificationsTask.name);

    constructor(
        private readonly usersQueuesService: UsersQueuesService,
        private readonly configService: ConfigService,
        private schedulerRegistry: SchedulerRegistry,
    ) {}

    public async onApplicationBootstrap() {
        const isTelegramLoggerEnabled = this.configService.getOrThrow<string>(
            'IS_TELEGRAM_NOTIFICATIONS_ENABLED',
        );

        const isWebhookLoggerEnabled = this.configService.getOrThrow<string>('WEBHOOK_ENABLED');

        if (isTelegramLoggerEnabled === 'true' || isWebhookLoggerEnabled === 'true') {
            const job = this.schedulerRegistry.getCronJob(
                FindUsersForExpireNotificationsTask.CRON_NAME,
            );

            if (job) {
                job.start();
                this.logger.log('Job enabled.');
            }
        } else {
            this.schedulerRegistry.deleteCronJob(FindUsersForExpireNotificationsTask.CRON_NAME);

            this.logger.log('Job disabled.');
        }
    }

    @Cron(JOBS_INTERVALS.EXPIRE_NOTIFICATIONS, {
        name: FindUsersForExpireNotificationsTask.CRON_NAME,
        waitForCompletion: true,
        disabled: true,
    })
    async handleCron() {
        try {
            await this.usersQueuesService.expireUserNotifications({});
        } catch (error) {
            this.logger.error(`Error in FindUsersForExpireNotificationsTask: ${error}`);
        }
    }
}
