import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodesEntity } from '@modules/nodes/entities/nodes.entity';
import { FindNodesByCriteriaQuery } from '@modules/nodes/queries/find-nodes-by-criteria';
import { GetNodeByUuidQuery } from '@modules/nodes/queries/get-node-by-uuid';
import { GetUserByUniqueFieldQuery } from '@modules/users/queries/get-user-by-unique-field';

import { NodesQueuesService } from '@queue/_nodes';

import { DropConnectionsBodyDto, GeocheckByNodeBodyDto } from './dtos';
import {
    ConnectionsByNodeResponseModel,
    ConnectionsByNodeResultResponseModel,
    GeocheckByNodeResponseModel,
    GeocheckByNodeResultResponseModel,
} from './models';
import {
    ConnectionsByUserResponseModel,
    ConnectionsByUserResultResponseModel,
} from './models/connections-by-user.response.model';

@Injectable()
export class ConnectionsService {
    private readonly logger = new Logger(ConnectionsService.name);
    constructor(
        private readonly queryBus: QueryBus,
        private readonly nodesQueuesService: NodesQueuesService,
    ) {}

    public async connectionsByUser(
        userId: number,
    ): Promise<TResult<ConnectionsByUserResponseModel>> {
        try {
            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery({ id: BigInt(userId) }),
            );
            if (!user.isOk) {
                return fail(ERRORS.USER_NOT_FOUND);
            }

            const result = await this.nodesQueuesService.connectionsByUser({
                userId: Number(user.response.id),
            });

            if (!result) {
                return fail(ERRORS.JOB_CREATION_FAILED);
            }

            return ok(new ConnectionsByUserResponseModel({ jobId: result.jobId }));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.JOB_CREATION_FAILED);
        }
    }

    public async connectionsByUserResult(
        jobId: string,
    ): Promise<TResult<ConnectionsByUserResultResponseModel>> {
        try {
            const result = await this.nodesQueuesService.connectionsByUserResult(jobId);
            if (!result) {
                return fail(ERRORS.JOB_RESULT_FETCH_FAILED);
            }

            return ok(new ConnectionsByUserResultResponseModel(result));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.JOB_RESULT_FETCH_FAILED);
        }
    }

    public async dropConnections(dto: DropConnectionsBodyDto): Promise<TResult<boolean>> {
        try {
            const findResult = await this.queryBus.execute(
                new FindNodesByCriteriaQuery({
                    isDisabled: false,
                    isConnected: true,
                    isConnecting: false,
                }),
            );

            if (!findResult.isOk || findResult.response.length === 0) {
                return fail(ERRORS.CONNECTED_NODES_NOT_FOUND);
            }

            let nodes: NodesEntity[] = [];

            if (dto.targetNodes.target === 'allNodes') {
                nodes = findResult.response;
            } else {
                const { nodeUuids } = dto.targetNodes;
                nodes = findResult.response.filter((node) => nodeUuids.includes(node.uuid));
            }

            if (nodes.length === 0) {
                return fail(ERRORS.CONNECTED_NODES_NOT_FOUND);
            }

            switch (dto.dropBy.by) {
                case 'userIds':
                    for (const node of nodes) {
                        await this.nodesQueuesService.dropUsersConnections({
                            data: {
                                userIds: dto.dropBy.userIds.map((userId) => userId.toString()),
                            },
                            node: {
                                address: node.address,
                                port: node.port,
                                proxyUrl: node.proxyUrl,
                            },
                        });
                    }

                    break;
                case 'ipAddresses':
                    for (const node of nodes) {
                        await this.nodesQueuesService.dropIpsConnections({
                            data: {
                                ips: dto.dropBy.ipAddresses,
                            },
                            node: {
                                address: node.address,
                                port: node.port,
                                proxyUrl: node.proxyUrl,
                            },
                        });
                    }
                    break;
            }

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    public async connectionsByNode(
        nodeUuid: string,
    ): Promise<TResult<ConnectionsByNodeResponseModel>> {
        try {
            const node = await this.queryBus.execute(new GetNodeByUuidQuery(nodeUuid));
            if (!node.isOk) {
                return fail(ERRORS.NODE_NOT_FOUND);
            }

            const result = await this.nodesQueuesService.connectionsByNode({
                nodeUuid: nodeUuid,
            });

            if (!result) {
                return fail(ERRORS.JOB_CREATION_FAILED);
            }

            return ok(new ConnectionsByNodeResponseModel({ jobId: result.jobId }));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.JOB_CREATION_FAILED);
        }
    }

    public async connectionsByNodeResult(
        jobId: string,
    ): Promise<TResult<ConnectionsByNodeResultResponseModel>> {
        try {
            const result = await this.nodesQueuesService.connectionsByNodeResult(jobId);
            if (!result) {
                return fail(ERRORS.JOB_RESULT_FETCH_FAILED);
            }

            return ok(new ConnectionsByNodeResultResponseModel(result));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.JOB_RESULT_FETCH_FAILED);
        }
    }

    public async geocheckByNode(
        nodeUuid: string,
        dto: GeocheckByNodeBodyDto,
    ): Promise<TResult<GeocheckByNodeResponseModel>> {
        try {
            const node = await this.queryBus.execute(new GetNodeByUuidQuery(nodeUuid));
            if (!node.isOk) {
                return fail(ERRORS.NODE_NOT_FOUND);
            }

            const result = await this.nodesQueuesService.geocheckByNode({
                nodeUuid,
                ip: dto.ip,
                interface: dto.interface,
            });

            if (!result) {
                return fail(ERRORS.JOB_CREATION_FAILED);
            }

            return ok(new GeocheckByNodeResponseModel({ jobId: result.jobId }));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.JOB_CREATION_FAILED);
        }
    }

    public async geocheckByNodeResult(
        jobId: string,
    ): Promise<TResult<GeocheckByNodeResultResponseModel>> {
        try {
            const result = await this.nodesQueuesService.geocheckByNodeResult(jobId);
            if (!result) {
                return fail(ERRORS.JOB_RESULT_FETCH_FAILED);
            }

            return ok(new GeocheckByNodeResultResponseModel(result));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.JOB_RESULT_FETCH_FAILED);
        }
    }
}
