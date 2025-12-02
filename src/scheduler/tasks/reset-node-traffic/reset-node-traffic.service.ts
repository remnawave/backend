import dayjs from 'dayjs';

import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { ICommandResponse } from '@common/types/command-response.type';

import { CreateNodeTrafficUsageHistoryCommand } from '@modules/nodes-traffic-usage-history/commands/create-node-traffic-usage-history';
import { NodesTrafficUsageHistoryEntity } from '@modules/nodes-traffic-usage-history/entities/nodes-traffic-usage-history.entity';
import { UpdateNodeCommand } from '@modules/nodes/commands/update-node';
import { GetAllNodesQuery } from '@modules/nodes/queries/get-all-nodes';
import { NodesEntity } from '@modules/nodes/entities/nodes.entity';

import { JOBS_INTERVALS } from '@scheduler/intervals';

@Injectable()
export class ResetNodeTrafficTask {
    private static readonly CRON_NAME = 'resetNodeTraffic';
    private readonly logger = new Logger(ResetNodeTrafficTask.name);

    constructor(
        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
    ) {}

    @Cron(JOBS_INTERVALS.RESET_NODE_TRAFFIC, {
        name: ResetNodeTrafficTask.CRON_NAME,
        waitForCompletion: true,
    })
    async handleCron() {
        try {
            const nodesResponse = await this.getAllNodes();
            if (!nodesResponse.isOk || !nodesResponse.response) {
                return;
            }

            const nodes = nodesResponse.response;

            for (const node of nodes) {
                if (node.isTrafficTrackingActive === false) continue;

                const resetDay = node.trafficResetDay || 1;
                const today = dayjs();
                const currentDay = today.date();
                const lastDayOfMonth = today.endOf('month').date();

                if (
                    (resetDay > lastDayOfMonth && currentDay === lastDayOfMonth) ||
                    currentDay === resetDay
                ) {
                    this.logger.log(`Resetting node traffic for ${node.uuid}`);
                    const entity = new NodesTrafficUsageHistoryEntity({
                        nodeUuid: node.uuid,
                        trafficBytes: node.trafficUsedBytes || BigInt(0),
                        resetAt: today.toDate(),
                    });

                    await this.createNodeTrafficUsageHistory({
                        nodeTrafficUsageHistory: entity,
                    });

                    await this.commandBus.execute(
                        new UpdateNodeCommand({
                            uuid: node.uuid,
                            trafficUsedBytes: BigInt(0),
                        }),
                    );
                }
            }
        } catch (error) {
            this.logger.error(error);
        }
    }

    private async getAllNodes(): Promise<ICommandResponse<NodesEntity[]>> {
        return this.queryBus.execute<GetAllNodesQuery, ICommandResponse<NodesEntity[]>>(
            new GetAllNodesQuery(),
        );
    }

    private async createNodeTrafficUsageHistory(
        dto: CreateNodeTrafficUsageHistoryCommand,
    ): Promise<ICommandResponse<NodesTrafficUsageHistoryEntity>> {
        return this.commandBus.execute<
            CreateNodeTrafficUsageHistoryCommand,
            ICommandResponse<NodesTrafficUsageHistoryEntity>
        >(new CreateNodeTrafficUsageHistoryCommand(dto.nodeTrafficUsageHistory));
    }
}
