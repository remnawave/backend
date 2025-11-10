import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ERRORS } from '@libs/contracts/constants';

import { GetUuidByUsernameQuery } from './get-uuid-by-username.query';
import { UsersRepository } from '../../repositories/users.repository';

@QueryHandler(GetUuidByUsernameQuery)
export class GetUuidByUsernameHandler implements IQueryHandler<GetUuidByUsernameQuery> {
    private readonly logger = new Logger(GetUuidByUsernameHandler.name);
    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(query: GetUuidByUsernameQuery) {
        try {
            const user = await this.usersRepository.getUserUuidByUsername(query.username);

            if (!user) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            return {
                isOk: true,
                response: user,
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
