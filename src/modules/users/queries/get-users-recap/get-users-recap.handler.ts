import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { UsersRepository } from '../../repositories/users.repository';
import { GetUsersRecapQuery } from './get-users-recap.query';

@QueryHandler(GetUsersRecapQuery)
export class GetUsersRecapHandler implements IQueryHandler<
    GetUsersRecapQuery,
    TResult<{ total: number; newUsersThisMonth: number }>
> {
    private readonly logger = new Logger(GetUsersRecapHandler.name);
    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(): Promise<TResult<{ total: number; newUsersThisMonth: number }>> {
        try {
            const recap = await this.usersRepository.getUsersRecap();

            return ok({
                total: recap.total,
                newUsersThisMonth: recap.newUsersThisMonth,
            });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
