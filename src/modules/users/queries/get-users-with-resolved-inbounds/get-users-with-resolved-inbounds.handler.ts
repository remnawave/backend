import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { GetUsersWithResolvedInboundsQuery } from './get-users-with-resolved-inbounds.query';
import { UsersRepository } from '../../repositories/users.repository';

@QueryHandler(GetUsersWithResolvedInboundsQuery)
export class GetUsersWithResolvedInboundsHandler implements IQueryHandler<GetUsersWithResolvedInboundsQuery> {
    private readonly logger = new Logger(GetUsersWithResolvedInboundsHandler.name);
    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(query: GetUsersWithResolvedInboundsQuery) {
        try {
            const users = await this.usersRepository.getUsersWithResolvedInbounds(query.tIds);

            return ok(users);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
