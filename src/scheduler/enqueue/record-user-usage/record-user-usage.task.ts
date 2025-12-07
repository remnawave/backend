import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Cron } from '@nestjs/schedule';

import { GetOnlineNodesQuery } from '@modules/nodes/queries/get-online-nodes';

import { NodesQueuesService } from '@queue/_nodes';

import { JOBS_INTERVALS } from '../../intervals';

@Injectable()
export class RecordUserUsageTask {
    private static readonly CRON_NAME = 'recordUserUsage';
    private readonly logger = new Logger(RecordUserUsageTask.name);
    constructor(
        private readonly queryBus: QueryBus,
        private readonly nodesQueuesService: NodesQueuesService,
    ) {}

    @Cron(JOBS_INTERVALS.RECORD_USER_USAGE, {
        name: RecordUserUsageTask.CRON_NAME,
        waitForCompletion: true,
    })
    async handleCron() {
        try {
            const nodesResponse = await this.queryBus.execute(new GetOnlineNodesQuery());
            if (!nodesResponse.isOk) {
                return;
            }

            if (nodesResponse.response.length === 0) {
                return;
            }

            await this.nodesQueuesService.recordUserUsageBulk(
                nodesResponse.response.map((node) => ({
                    nodeUuid: node.uuid,
                    nodeAddress: node.address,
                    nodePort: node.port,
                    consumptionMultiplier: node.consumptionMultiplier.toString(),
                    nodeId: node.id.toString(),
                })),
            );

            return;
        } catch (error) {
            this.logger.error(`Error in RecordUserUsageTask: ${error}`);
        }
    }
}
