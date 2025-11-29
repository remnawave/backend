import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { QueryBus } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

import { GetOnlineNodesQuery } from '@modules/nodes/queries/get-online-nodes/get-online-nodes.query';
import { NodesEntity } from '@modules/nodes';

import { NodesQueuesService } from '@queue/_nodes';

import { JOBS_INTERVALS } from '../../intervals';

@Injectable()
export class RecordNodesUsageTask {
    private static readonly CRON_NAME = 'recordNodesUsage';
    private readonly logger = new Logger(RecordNodesUsageTask.name);

    constructor(
        private readonly queryBus: QueryBus,

        private readonly nodesQueuesService: NodesQueuesService,
    ) {}

    @Cron(JOBS_INTERVALS.RECORD_NODE_USAGE, {
        name: RecordNodesUsageTask.CRON_NAME,
        waitForCompletion: true,
    })
    async handleCron() {
        try {
            const nodesResponse = await this.getOnlineNodes();
            if (!nodesResponse.isOk || !nodesResponse.response) {
                return;
            }

            const nodes = nodesResponse.response;

            if (nodes.length === 0) {
                return;
            }

            await this.nodesQueuesService.recordNodeUsageBulk(
                nodes.map((node) => ({
                    nodeUuid: node.uuid,
                    nodeAddress: node.address,
                    nodePort: node.port,
                })),
            );

            return;
        } catch (error) {
            this.logger.error(error);
        }
    }

    private async getOnlineNodes(): Promise<ICommandResponse<NodesEntity[]>> {
        return this.queryBus.execute<GetOnlineNodesQuery, ICommandResponse<NodesEntity[]>>(
            new GetOnlineNodesQuery(),
        );
    }
}
