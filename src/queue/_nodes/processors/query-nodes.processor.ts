import { Job } from 'bullmq';
import pMap from 'p-map';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { AxiosService } from '@common/axios/axios.service';
import { TypedConfigService } from '@common/config/app-config';
import { buildClientEmail, parseClientEmail } from '@common/helpers/xray-config/client-email';
import { RawCacheService } from '@common/raw-cache';
import { EXPORT_TO_STREAM_KEYS } from '@libs/contracts/constants';
import { NODE_CONNECTIONS_STREAM_MESSAGE_VERSION } from '@libs/contracts/models';

import { NodesEntity } from '@modules/nodes';
import { FindNodesByCriteriaQuery } from '@modules/nodes/queries/find-nodes-by-criteria';
import { GetNodeByUuidQuery } from '@modules/nodes/queries/get-node-by-uuid';

import { QUEUES_NAMES } from '../../queue.enum';
import { NODES_JOB_NAMES } from '../constants';
import { IGeocheckJobResult, IGeocheckPayload, IGetIpsListResult } from '../interfaces';

@Processor(
    {
        name: QUEUES_NAMES.NODES.QUERY_NODES,
    },
    {
        concurrency: 10,
    },
)
export class QueryNodesQueueProcessor extends WorkerHost implements OnApplicationBootstrap {
    private static readonly CONNECTIONS_EXPORT_MAX_AGE_MS = 3_600_000; // 1 hour

    private readonly logger = new Logger(QueryNodesQueueProcessor.name);
    private readonly CONCURRENCY: number;
    private readonly exportToStreamEnabled: boolean;

    constructor(
        private readonly axios: AxiosService,
        private readonly queryBus: QueryBus,
        private readonly rawCacheService: RawCacheService,
        private readonly configService: TypedConfigService,
    ) {
        super();
        this.CONCURRENCY = 20;

        this.exportToStreamEnabled = this.configService.getOrThrow('EXPORT_TO_STREAM_ENABLED');
    }

    onApplicationBootstrap() {
        if (this.exportToStreamEnabled) {
            this.logger.log(
                `[STREAM] key "${EXPORT_TO_STREAM_KEYS.PREFIX}${EXPORT_TO_STREAM_KEYS.NODE_CONNECTIONS}", retention ${QueryNodesQueueProcessor.CONNECTIONS_EXPORT_MAX_AGE_MS / 60_000} min.`,
            );
        }
    }

    async process(job: Job) {
        switch (job.name) {
            case NODES_JOB_NAMES.CONNECTIONS_BY_USER:
                return await this.handleConnectionsByUser(job);
            case NODES_JOB_NAMES.CONNECTIONS_BY_NODE:
                return await this.handleConnectionsByNode(job);
            case NODES_JOB_NAMES.GEOCHECK_BY_NODE:
                return await this.handleGeocheckByNode(job);
            case NODES_JOB_NAMES.EXPORT_NODE_CONNECTIONS:
                return await this.handleExportNodeConnectionsJob(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleConnectionsByUser(job: Job<{ userId: number }>) {
        try {
            const findNodesByCriteriaResult = await this.queryBus.execute(
                new FindNodesByCriteriaQuery({
                    isDisabled: false,
                    isConnected: true,
                    isConnecting: false,
                }),
            );

            if (!findNodesByCriteriaResult.isOk) {
                return {
                    success: false,
                    userId: job.data.userId,
                    nodes: [],
                };
            }

            const { response: nodes } = findNodesByCriteriaResult;

            if (nodes.length === 0) {
                return {
                    success: true,
                    userId: job.data.userId,
                    nodes: [],
                };
            }

            let nodesCompleted = 0;

            const mapper = async (node: NodesEntity) => {
                try {
                    // Query each active inbound because Xray stores per-inbound emails.
                    const usernames =
                        node.activeInbounds.length > 0
                            ? node.activeInbounds.map((inbound) =>
                                  buildClientEmail(BigInt(job.data.userId), inbound.uuid),
                              )
                            : [job.data.userId.toString()];

                    const ipsByAddress = new Map<string, Date>();

                    const ipsListResponses = await Promise.all(
                        usernames.map((username) =>
                            this.axios.getIpsList(
                                { userId: username },
                                {
                                    address: node.address,
                                    port: node.port,
                                    proxyUrl: node.proxyUrl,
                                },
                            ),
                        ),
                    );

                    for (const ipsListResponse of ipsListResponses) {
                        if (!ipsListResponse.isOk || !ipsListResponse.response.ips.length) {
                            continue;
                        }

                        const ips = ipsListResponse.response.ips;

                        if (ips.length > 0 && typeof ips[0] === 'string') {
                            for (const ip of ips as unknown as string[]) {
                                if (!ipsByAddress.has(ip)) {
                                    ipsByAddress.set(ip, new Date(0));
                                }
                            }
                        } else {
                            for (const ip of ips) {
                                const existing = ipsByAddress.get(ip.ip);
                                const lastSeen = new Date(ip.lastSeen);
                                if (!existing || lastSeen > existing) {
                                    ipsByAddress.set(ip.ip, lastSeen);
                                }
                            }
                        }
                    }

                    if (ipsByAddress.size === 0) {
                        return;
                    }

                    const formattedIps = [...ipsByAddress.entries()]
                        .map(([ip, lastSeen]) => ({ ip, lastSeen }))
                        .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());

                    return {
                        nodeUuid: node.uuid,
                        nodeName: node.name,
                        countryCode: node.countryCode,
                        ips: formattedIps,
                    };
                } catch (error) {
                    this.logger.warn(`Failed to fetch IPs from node ${node.uuid}: ${error}`);
                } finally {
                    nodesCompleted++;
                    await job.updateProgress({
                        total: nodes.length,
                        completed: nodesCompleted,
                        percent: Math.round((nodesCompleted / nodes.length) * 100),
                    });
                }
            };

            const mapped = await pMap(nodes, mapper, { concurrency: this.CONCURRENCY });

            const result = mapped.filter((node) => node !== undefined);

            return {
                success: true,
                userId: job.data.userId,
                nodes: result,
            } satisfies IGetIpsListResult['result'];
        } catch (error) {
            this.logger.error(`Failed to fetch IPs list: ${error}`);
            return {
                success: false,
                userId: job.data.userId,
                nodes: [],
            };
        }
    }

    private async handleConnectionsByNode(job: Job<{ nodeUuid: string }>) {
        try {
            const nodeResult = await this.queryBus.execute(
                new GetNodeByUuidQuery(job.data.nodeUuid),
            );
            if (!nodeResult.isOk) {
                return {
                    success: false,
                    nodeUuid: job.data.nodeUuid,
                    users: [],
                };
            }

            if (!nodeResult.response.isConnected) {
                return {
                    success: false,
                    nodeUuid: job.data.nodeUuid,
                    users: [],
                };
            }

            const result = await this.axios.getUsersIpsList({
                address: nodeResult.response.address,
                port: nodeResult.response.port,
                proxyUrl: nodeResult.response.proxyUrl,
            });

            if (!result.isOk) {
                return {
                    success: false,
                    nodeUuid: job.data.nodeUuid,
                    users: [],
                };
            }

            // Merge IPs from multiple per-inbound identities into one user result.
            const ipsByUser = new Map<number, Map<string, Date>>();

            for (const user of result.response.users) {
                const { userId: parsedUserId } = parseClientEmail(user.userId);
                const userId = Number(parsedUserId);
                if (!Number.isFinite(userId)) continue;

                let ipsByAddress = ipsByUser.get(userId);
                if (!ipsByAddress) {
                    ipsByAddress = new Map();
                    ipsByUser.set(userId, ipsByAddress);
                }

                for (const ip of user.ips) {
                    const lastSeen = new Date(ip.lastSeen);
                    const existing = ipsByAddress.get(ip.ip);
                    if (!existing || lastSeen > existing) {
                        ipsByAddress.set(ip.ip, lastSeen);
                    }
                }
            }

            return {
                success: true,
                nodeUuid: job.data.nodeUuid,
                users: [...ipsByUser.entries()]
                    .map(([userId, ipsByAddress]) => ({
                        userId,
                        ips: [...ipsByAddress.entries()]
                            .map(([ip, lastSeen]) => ({ ip, lastSeen }))
                            .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime()),
                    }))
                    .sort((a, b) => a.userId - b.userId),
            };
        } catch (error) {
            this.logger.error(`Failed to fetch users IPs list: ${error}`);
            return {
                success: false,
                nodeUuid: job.data.nodeUuid,
                users: [],
            };
        }
    }

    private async handleGeocheckByNode(job: Job<IGeocheckPayload>): Promise<IGeocheckJobResult> {
        const { nodeUuid, ip, interface: networkInterface } = job.data;

        const failed = (message: string): IGeocheckJobResult => ({
            success: false,
            nodeUuid,
            image: null,
            rawReport: null,
            message,
        });

        try {
            const nodeResult = await this.queryBus.execute(new GetNodeByUuidQuery(nodeUuid));

            if (!nodeResult.isOk) {
                return failed('Node not found.');
            }

            const result = await this.axios.getGeocheck(
                { ip, interface: networkInterface },
                {
                    address: nodeResult.response.address,
                    port: nodeResult.response.port,
                    proxyUrl: nodeResult.response.proxyUrl,
                },
            );

            if (!result.isOk) {
                return failed(result.message ?? 'Node did not return a geocheck.');
            }

            const { image, ...rawReport } = result.response;

            return {
                success: true,
                nodeUuid,
                image,
                rawReport,
                message: null,
            };
        } catch (error) {
            this.logger.error(`Failed to fetch geocheck for node ${nodeUuid}: ${error}`);

            return failed(error instanceof Error ? error.message : String(error));
        }
    }

    private async handleExportNodeConnectionsJob(job: Job<{ nodeUuid: string }>): Promise<void> {
        try {
            if (!this.exportToStreamEnabled) {
                return;
            }

            const nodeResult = await this.queryBus.execute(
                new GetNodeByUuidQuery(job.data.nodeUuid),
            );

            if (!nodeResult.isOk || !nodeResult.response.isConnected) {
                return;
            }

            const result = await this.axios.getUsersIpsList({
                address: nodeResult.response.address,
                port: nodeResult.response.port,
                proxyUrl: nodeResult.response.proxyUrl,
            });

            if (!result.isOk || !result.response.users.length) {
                return;
            }

            const users = result.response.users
                .map((user) => ({
                    ...user,
                    userId: parseClientEmail(user.userId).userId,
                }))
                .filter((user) => {
                    try {
                        BigInt(user.userId);
                        return true;
                    } catch {
                        return false;
                    }
                });

            await this.rawCacheService.xaddTrimmedByAge(
                EXPORT_TO_STREAM_KEYS.NODE_CONNECTIONS,
                QueryNodesQueueProcessor.CONNECTIONS_EXPORT_MAX_AGE_MS,
                {
                    v: NODE_CONNECTIONS_STREAM_MESSAGE_VERSION,
                    nodeId: nodeResult.response.id.toString(),
                    ts: new Date().toISOString(),
                    users: JSON.stringify(users),
                },
            );
        } catch (error) {
            this.logger.error(`Failed to export node connections to stream: ${error}`);
        }
    }
}
