import { Queue } from 'bullmq';

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

import { INodeConnectionOpts } from '@common/axios';

import { IGetEnabledNodesPartialResponse } from '@modules/nodes/queries/get-enabled-nodes-partial/get-enabled-nodes-partial.query';

import { QUEUES_NAMES } from '@queue/queue.enum';

import { NODES_JOB_NAMES } from './constants/nodes-job-name.constant';
import {
    IAddUsersToNodePayload,
    IAddUserToNodePayload,
    IDropIpsConnectionsPayload,
    IDropUsersConnectionsPayload,
    IGeocheckPayload,
    IGeocheckResult,
    IGetIpsListProgress,
    IGetIpsListResult,
    IGetUsersIpsListResult,
    INodeHealthCheckPayload,
    IRecordNodeUsagePayload,
    IRecordUserUsagePayload,
    IRemoveUserFromNodePayload,
    IRemoveUsersFromNodePayload,
} from './interfaces';
import {
    IBlockIpsPayload,
    IUnblockIpsPayload,
    IRecreateTablesPayload,
} from './interfaces/executor.payload.interface';

@Injectable()
export class NodesQueuesService implements OnApplicationBootstrap {
    protected readonly logger: Logger = new Logger(NodesQueuesService.name);

    constructor(
        @InjectQueue(QUEUES_NAMES.NODES.START) private readonly startNodeQueue: Queue,
        @InjectQueue(QUEUES_NAMES.NODES.STOP) private readonly stopNodeQueue: Queue,
        @InjectQueue(QUEUES_NAMES.NODES.HEALTH_CHECK) private readonly nodeHealthCheckQueue: Queue,
        @InjectQueue(QUEUES_NAMES.NODES.USERS) private readonly nodeUsersQueue: Queue,
        @InjectQueue(QUEUES_NAMES.NODES.START_ALL_BY_PROFILE)
        private readonly startAllNodesByProfileQueue: Queue,
        @InjectQueue(QUEUES_NAMES.NODES.START_ALL_NODES) private readonly startAllNodesQueue: Queue,
        @InjectQueue(QUEUES_NAMES.NODES.RECORD_USER_USAGE)
        private readonly recordUserUsageQueue: Queue,
        @InjectQueue(QUEUES_NAMES.NODES.RECORD_NODE_USAGE)
        private readonly recordNodeUsageQueue: Queue,
        @InjectQueue(QUEUES_NAMES.NODES.BULK_USERS) private readonly nodeBulkUsersQueue: Queue,
        @InjectQueue(QUEUES_NAMES.NODES.QUERY_NODES) private readonly queryNodesQueue: Queue,
        @InjectQueue(QUEUES_NAMES.NODES.PLUGINS) private readonly nodePluginsQueue: Queue,
    ) {}

    get queues() {
        return {
            startNode: this.startNodeQueue,
            stopNode: this.stopNodeQueue,
            nodeHealthCheck: this.nodeHealthCheckQueue,
            nodeUsers: this.nodeUsersQueue,
            startAllNodesByProfile: this.startAllNodesByProfileQueue,
            startAllNodes: this.startAllNodesQueue,
            recordUserUsage: this.recordUserUsageQueue,
            recordNodeUsage: this.recordNodeUsageQueue,
            nodeBulkUsers: this.nodeBulkUsersQueue,
            queryNodes: this.queryNodesQueue,
            nodePlugins: this.nodePluginsQueue,
        } as const;
    }

    async onApplicationBootstrap(): Promise<void> {
        for (const queue of Object.values(this.queues)) {
            try {
                await queue.waitUntilReady();
            } catch (error) {
                const reason = error instanceof Error ? error.message : String(error);
                throw new Error(`Queue "${queue.name}" not connected: ${reason}.`);
            }
        }

        this.logger.log(`${Object.values(this.queues).length} queues are connected.`);

        await this.startAllNodesByProfileQueue.setGlobalConcurrency(3);
        await this.startAllNodesQueue.setGlobalConcurrency(1);
    }

    public async startNode(payload: { nodeUuid: string; force?: boolean }) {
        return this.startNodeQueue.add(NODES_JOB_NAMES.START_NODE, payload, {
            jobId: `${NODES_JOB_NAMES.START_NODE}-${payload.nodeUuid}`,
            removeOnComplete: true,
            removeOnFail: true,
        });
    }

    public async stopNode(payload: { nodeUuid: string; isNeedToBeDeleted: boolean }) {
        return this.stopNodeQueue.add(NODES_JOB_NAMES.STOP_NODE, payload, {
            jobId: `${NODES_JOB_NAMES.STOP_NODE}-${payload.nodeUuid}-${payload.isNeedToBeDeleted}`,
            removeOnComplete: true,
            removeOnFail: true,
        });
    }

    public async checkNodeHealthBulk(payload: IGetEnabledNodesPartialResponse[]) {
        return this.nodeHealthCheckQueue.addBulk(
            payload.map((node) => {
                return {
                    name: NODES_JOB_NAMES.NODE_HEALTH_CHECK,
                    data: {
                        nodeUuid: node.uuid,
                        isConnected: node.isConnected,
                        connectionOpts: node.connectionOpts,
                    } satisfies INodeHealthCheckPayload,
                    opts: {
                        jobId: `${NODES_JOB_NAMES.NODE_HEALTH_CHECK}-${node.uuid}`,
                        removeOnComplete: true,
                        removeOnFail: true,
                    },
                };
            }),
        );
    }

    public async addUserToNode(payload: IAddUserToNodePayload) {
        return this.nodeUsersQueue.add(NODES_JOB_NAMES.ADD_USER_TO_NODE, payload);
    }

    public async removeUserFromNode(payload: IRemoveUserFromNodePayload) {
        return this.nodeUsersQueue.add(NODES_JOB_NAMES.REMOVE_USER_FROM_NODE, payload);
    }

    public async removeUserFromNodeBulk(payload: IRemoveUserFromNodePayload[]) {
        return this.nodeUsersQueue.addBulk(
            payload.map((p) => ({
                name: NODES_JOB_NAMES.REMOVE_USER_FROM_NODE,
                data: p,
            })),
        );
    }

    public async addUsersToNode(payload: IAddUsersToNodePayload) {
        return this.nodeBulkUsersQueue.add(NODES_JOB_NAMES.ADD_USERS_TO_NODE, payload);
    }

    public async removeUsersFromNode(payload: IRemoveUsersFromNodePayload) {
        return this.nodeBulkUsersQueue.add(NODES_JOB_NAMES.REMOVE_USERS_FROM_NODE, payload);
    }

    public async startAllNodesByProfile(payload: {
        emitter: string;
        profileUuid: string;
        force?: boolean;
    }) {
        return this.startAllNodesByProfileQueue.add(NODES_JOB_NAMES.START_ALL_BY_PROFILE, payload, {
            deduplication: {
                id: payload.profileUuid,
            },
        });
    }

    public async startAllNodes(payload: { emitter: string; force?: boolean }) {
        return this.startAllNodesQueue.add(NODES_JOB_NAMES.START_ALL_NODES, payload, {
            deduplication: {
                id: NODES_JOB_NAMES.START_ALL_NODES,
            },
        });
    }

    public async startAllNodesWithoutDeduplication(payload: { emitter: string }, delay?: number) {
        return this.startAllNodesQueue.add(NODES_JOB_NAMES.START_ALL_NODES, payload, {
            delay,
        });
    }

    public async recordUserUsage(payload: IRecordUserUsagePayload) {
        return this.recordUserUsageQueue.add(NODES_JOB_NAMES.RECORD_USER_USAGE, payload, {
            jobId: `${NODES_JOB_NAMES.RECORD_USER_USAGE}-${payload.nodeId}`,
            removeOnComplete: true,
            removeOnFail: true,
        });
    }

    public async recordUserUsageBulk(payload: IRecordUserUsagePayload[]) {
        return this.recordUserUsageQueue.addBulk(
            payload.map((node) => {
                return {
                    name: NODES_JOB_NAMES.RECORD_USER_USAGE,
                    data: node,
                    opts: {
                        jobId: `${NODES_JOB_NAMES.RECORD_USER_USAGE}-${node.nodeId}`,
                        removeOnComplete: true,
                        removeOnFail: true,
                    },
                };
            }),
        );
    }

    public async recordNodeUsage(payload: IRecordNodeUsagePayload) {
        return this.recordNodeUsageQueue.add(NODES_JOB_NAMES.RECORD_NODE_USAGE, payload, {
            jobId: `${NODES_JOB_NAMES.RECORD_NODE_USAGE}-${payload.nodeUuid}`,
            removeOnComplete: true,
            removeOnFail: true,
        });
    }

    public async recordNodeUsageBulk(payload: IRecordNodeUsagePayload[]) {
        return this.recordNodeUsageQueue.addBulk(
            payload.map((node) => {
                return {
                    name: NODES_JOB_NAMES.RECORD_NODE_USAGE,
                    data: node,
                    opts: {
                        jobId: `${NODES_JOB_NAMES.RECORD_NODE_USAGE}-${node.nodeUuid}`,
                        removeOnComplete: true,
                        removeOnFail: true,
                    },
                };
            }),
        );
    }

    public async connectionsByUser(payload: { userId: number }): Promise<{ jobId: string } | null> {
        const result = await this.queryNodesQueue.add(
            NODES_JOB_NAMES.CONNECTIONS_BY_USER,
            payload,
            {
                removeOnComplete: {
                    age: 24 * 3_600,
                },
                removeOnFail: {
                    age: 24 * 3_600,
                },
            },
        );

        if (!result || !result.id) {
            return null;
        }

        return { jobId: result.id };
    }

    public async connectionsByUserResult(jobId: string): Promise<IGetIpsListResult | null> {
        const job = await this.queryNodesQueue.getJob(jobId);
        if (!job) {
            return null;
        }

        const state = await job.getState();
        const isCompleted = state === 'completed';
        const isFailed = state === 'failed';

        let progress: IGetIpsListProgress = {
            total: 0,
            completed: 0,
            percent: 0,
        };

        if (typeof job.progress === 'number' && job.progress === 0) {
            progress.percent = job.progress;
        } else {
            progress = job.progress as IGetIpsListProgress;
        }

        return {
            isCompleted,
            isFailed,
            progress,
            result: isCompleted ? job.returnvalue : null,
        };
    }

    public async connectionsByNode(payload: {
        nodeUuid: string;
    }): Promise<{ jobId: string } | null> {
        const result = await this.queryNodesQueue.add(
            NODES_JOB_NAMES.CONNECTIONS_BY_NODE,
            payload,
            {
                removeOnComplete: {
                    age: 24 * 3_600,
                },
                removeOnFail: {
                    age: 24 * 3_600,
                },
            },
        );

        if (!result || !result.id) {
            return null;
        }

        return { jobId: result.id };
    }

    public async connectionsByNodeResult(jobId: string): Promise<IGetUsersIpsListResult | null> {
        const job = await this.queryNodesQueue.getJob(jobId);
        if (!job) {
            return null;
        }

        const state = await job.getState();
        const isCompleted = state === 'completed';
        const isFailed = state === 'failed';

        return {
            isCompleted,
            isFailed,

            result: isCompleted ? job.returnvalue : null,
        };
    }

    public async geocheckByNode(payload: IGeocheckPayload): Promise<{ jobId: string } | null> {
        const result = await this.queryNodesQueue.add(NODES_JOB_NAMES.GEOCHECK_BY_NODE, payload, {
            removeOnComplete: {
                age: 900,
            },
            removeOnFail: {
                age: 900,
            },
        });

        if (!result || !result.id) {
            return null;
        }

        return { jobId: result.id };
    }

    public async geocheckByNodeResult(jobId: string): Promise<IGeocheckResult | null> {
        const job = await this.queryNodesQueue.getJob(jobId);
        if (!job) {
            return null;
        }

        const state = await job.getState();
        const isCompleted = state === 'completed';
        const isFailed = state === 'failed';

        return {
            isCompleted,
            isFailed,
            result: isCompleted ? job.returnvalue : null,
        };
    }

    public async exportNodeConnectionsBulk(payload: { nodeUuid: string }[]) {
        return this.queryNodesQueue.addBulk(
            payload.map((node) => {
                return {
                    name: NODES_JOB_NAMES.EXPORT_NODE_CONNECTIONS,
                    data: node,
                    opts: {
                        jobId: `${NODES_JOB_NAMES.EXPORT_NODE_CONNECTIONS}-${node.nodeUuid}`,
                        removeOnComplete: true,
                        removeOnFail: true,
                    },
                };
            }),
        );
    }

    public async dropUsersConnections(payload: IDropUsersConnectionsPayload) {
        return this.nodeBulkUsersQueue.add(NODES_JOB_NAMES.DROP_USERS_CONNECTIONS, payload);
    }

    public async dropIpsConnections(payload: IDropIpsConnectionsPayload) {
        return this.nodeBulkUsersQueue.add(NODES_JOB_NAMES.DROP_IPS_CONNECTIONS, payload);
    }

    public async blockIps(payload: IBlockIpsPayload) {
        return this.nodeBulkUsersQueue.add(NODES_JOB_NAMES.BLOCK_IPS, payload);
    }

    public async unblockIps(payload: IUnblockIpsPayload) {
        return this.nodeBulkUsersQueue.add(NODES_JOB_NAMES.UNBLOCK_IPS, payload);
    }

    public async recreateTables(payload: IRecreateTablesPayload) {
        return this.nodeBulkUsersQueue.add(NODES_JOB_NAMES.RECREATE_TABLES, payload);
    }

    public async collectReports(payload: {
        nodeUuid: string;
        connectionOpts: INodeConnectionOpts;
    }) {
        return this.nodePluginsQueue.add(NODES_JOB_NAMES.COLLECT_REPORTS, payload);
    }

    public async syncNodePlugins(payload: { nodeUuid: string }) {
        return this.nodePluginsQueue.add(NODES_JOB_NAMES.SYNC_NODE_PLUGINS, payload);
    }

    public async syncNodePluginsBulk(payload: { nodeUuid: string }[]) {
        return this.nodePluginsQueue.addBulk(
            payload.map((node) => ({
                name: NODES_JOB_NAMES.SYNC_NODE_PLUGINS,
                data: node,
            })),
        );
    }
}
