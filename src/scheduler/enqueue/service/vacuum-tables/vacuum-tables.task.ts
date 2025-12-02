import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { JOBS_INTERVALS } from '@scheduler/intervals';

import { ServiceQueueService } from '@queue/service';

@Injectable()
export class VacuumTablesTask {
    private static readonly CRON_NAME = 'vacuumTables';
    private readonly logger = new Logger(VacuumTablesTask.name);

    constructor(private readonly serviceQueueService: ServiceQueueService) {}

    @Cron(JOBS_INTERVALS.SERVICE.VACUUM_TABLES, {
        name: VacuumTablesTask.CRON_NAME,
        waitForCompletion: true,
    })
    async handleCron() {
        try {
            await this.serviceQueueService.vacuumTables({});
        } catch (error) {
            this.logger.error(`Error in VacuumTablesTask: ${error}`);
        }
    }
}
