import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ERRORS } from '@libs/contracts/constants';

import { GetUsersByExpireAtQuery } from './get-users-by-expire-at.query';
import { UsersRepository } from '../../repositories/users.repository';

@QueryHandler(GetUsersByExpireAtQuery)
export class GetUsersByExpireAtHandler implements IQueryHandler<GetUsersByExpireAtQuery> {
    private readonly logger = new Logger(GetUsersByExpireAtHandler.name);
    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(query: GetUsersByExpireAtQuery) {
        try {
            const users = await this.usersRepository.findUsersByExpireAt(query.start, query.end);

            return {
                isOk: true,
                response: users,
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
