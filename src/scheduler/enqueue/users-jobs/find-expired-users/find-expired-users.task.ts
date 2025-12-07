import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { UsersQueuesService } from '@queue/_users';

import { JOBS_INTERVALS } from '../../../intervals';

@Injectable()
export class FindExpiredUsersTask {
    private static readonly CRON_NAME = 'findExpiredUsers';
    private readonly logger = new Logger(FindExpiredUsersTask.name);

    constructor(private readonly usersQueuesService: UsersQueuesService) {}

    @Cron(JOBS_INTERVALS.REVIEW_USERS.FIND_EXPIRED_USERS, {
        name: FindExpiredUsersTask.CRON_NAME,
        waitForCompletion: true,
    })
    async handleCron() {
        try {
            await this.usersQueuesService.findExpiredUsers();
        } catch (error) {
            this.logger.error(`Error in FindExpiredUsersTask: ${error}`);
        }
    }
}
