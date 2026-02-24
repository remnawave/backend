import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { GetUserIdsByUserUuidsQuery } from './get-user-ids-by-user-uuids.query';
import { UsersRepository } from '../../repositories/users.repository';

@QueryHandler(GetUserIdsByUserUuidsQuery)
export class GetUserIdsByUserUuidsHandler implements IQueryHandler<
    GetUserIdsByUserUuidsQuery,
    TResult<bigint[]>
> {
    private readonly logger = new Logger(GetUserIdsByUserUuidsHandler.name);
    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(query: GetUserIdsByUserUuidsQuery): Promise<TResult<bigint[]>> {
        try {
            const userIds = await this.usersRepository.getUserIdsByUuids(query.userUuids);

            return ok(userIds);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
