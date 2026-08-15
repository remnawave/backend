import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { INodeConnectionOpts } from '@common/axios';
import { AxiosService } from '@common/axios/axios.service';
import { EVENTS } from '@libs/contracts/constants/events/events';

import { ProcessAbuseReportCommand } from '@modules/node-plugins/commands/process-abuse-report';
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
        private readonly commandBus: CommandBus,
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
                    {
                        address: node.address,
                        port: node.port,
                        proxyUrl: node.proxyUrl,
                    },
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
                {
                    address: node.address,
                    port: node.port,
                    proxyUrl: node.proxyUrl,
                },
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
        job: Job<{
            nodeUuid: string;
            connectionOpts: INodeConnectionOpts;
        }>,
    ) {
        try {
            const { nodeUuid, connectionOpts } = job.data;

            const [torrentResponse, abuseResponse] = await Promise.all([
                this.axios.collectTorrentBlockerReports(connectionOpts),
                this.axios.collectAbuseBlockerReports(connectionOpts),
            ]);
            let success = true;

            if (!torrentResponse.isOk) {
                success = false;
                this.logger.error(`Failed to collect torrent reports: ${torrentResponse.message}`);
            } else {
                for (const report of torrentResponse.response.reports) {
                    await this.usersQueuesService.fireTorrentBlockerEvent({
                        id: report.actionReport.userId,
                        event: EVENTS.TORRENT_BLOCKER.REPORT,
                        nodeUuid,
                        report,
                    });
                }
            }

            if (!abuseResponse.isOk) {
                success = false;
                this.logger.error(`Failed to collect abuse reports: ${abuseResponse.message}`);
            } else {
                for (const report of abuseResponse.response.reports) {
                    await this.commandBus.execute(
                        new ProcessAbuseReportCommand(nodeUuid, connectionOpts, report),
                    );
                }
            }

            return {
                success,
                nodeUuid,
                collectedReports: torrentResponse.isOk ? torrentResponse.response : { reports: [] },
                collectedAbuseReports: abuseResponse.isOk
                    ? abuseResponse.response
                    : { reports: [] },
            };
        } catch (error) {
            this.logger.error(`Failed to collect reports: ${error}`);
        }
    }
}
