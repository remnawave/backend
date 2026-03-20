import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { UsersRepository } from '../../repositories/users.repository';
import { GetUserIdByUuidQuery } from './get-user-id-by-uuid.query';

@QueryHandler(GetUserIdByUuidQuery)
export class GetUserIdByUuidHandler implements IQueryHandler<GetUserIdByUuidQuery> {
    private readonly logger = new Logger(GetUserIdByUuidHandler.name);
    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(query: GetUserIdByUuidQuery) {
        try {
            const userId = await this.usersRepository.getUserIdByUuid(query.uuid);

            if (!userId) {
                return ok(null);
            }

            return ok(userId);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
