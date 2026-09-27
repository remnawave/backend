import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { GetSystemStatsCommand } from '@remnawave/node-contract';

import { AxiosService, INodeConnectionOpts } from '@common/axios';
import { RawCacheService } from '@common/raw-cache';
import {
    CACHE_KEYS,
    CACHE_KEYS_TTL,
    EVENTS,
    INTERNAL_CACHE_KEYS,
    INTERNAL_CACHE_KEYS_TTL,
} from '@libs/contracts/constants';

import { NodeEvent } from '@integration-modules/notifications/interfaces';

import { UpdateNodeCommand } from '@modules/nodes/commands/update-node';
import { getNodeConnectionState, NodesEntity } from '@modules/nodes/entities/nodes.entity';
import { GetNodeByUuidQuery } from '@modules/nodes/queries/get-node-by-uuid';

import { NodesQueuesService } from '@queue/_nodes';
import { QUEUES_NAMES } from '@queue/queue.enum';

import { NODES_JOB_NAMES } from '../constants/nodes-job-name.constant';
import { INodeHealthCheckPayload } from '../interfaces';

const FAILURE_THRESHOLD = 3;
const RECOVERY_THRESHOLD = 2;

interface IHealthCheckHistory {
    stateSignature: string;
    failures: number;
    successes: number;
}

function matchesConnection(first: INodeConnectionOpts, second: INodeConnectionOpts): boolean {
    return (
        first.address === second.address &&
        first.port === second.port &&
        first.proxyUrl === second.proxyUrl
    );
}

@Processor(QUEUES_NAMES.NODES.HEALTH_CHECK, {
    concurrency: 40,
})
export class NodeHealthCheckQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(NodeHealthCheckQueueProcessor.name);

    constructor(
        private readonly commandBus: CommandBus,
        private readonly eventEmitter: EventEmitter2,
        private readonly axios: AxiosService,
        private readonly nodesQueuesService: NodesQueuesService,
        private readonly rawCacheService: RawCacheService,
        private readonly queryBus: QueryBus,
    ) {
        super();
    }
    async process(job: Job<INodeHealthCheckPayload>) {
        try {
            const { nodeUuid, connectionOpts } = job.data;

            // The scheduler retries on its next tick. A single job per node prevents
            // overlapping probes; Redis keeps confirmation history shared by workers.
            const statResult = await this.axios.getSystemStats(connectionOpts);
            const currentNode = await this.queryBus.execute(new GetNodeByUuidQuery(nodeUuid));

            if (!currentNode.isOk) {
                return;
            }

            const node = currentNode.response;
            const historyKey = INTERNAL_CACHE_KEYS.NODE_HEALTH_CHECK(nodeUuid);

            if (node.isDisabled || !matchesConnection(node, connectionOpts)) {
                await this.rawCacheService.del(historyKey);
                return;
            }

            // A start/configuration operation owns the node while it is connecting.
            if (node.isConnecting) {
                return;
            }

            const stateSignature = JSON.stringify(getNodeConnectionState(node));
            const previous = await this.rawCacheService.get<IHealthCheckHistory>(historyKey);
            const history = previous?.stateSignature === stateSignature ? previous : null;
            const isHealthy = statResult.isOk && statResult.response.xrayInfo !== null;
            const failures = isHealthy
                ? 0
                : Math.min((history?.failures ?? 0) + 1, FAILURE_THRESHOLD);
            const successes = isHealthy
                ? Math.min((history?.successes ?? 0) + 1, RECOVERY_THRESHOLD)
                : 0;

            await this.rawCacheService.set(
                historyKey,
                { stateSignature, failures, successes } satisfies IHealthCheckHistory,
                INTERNAL_CACHE_KEYS_TTL.NODE_HEALTH_CHECK,
            );

            if (isHealthy) {
                return await this.handleConnectedNode(
                    connectionOpts,
                    node,
                    statResult.response,
                    successes,
                );
            }

            const message = statResult.isOk
                ? 'Required info is missing. Outdated version?'
                : (statResult.message ?? 'Unknown error');

            this.logger.warn(
                `Node ${nodeUuid}, ${connectionOpts.address}:${connectionOpts.port} – consecutive failed health checks: ${failures}/${FAILURE_THRESHOLD}, message: ${message}`,
            );

            if (node.isConnected && failures < FAILURE_THRESHOLD) {
                return;
            }

            return await this.handleDisconnectedNode(node, message);
        } catch (error) {
            this.logger.error(
                `Error handling "${NODES_JOB_NAMES.NODE_HEALTH_CHECK}" job: ${error}`,
            );
            return;
        }
    }

    private async handleConnectedNode(
        connectionOpts: INodeConnectionOpts,
        node: NodesEntity,
        stats: GetSystemStatsCommand.Response['response'],
        successes: number,
    ) {
        const { uuid: nodeUuid, isConnected } = node;

        if (stats.xrayInfo === null) {
            return;
        }

        await this.rawCacheService.setMany([
            {
                key: CACHE_KEYS.NODE_SYSTEM_STATS(nodeUuid),
                value: stats.system.stats,
                ttlSeconds: CACHE_KEYS_TTL.NODE_SYSTEM_STATS,
            },
            {
                key: CACHE_KEYS.NODE_XRAY_UPTIME(nodeUuid),
                value: stats.xrayInfo.uptime,
                ttlSeconds: CACHE_KEYS_TTL.NODE_XRAY_UPTIME,
            },
        ]);

        const reports = stats.plugins.torrentBlocker.reportsCount;
        if (reports !== undefined && reports > 0) {
            await this.nodesQueuesService.collectReports({
                nodeUuid,
                connectionOpts,
            });

            this.logger.log(`Node ${nodeUuid} has ${reports} reports, collecting reports...`);
        }

        if (!isConnected) {
            if (successes < RECOVERY_THRESHOLD) {
                return;
            }

            // Persist this before the transition: an enqueue failure must not lose
            // the configuration/user synchronization required after an outage.
            await this.rawCacheService.set(
                INTERNAL_CACHE_KEYS.NODE_HEALTH_CHECK_SYNC_PENDING(nodeUuid),
                true,
            );

            const nodeUpdatedResponse = await this.commandBus.execute(
                new UpdateNodeCommand(
                    {
                        uuid: nodeUuid,
                        isConnected: true,
                        lastStatusChange: new Date(),
                        lastStatusMessage: null,
                    },
                    getNodeConnectionState(node),
                ),
            );

            if (!nodeUpdatedResponse.isOk) {
                return;
            }

            this.eventEmitter.emit(
                EVENTS.NODE.CONNECTION_RESTORED,
                new NodeEvent(nodeUpdatedResponse.response, EVENTS.NODE.CONNECTION_RESTORED),
            );
        }

        // User changes skip disconnected nodes. Sync after restoring visibility;
        // failed synchronization remains pending even while statistics are healthy.
        if (
            await this.rawCacheService.exists(
                INTERNAL_CACHE_KEYS.NODE_HEALTH_CHECK_SYNC_PENDING(nodeUuid),
            )
        ) {
            await this.nodesQueuesService.startNode({ nodeUuid, healthCheck: true });
        }

        return;
    }

    private async handleDisconnectedNode(node: NodesEntity, message: string | undefined) {
        const { uuid: nodeUuid, isConnected } = node;

        await this.rawCacheService.delMany([
            CACHE_KEYS.NODE_SYSTEM_INFO(nodeUuid),
            CACHE_KEYS.NODE_SYSTEM_STATS(nodeUuid),
            CACHE_KEYS.NODE_USERS_ONLINE(nodeUuid),
            CACHE_KEYS.NODE_XRAY_UPTIME(nodeUuid),
        ]);

        const newNodeEntity = await this.commandBus.execute(
            new UpdateNodeCommand(
                {
                    uuid: nodeUuid,
                    ...(isConnected ? { isConnected: false, lastStatusChange: new Date() } : {}),
                    lastStatusMessage: message,
                },
                getNodeConnectionState(node),
            ),
        );

        if (!newNodeEntity.isOk) {
            return;
        }

        if (isConnected) {
            this.eventEmitter.emit(
                EVENTS.NODE.CONNECTION_LOST,
                new NodeEvent(newNodeEntity.response, EVENTS.NODE.CONNECTION_LOST),
            );
        }

        await this.nodesQueuesService.startNode({ nodeUuid, healthCheck: true });

        this.logger.warn(
            `Lost connection to Node ${nodeUuid}, ${newNodeEntity.response.address}:${newNodeEntity.response.port}, message: ${message}`,
        );

        return;
    }
}
