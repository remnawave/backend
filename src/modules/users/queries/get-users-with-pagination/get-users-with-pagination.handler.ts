import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { UserEntity } from '@modules/users/entities/user.entity';

import { GetUsersWithPaginationQuery } from './get-users-with-pagination.query';
import { UsersRepository } from '../../repositories/users.repository';

@QueryHandler(GetUsersWithPaginationQuery)
export class GetUsersWithPaginationHandler implements IQueryHandler<
    GetUsersWithPaginationQuery,
    ICommandResponse<{ users: UserEntity[]; total: number }>
> {
    private readonly logger = new Logger(GetUsersWithPaginationHandler.name);
    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(
        query: GetUsersWithPaginationQuery,
    ): Promise<ICommandResponse<{ users: UserEntity[]; total: number }>> {
        try {
            const [users, total] = await this.usersRepository.getUsersWithPagination(query);

            return {
                isOk: true,
                response: {
                    users,
                    total,
                },
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
