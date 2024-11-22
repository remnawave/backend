import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { CommandBus, EventBus, QueryBus } from '@nestjs/cqrs';
import { NodesEntity } from '../../../nodes';
import { ICommandResponse } from '@common/types/command-response.type';
import { GetEnabledNodesQuery } from '../../../nodes/queries/get-enabled-nodes/get-enabled-nodes.query';
import { AxiosService } from '@common/axios';
import { GetSystemStatsCommand } from '@remnawave/node-contract';
import { UpdateNodeCommand } from '../../../nodes/commands/update-node/update-node.command';
import { StartNodeEvent } from '../../../nodes/events/start-node';
import { formatExecutionTime, getTime } from '@common/utils/get-elapsed-time';
import pMap from '@cjs-exporter/p-map';
import { StartAllNodesEvent } from '../../../nodes/events/start-all-nodes';
import { JOBS_INTERVALS } from '../../intervals';

@Injectable()
export class NodeHealthCheckService {
    private static readonly CRON_NAME = 'nodeHealthCheck';
    private readonly logger = new Logger(NodeHealthCheckService.name);
    private isJobRunning: boolean;
    private cronName: string;
    private CONCURRENCY: number;
    private isNodesRestarted: boolean;
    constructor(
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
        private readonly axios: AxiosService,
        private readonly eventBus: EventBus,
    ) {
        this.isJobRunning = false;
        this.cronName = NodeHealthCheckService.CRON_NAME;
        this.CONCURRENCY = 20;
        this.isNodesRestarted = false;
    }

    private checkJobRunning(): boolean {
        if (this.isJobRunning) {
            this.logger.debug(
                `Job ${this.cronName} is already running. Will retry at ${this.schedulerRegistry.getCronJob(this.cronName).nextDate().toISOTime()}`,
            );
            return false;
        }
        return true;
    }

    @Cron(JOBS_INTERVALS.NODE_HEALTH_CHECK, {
        name: NodeHealthCheckService.CRON_NAME,
    })
    async handleCron() {
        try {
            if (!this.checkJobRunning()) return;
            const ct = getTime();
            this.isJobRunning = true;

            if (!this.isNodesRestarted) {
                this.isNodesRestarted = true;
                this.logger.log('Restarting all nodes on application start');

                await this.eventBus.publish(new StartAllNodesEvent());

                return;
            }

            const nodesResponse = await this.getEnabledNodes();
            if (!nodesResponse.isOk || !nodesResponse.response) {
                this.logger.error('No enabled nodes found');
                return;
            }

            const nodes = nodesResponse.response;

            const mapper = async (node: NodesEntity) => {
                const response = await this.axios.getSystemStats(node.address, node.port, 5000);
                switch (response.isOk) {
                    case true:
                        return this.handleConnectedNode(node, response.response!);
                    case false:
                        return this.handleDisconnectedNode(node, response.message);
                }
            };

            await pMap(nodes, mapper, { concurrency: this.CONCURRENCY });

            this.logger.debug(`Node health check completed. Time: ${formatExecutionTime(ct)}`);
        } catch (error) {
            this.logger.error(error);
        } finally {
            this.isJobRunning = false;
        }
    }

    private async handleConnectedNode(node: NodesEntity, response: GetSystemStatsCommand.Response) {
        if (typeof response.response.uptime !== 'number') {
            this.logger.error(`Node ${node.uuid} uptime is not a number`);
            return;
        }

        node.updateStatus({
            isConnected: true,
            isNodeOnline: true,
            isXrayRunning: true,
            lastStatusChange: new Date(),
            lastStatusMessage: '',
            isDisabled: false,
        });

        await this.updateNode({ node });
    }

    private async handleDisconnectedNode(node: NodesEntity, message: string | undefined) {
        this.logger.debug(`Node ${node.uuid} is disconnected: ${message}`);
        node.updateStatus({
            isDisabled: false,
            isConnected: false,
            lastStatusChange: new Date(),
            isNodeOnline: false,
            isXrayRunning: false,
            lastStatusMessage: message,
        });

        await this.updateNode({ node });

        this.eventBus.publish(new StartNodeEvent(node));
    }

    private async getEnabledNodes(): Promise<ICommandResponse<NodesEntity[]>> {
        return this.queryBus.execute<GetEnabledNodesQuery, ICommandResponse<NodesEntity[]>>(
            new GetEnabledNodesQuery(),
        );
    }

    private async updateNode(dto: UpdateNodeCommand): Promise<ICommandResponse<void>> {
        return this.commandBus.execute<UpdateNodeCommand, ICommandResponse<void>>(
            new UpdateNodeCommand(dto.node),
        );
    }
}