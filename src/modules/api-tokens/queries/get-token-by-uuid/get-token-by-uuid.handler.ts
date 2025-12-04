import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { ApiTokensRepository } from '../../repositories/api-tokens.repository';
import { ApiTokenEntity } from '../../entities/api-token.entity';
import { GetTokenByUuidQuery } from './get-token-by-uuid.query';

@QueryHandler(GetTokenByUuidQuery)
export class GetTokenByUuidHandler implements IQueryHandler<
    GetTokenByUuidQuery,
    TResult<ApiTokenEntity>
> {
    private readonly logger = new Logger(GetTokenByUuidHandler.name);
    constructor(private readonly apiTokenRepository: ApiTokensRepository) {}

    async execute(query: GetTokenByUuidQuery): Promise<TResult<ApiTokenEntity>> {
        try {
            const token = await this.apiTokenRepository.findFirstByCriteria({
                uuid: query.uuid,
            });

            if (!token) {
                return {
                    isOk: false,
                };
            }
            return {
                isOk: true,
                response: token,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }
}
