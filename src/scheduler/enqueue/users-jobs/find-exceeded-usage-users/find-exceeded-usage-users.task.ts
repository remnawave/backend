import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { JOBS_INTERVALS } from '@scheduler/intervals';

import { UsersQueuesService } from '@queue/_users';

@Injectable()
export class FindExceededUsageUsersTask {
    private static readonly CRON_NAME = 'findExceededUsageUsers';
    private readonly logger = new Logger(FindExceededUsageUsersTask.name);

    constructor(private readonly usersQueuesService: UsersQueuesService) {}

    @Cron(JOBS_INTERVALS.REVIEW_USERS.FIND_EXCEEDED_TRAFFIC_USAGE_USERS, {
        name: FindExceededUsageUsersTask.CRON_NAME,
        waitForCompletion: true,
    })
    async handleCron() {
        try {
            await this.usersQueuesService.findExceededUsers();
        } catch (error) {
            this.logger.error(`Error in FindExceededUsageUsersTask: ${error}`);
        }
    }
}
