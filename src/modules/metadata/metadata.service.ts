import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants/errors';

import { GetUserIdByUuidQuery } from '@modules/users/queries/get-user-id-by-uuid';
import { GetNodeIdByUuidQuery } from '@modules/nodes/queries/get-node-id-by-uuid';

import { BaseMetadataResponseModel } from './models/base-metadata.response.model';
import { UserMetadataRepository } from './repositories/user-metadata.repository';
import { NodeMetadataRepository } from './repositories/node-metadata.repository';
import { NodeMetadataEntity, UserMetadataEntity } from './entities';

@Injectable()
export class MetadataService {
    private readonly logger = new Logger(MetadataService.name);

    constructor(
        private readonly userMetadataRepository: UserMetadataRepository,
        private readonly nodeMetadataRepository: NodeMetadataRepository,
        private readonly queryBus: QueryBus,
    ) {}

    public async getUserMetadata(userUuid: string): Promise<TResult<BaseMetadataResponseModel>> {
        try {
            const userId = await this.queryBus.execute(new GetUserIdByUuidQuery(userUuid));

            if (!userId.isOk) {
                return fail(ERRORS.INTERNAL_SERVER_ERROR);
            }

            if (userId.response === null) {
                return fail(ERRORS.USER_NOT_FOUND);
            }

            const userMetadata = await this.userMetadataRepository.getByUserId(userId.response);

            if (userMetadata === null) {
                return fail(ERRORS.METADATA_NOT_FOUND);
            }

            return ok(new BaseMetadataResponseModel(userMetadata));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    public async upsertUserMetadata(
        userUuid: string,
        metadata: unknown,
    ): Promise<TResult<BaseMetadataResponseModel>> {
        try {
            const userId = await this.queryBus.execute(new GetUserIdByUuidQuery(userUuid));

            if (!userId.isOk) {
                return fail(ERRORS.INTERNAL_SERVER_ERROR);
            }

            if (userId.response === null) {
                return fail(ERRORS.USER_NOT_FOUND);
            }

            const userMetadata = await this.userMetadataRepository.upsert(
                new UserMetadataEntity({ userId: userId.response, metadata }),
            );

            return ok(new BaseMetadataResponseModel(userMetadata));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    public async getNodeMetadata(nodeUuid: string): Promise<TResult<BaseMetadataResponseModel>> {
        try {
            const nodeId = await this.queryBus.execute(new GetNodeIdByUuidQuery(nodeUuid));

            if (!nodeId.isOk) {
                return fail(ERRORS.INTERNAL_SERVER_ERROR);
            }

            if (nodeId.response === null) {
                return fail(ERRORS.NODE_NOT_FOUND);
            }

            const nodeMetadata = await this.nodeMetadataRepository.getByNodeId(nodeId.response);

            if (nodeMetadata === null) {
                return fail(ERRORS.METADATA_NOT_FOUND);
            }

            return ok(new BaseMetadataResponseModel(nodeMetadata));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    public async upsertNodeMetadata(
        nodeUuid: string,
        metadata: unknown,
    ): Promise<TResult<BaseMetadataResponseModel>> {
        try {
            const nodeId = await this.queryBus.execute(new GetNodeIdByUuidQuery(nodeUuid));

            if (!nodeId.isOk) {
                return fail(ERRORS.INTERNAL_SERVER_ERROR);
            }

            if (nodeId.response === null) {
                return fail(ERRORS.NODE_NOT_FOUND);
            }

            const nodeMetadata = await this.nodeMetadataRepository.upsert(
                new NodeMetadataEntity({ nodeId: nodeId.response, metadata }),
            );

            return ok(new BaseMetadataResponseModel(nodeMetadata));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
