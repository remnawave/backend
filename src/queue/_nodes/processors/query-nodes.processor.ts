import { Job } from 'bullmq';
import pMap from 'p-map';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Scope } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { AxiosService } from '@common/axios/axios.service';

import { FindNodesByCriteriaQuery } from '@modules/nodes/queries/find-nodes-by-criteria';
import { GetNodeByUuidQuery } from '@modules/nodes/queries/get-node-by-uuid';
import { NodesEntity } from '@modules/nodes';

import { QUEUES_NAMES } from '../../queue.enum';
import { NODES_JOB_NAMES } from '../constants';

@Processor(
    {
        name: QUEUES_NAMES.NODES.QUERY_NODES,
        scope: Scope.REQUEST,
    },
    {
        concurrency: 5,
    },
)
export class QueryNodesQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(QueryNodesQueueProcessor.name);
    private readonly CONCURRENCY: number;

    constructor(
        private readonly axios: AxiosService,
        private readonly queryBus: QueryBus,
    ) {
        super();
        this.CONCURRENCY = 20;
    }

    async process(job: Job) {
        switch (job.name) {
            case NODES_JOB_NAMES.FETCH_IPS_LIST:
                return await this.handleFetchIpsList(job);
            case NODES_JOB_NAMES.FETCH_USERS_IPS_LIST:
                return await this.handleFetchUsersIpsList(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleFetchIpsList(job: Job<{ userId: string; userUuid: string }>) {
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
                    userUuid: job.data.userUuid,
                    nodes: [],
                };
            }

            const { response: nodes } = findNodesByCriteriaResult;

            if (nodes.length === 0) {
                return {
                    success: true,
                    userId: job.data.userId,
                    userUuid: job.data.userUuid,
                    nodes: [],
                };
            }

            let nodesCompleted = 0;

            const mapper = async (node: NodesEntity) => {
                try {
                    const ipsListResponse = await this.axios.getIpsList(
                        { userId: job.data.userId },
                        node.address,
                        node.port,
                    );

                    if (!ipsListResponse.isOk || !ipsListResponse.response.response.ips.length) {
                        return;
                    }

                    const ips = ipsListResponse.response.response.ips;
                    let formattedIps: { ip: string; lastSeen: Date }[] = [];

                    if (ips.length > 0 && typeof ips[0] === 'string') {
                        formattedIps = (ips as unknown as string[]).map((ip) => ({
                            ip,
                            lastSeen: new Date(0),
                        }));
                    } else {
                        formattedIps = ips
                            .map((ip) => ({ ip: ip.ip, lastSeen: ip.lastSeen }))
                            .sort(
                                (a, b) =>
                                    new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime(),
                            );
                    }

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
                userUuid: job.data.userUuid,
                nodes: result,
            };
        } catch (error) {
            this.logger.error(`Failed to fetch IPs list: ${error}`);
            return {
                success: false,
                userId: job.data.userId,
                userUuid: job.data.userUuid,
                nodes: [],
            };
        }
    }

    private async handleFetchUsersIpsList(job: Job<{ nodeUuid: string }>) {
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

            const result = await this.axios.getUsersIpsList(
                nodeResult.response.address,
                nodeResult.response.port,
            );

            if (!result.isOk) {
                return {
                    success: false,
                    nodeUuid: job.data.nodeUuid,
                    users: [],
                };
            }

            const collator = new Intl.Collator(undefined, { numeric: true });

            return {
                success: true,
                nodeUuid: job.data.nodeUuid,
                users: result.response.response.users.sort((a, b) =>
                    collator.compare(a.userId, b.userId),
                ),
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
}
