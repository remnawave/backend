import { Queue } from 'bullmq';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { NodesEntity } from '@modules/nodes';

import { QUEUES_NAMES } from '@queue/queue.enum';

import {
    IAddUserToNodePayload,
    INodeHealthCheckPayload,
    IRecordNodeUsagePayload,
    IRecordUserUsagePayload,
    IRemoveUserFromNodePayload,
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

    public async checkNodeHealthBulk(payload: NodesEntity[]) {
        return this.nodeHealthCheckQueue.addBulk(
            payload.map((node) => {
                return {
                    name: NODES_JOB_NAMES.NODE_HEALTH_CHECK,
                    data: {
                        nodeUuid: node.uuid,
                        nodeAddress: node.address,
                        nodePort: node.port,
                        isConnected: node.isConnected,
                        isConnecting: node.isConnecting,
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

    public async startAllNodesByProfile(payload: {
        emitter: string;
        profileUuid: string;
        force?: boolean;
    }) {
        return this.startAllNodesByProfileQueue.add(NODES_JOB_NAMES.START_ALL_BY_PROFILE, payload, {
            // jobId: `${StartAllNodesByProfileJobNames.startAllNodesByProfile}-${payload.profileUuid}`,
            // removeOnComplete: true,
            // removeOnFail: true,

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
}
