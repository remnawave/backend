import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { GetUserIdsByUserUuidsQuery } from '@modules/users/queries/get-user-ids-by-user-uuids';
import { GetUserByUniqueFieldQuery } from '@modules/users/queries/get-user-by-unique-field';
import { FindNodesByCriteriaQuery } from '@modules/nodes/queries/find-nodes-by-criteria';
import { NodesEntity } from '@modules/nodes/entities/nodes.entity';

import { NodesQueuesService } from '@queue/_nodes';

import {
    FetchIpsResponseModel,
    FetchIpsResultResponseModel,
} from './models/fetch-user-ips.response.model';
import { DropConnectionsRequestDto } from './dtos';
import { BaseEventResponseModel } from './models';

@Injectable()
export class IpControlService {
    private readonly logger = new Logger(IpControlService.name);
    constructor(
        private readonly queryBus: QueryBus,
        private readonly nodesQueuesService: NodesQueuesService,
    ) {}

    public async fetchUserIps(userUuid: string): Promise<TResult<FetchIpsResponseModel>> {
        try {
            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery({ uuid: userUuid }),
            );
            if (!user.isOk) {
                return fail(ERRORS.USER_NOT_FOUND);
            }

            const result = await this.nodesQueuesService.queryNodes({
                userId: user.response.tId.toString(),
                userUuid: userUuid,
            });

            if (!result) {
                return fail(ERRORS.JOB_CREATION_FAILED);
            }

            return ok(new FetchIpsResponseModel({ jobId: result.jobId }));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.JOB_CREATION_FAILED);
        }
    }

    public async getFetchIpsResult(jobId: string): Promise<TResult<FetchIpsResultResponseModel>> {
        try {
            const result = await this.nodesQueuesService.getIpsListResult(jobId);
            if (!result) {
                return fail(ERRORS.JOB_RESULT_FETCH_FAILED);
            }

            return ok(new FetchIpsResultResponseModel(result));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.JOB_RESULT_FETCH_FAILED);
        }
    }

    public async dropConnections(
        data: DropConnectionsRequestDto,
    ): Promise<TResult<BaseEventResponseModel>> {
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

            if (data.targetNodes.target === 'allNodes') {
                nodes = findResult.response;
            } else {
                const { nodeUuids } = data.targetNodes;
                nodes = findResult.response.filter((node) => nodeUuids.includes(node.uuid));
            }

            if (nodes.length === 0) {
                return fail(ERRORS.CONNECTED_NODES_NOT_FOUND);
            }

            switch (data.dropBy.by) {
                case 'userUuids':
                    const userIds = await this.queryBus.execute(
                        new GetUserIdsByUserUuidsQuery(data.dropBy.userUuids),
                    );
                    if (!userIds.isOk) {
                        return fail(ERRORS.USER_NOT_FOUND);
                    }

                    for (const node of nodes) {
                        await this.nodesQueuesService.dropUsersConnections({
                            data: {
                                userIds: userIds.response.map((userId) => userId.toString()),
                            },
                            node: {
                                address: node.address,
                                port: node.port,
                            },
                        });
                    }

                    break;
                case 'ipAddresses':
                    for (const node of nodes) {
                        await this.nodesQueuesService.dropIpsConnections({
                            data: {
                                ips: data.dropBy.ipAddresses,
                            },
                            node: {
                                address: node.address,
                                port: node.port,
                            },
                        });
                    }
                    break;
            }

            return ok(new BaseEventResponseModel(true));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
