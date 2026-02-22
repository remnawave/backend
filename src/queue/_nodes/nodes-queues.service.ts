import { Queue } from 'bullmq';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { IGetEnabledNodesPartialResponse } from '@modules/nodes/queries/get-enabled-nodes-partial/get-enabled-nodes-partial.query';

import { QUEUES_NAMES } from '@queue/queue.enum';

import {
    IAddUsersToNodePayload,
    IAddUserToNodePayload,
    IGetIpsListProgress,
    IGetIpsListResult,
    INodeHealthCheckPayload,
    IRecordNodeUsagePayload,
    IRecordUserUsagePayload,
    IRemoveUserFromNodePayload,
    IRemoveUsersFromNodePayload,
} from './interfaces';
import { NODES_JOB_NAMES } from './constants/nodes-job-name.constant';

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
        } as const;
    }

    async onApplicationBootstrap(): Promise<void> {
        for (const queue of Object.values(this.queues)) {
            const client = await queue.client;
            if (client.status !== 'ready') {
                throw new Error(`Queue "${queue.name}" not connected: ${client.status}.`);
            }
        }

        this.logger.log(`${Object.values(this.queues).length} queues are connected.`);

        await this.startAllNodesByProfileQueue.setGlobalConcurrency(3);
        await this.startAllNodesQueue.setGlobalConcurrency(1);
    }

    public async startNode(payload: { nodeUuid: string }) {
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
                        nodeAddress: node.address,
                        nodePort: node.port,
                        isConnected: node.isConnected,
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

    public async queryNodes(payload: {
        userId: string;
        userUuid: string;
    }): Promise<{ jobId: string } | null> {
        const result = await this.queryNodesQueue.add(NODES_JOB_NAMES.FETCH_IPS_LIST, payload, {
            removeOnComplete: {
                age: 24 * 3_600,
            },
            removeOnFail: {
                age: 24 * 3_600,
            },
        });

        if (!result || !result.id) {
            return null;
        }

        return { jobId: result.id };
    }

    public async getIpsListResult(jobId: string): Promise<IGetIpsListResult | null> {
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
}
