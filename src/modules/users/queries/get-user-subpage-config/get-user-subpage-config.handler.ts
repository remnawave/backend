import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { GetUserSubpageConfigQuery } from './get-user-subpage-config.query';
import { UsersRepository } from '../../repositories/users.repository';

@QueryHandler(GetUserSubpageConfigQuery)
export class GetUserSubpageConfigHandler implements IQueryHandler<
    GetUserSubpageConfigQuery,
    TResult<string | null>
> {
    private readonly logger = new Logger(GetUserSubpageConfigHandler.name);
    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(query: GetUserSubpageConfigQuery): Promise<TResult<string | null>> {
        try {
            const subpageConfigUuid = await this.usersRepository.getUserSubpageConfigUuid(
                query.shortUuid,
            );

            return ok(subpageConfigUuid);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
