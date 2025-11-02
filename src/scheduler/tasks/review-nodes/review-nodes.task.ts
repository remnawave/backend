import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { QueryBus } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';
import { EVENTS } from '@libs/contracts/constants/events/events';

import { NodeEvent } from '@integration-modules/notifications/interfaces';

import { GetEnabledNodesQuery } from '@modules/nodes/queries/get-enabled-nodes/get-enabled-nodes.query';
import { NodesEntity } from '@modules/nodes/entities/nodes.entity';

import { JOBS_INTERVALS } from '../../intervals';

@Injectable()
export class ReviewNodesTask {
    private static readonly CRON_NAME = 'reviewNodes';
    private readonly logger = new Logger(ReviewNodesTask.name);
    private notifiedNodes: Map<string, boolean>;

    constructor(
        private readonly queryBus: QueryBus,
        private readonly eventEmitter: EventEmitter2,
    ) {
        this.notifiedNodes = new Map();
    }

    @Cron(JOBS_INTERVALS.REVIEW_NODES, {
        name: ReviewNodesTask.CRON_NAME,
        waitForCompletion: true,
    })
    async handleCron() {
        let nodes: NodesEntity[] | null = null;
        try {
            const nodesResponse = await this.getEnabledNodes();
            if (!nodesResponse.isOk || !nodesResponse.response) {
                return;
            }

            nodes = nodesResponse.response;

            for (const node of nodes) {
                if (node.isTrafficTrackingActive === false) continue;
                if (node.notifyPercent === null || node.notifyPercent === 0) continue;
                if (node.trafficLimitBytes === null || node.trafficLimitBytes === BigInt(0))
                    continue;

                const limit = node.trafficLimitBytes || BigInt(0);
                const used = node.trafficUsedBytes || BigInt(0);

                const notifyPercent = node.notifyPercent;

                const currentPercent = Number((used * BigInt(100)) / limit);

                if (currentPercent >= notifyPercent && !this.notifiedNodes.get(node.uuid)) {
                    this.logger.log(
                        `Node ${node.uuid} has exceeded ${currentPercent}% of traffic limit (${notifyPercent}% threshold)`,
                    );

                    this.eventEmitter.emit(
                        EVENTS.NODE.TRAFFIC_NOTIFY,
                        new NodeEvent(node, EVENTS.NODE.TRAFFIC_NOTIFY),
                    );

                    this.notifiedNodes.set(node.uuid, true);
                } else if (currentPercent < notifyPercent && this.notifiedNodes.get(node.uuid)) {
                    this.notifiedNodes.delete(node.uuid);
                }
            }
        } catch (error) {
            this.logger.error(error);
        } finally {
            nodes = null;
        }
    }

    private async getEnabledNodes(): Promise<ICommandResponse<NodesEntity[]>> {
        return this.queryBus.execute<GetEnabledNodesQuery, ICommandResponse<NodesEntity[]>>(
            new GetEnabledNodesQuery(),
        );
    }
}
