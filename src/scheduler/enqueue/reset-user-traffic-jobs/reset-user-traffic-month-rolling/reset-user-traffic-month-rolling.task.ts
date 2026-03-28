import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { JOBS_INTERVALS } from '@scheduler/intervals';

import { UsersQueuesService } from '@queue/_users';

@Injectable()
export class ResetUserTrafficCalendarMonthRollingTask {
    private static readonly CRON_NAME = 'resetUserTrafficCalendarMonthRolling';
    private readonly logger = new Logger(ResetUserTrafficCalendarMonthRollingTask.name);

    constructor(private readonly usersQueuesService: UsersQueuesService) {}

    @Cron(JOBS_INTERVALS.RESET_USER_TRAFFIC.MONTHLY_ROLLING, {
        name: ResetUserTrafficCalendarMonthRollingTask.CRON_NAME,
        waitForCompletion: true,
    })
    async handleCron() {
        try {
            await this.usersQueuesService.resetMonthlyRollingUserTraffic();
        } catch (error) {
            this.logger.error(`Error in ResetUserTrafficCalendarMonthRollingTask: ${error}`);
        }
    }
}
