import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { JOBS_INTERVALS } from '@scheduler/intervals';

import { UsersQueuesService } from '@queue/_users';

@Injectable()
export class ResetUserTrafficCalendarMonthTask {
    private static readonly CRON_NAME = 'resetUserTrafficCalendarMonth';
    private readonly logger = new Logger(ResetUserTrafficCalendarMonthTask.name);

    constructor(private readonly usersQueuesService: UsersQueuesService) {}

    @Cron(JOBS_INTERVALS.RESET_USER_TRAFFIC.MONTHLY, {
        name: ResetUserTrafficCalendarMonthTask.CRON_NAME,
        waitForCompletion: true,
    })
    async handleCron() {
        try {
            await this.usersQueuesService.resetMonthlyUserTraffic();
        } catch (error) {
            this.logger.error(`Error in ResetUserTrafficCalendarMonthTask: ${error}`);
        }
    }
}
