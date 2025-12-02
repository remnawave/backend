import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { JOBS_INTERVALS } from '@scheduler/intervals';

import { UsersQueuesService } from '@queue/_users';

@Injectable()
export class ResetUserTrafficCalendarWeekTask {
    private static readonly CRON_NAME = 'resetUserTrafficCalendarWeek';
    private readonly logger = new Logger(ResetUserTrafficCalendarWeekTask.name);

    constructor(private readonly usersQueuesService: UsersQueuesService) {}

    @Cron(JOBS_INTERVALS.RESET_USER_TRAFFIC.WEEKLY, {
        name: ResetUserTrafficCalendarWeekTask.CRON_NAME,
        waitForCompletion: true,
    })
    async handleCron() {
        try {
            await this.usersQueuesService.resetWeeklyUserTraffic();
        } catch (error) {
            this.logger.error(`Error in ResetUserTrafficCalendarWeekTask: ${error}`);
        }
    }
}
