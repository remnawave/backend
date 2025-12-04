import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Cron } from '@nestjs/schedule';

import { GetEnabledNodesPartialQuery } from '@modules/nodes/queries/get-enabled-nodes-partial/get-enabled-nodes-partial.query';

import { NodesQueuesService } from '@queue/_nodes';

import { JOBS_INTERVALS } from '../../intervals';

@Injectable()
export class NodeHealthCheckTask {
    private static readonly CRON_NAME = 'nodeHealthCheck';
    private readonly logger = new Logger(NodeHealthCheckTask.name);
    private cronName: string;

    private isNodesRestarted: boolean;
    constructor(
        private readonly queryBus: QueryBus,
        private readonly nodesQueuesService: NodesQueuesService,
    ) {
        this.cronName = NodeHealthCheckTask.CRON_NAME;
        this.isNodesRestarted = false;
    }

    @Cron(JOBS_INTERVALS.NODE_HEALTH_CHECK, {
        name: NodeHealthCheckTask.CRON_NAME,
        waitForCompletion: true,
    })
    async handleCron() {
        try {
            if (!this.isNodesRestarted) {
                this.isNodesRestarted = true;
                this.logger.log('Restarting all nodes on application start.');

                await this.nodesQueuesService.startAllNodes({
                    emitter: this.cronName,
                });

                return;
            }

            const nodesResponse = await this.queryBus.execute(new GetEnabledNodesPartialQuery());
            if (!nodesResponse.isOk) {
                return;
            }

            if (nodesResponse.response.length === 0) {
                return;
            }

            await this.nodesQueuesService.checkNodeHealthBulk(nodesResponse.response);

            return;
        } catch (error) {
            this.logger.error(`Error in NodeHealthCheckService: ${error}`);
        }
    }
}
