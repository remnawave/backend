import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { AxiosService } from '@common/axios/axios.service';
import { EVENTS } from '@libs/contracts/constants/events/events';

import { GetPluginByUuidQuery } from '@modules/node-plugins/queries/get-plugin-by-uuid';
import { GetNodeByUuidQuery } from '@modules/nodes/queries/get-node-by-uuid';

import { UsersQueuesService } from '@queue/_users/users-queues.service';

import { QUEUES_NAMES } from '../../queue.enum';
import { NODES_JOB_NAMES } from '../constants';

@Processor(QUEUES_NAMES.NODES.PLUGINS, {
    concurrency: 20,
})
export class NodePluginsProcessor extends WorkerHost {
    private readonly logger = new Logger(NodePluginsProcessor.name);
    private readonly CONCURRENCY: number;

    constructor(
        private readonly axios: AxiosService,
        private readonly queryBus: QueryBus,
        private readonly usersQueuesService: UsersQueuesService,
    ) {
        super();
        this.CONCURRENCY = 20;
    }

    async process(job: Job) {
        switch (job.name) {
            case NODES_JOB_NAMES.SYNC_NODE_PLUGINS:
                return await this.handleSyncNodePlugins(job);
            case NODES_JOB_NAMES.COLLECT_REPORTS:
                return await this.handleCollectReports(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleSyncNodePlugins(job: Job<{ nodeUuid: string }>) {
        try {
            const { nodeUuid } = job.data;

            const getNodeResult = await this.queryBus.execute(new GetNodeByUuidQuery(nodeUuid));

            if (!getNodeResult.isOk) {
                this.logger.error(`Failed to get node: ${getNodeResult.message}`);
                return {
                    success: false,
                    nodeUuid,
                    error: getNodeResult.message,
                };
            }

            const { response: node } = getNodeResult;

            const pluginUuid = node.activePluginUuid;

            if (!pluginUuid) {
                const response = await this.axios.syncNodePlugins(
                    {
                        plugin: null,
                    },
                    node.address,
                    node.port,
                );

                if (!response.isOk) {
                    this.logger.error(`Failed to sync node plugins: ${response.message}`);
                    return {
                        success: false,
                        nodeUuid,
                        error: response.message,
                    };
                }

                return;
            }

            const getNodePluginResult = await this.queryBus.execute(
                new GetPluginByUuidQuery(pluginUuid),
            );

            if (!getNodePluginResult.isOk) {
                this.logger.error(`Failed to get node plugin: ${getNodePluginResult.message}`);
                return;
            }

            const { response: nodePlugin } = getNodePluginResult;

            const syncNodePluginsResponse = await this.axios.syncNodePlugins(
                {
                    plugin: {
                        uuid: nodePlugin.uuid,
                        config: nodePlugin.pluginConfig as Record<string, unknown>,
                        name: nodePlugin.name,
                    },
                },
                node.address,
                node.port,
            );

            if (!syncNodePluginsResponse.isOk) {
                this.logger.error(
                    `Failed to sync node plugins: ${syncNodePluginsResponse.message}`,
                );
                return;
            }

            this.logger.log(`Node plugins synced successfully: ${nodeUuid}`);

            // TODO: retry

            return {
                success: true,
                nodeUuid,
            };
        } catch (error) {
            this.logger.error(`Failed to sync node plugins: ${error}`);
        }
    }

    private async handleCollectReports(
        job: Job<{ nodeUuid: string; address: string; port: number | null }>,
    ) {
        try {
            const { nodeUuid, address, port } = job.data;

            const response = await this.axios.collectTorrentBlockerReports(address, port);

            if (!response.isOk) {
                this.logger.error(`Failed to collect reports: ${response.message}`);

                return {
                    success: false,
                    nodeUuid,
                    collectedReports: [],
                };
            }

            const { response: collectedReports } = response;

            for (const report of collectedReports.reports) {
                await this.usersQueuesService.fireTorrentBlockerEvent({
                    tId: report.actionReport.userId,
                    event: EVENTS.TORRENT_BLOCKER.REPORT,
                    nodeUuid,
                    report,
                });
            }

            return {
                success: true,
                nodeUuid,
                collectedReports,
            };
        } catch (error) {
            this.logger.error(`Failed to collect reports: ${error}`);
        }
    }
}
