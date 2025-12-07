import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { JOBS_INTERVALS } from '@scheduler/intervals';

import { UsersQueuesService } from '@queue/_users';

@Injectable()
export class ResetUserTrafficCalendarDayTask {
    private static readonly CRON_NAME = 'resetUserTrafficCalendarDay';
    private readonly logger = new Logger(ResetUserTrafficCalendarDayTask.name);

    constructor(private readonly usersQueuesService: UsersQueuesService) {}

    @Cron(JOBS_INTERVALS.RESET_USER_TRAFFIC.DAILY, {
        name: ResetUserTrafficCalendarDayTask.CRON_NAME,
        waitForCompletion: true,
    })
    async handleCron() {
        try {
            await this.usersQueuesService.resetDailyUserTraffic();
        } catch (error) {
            this.logger.error(`Error in ResetUserTrafficCalendarDayTask: ${error}`);
        }
    }
}
