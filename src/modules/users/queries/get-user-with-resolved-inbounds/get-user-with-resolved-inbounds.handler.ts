import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { UserWithResolvedInboundEntity } from '@modules/users/entities';

import { GetUserWithResolvedInboundsQuery } from './get-user-with-resolved-inbounds.query';
import { UsersRepository } from '../../repositories/users.repository';

@QueryHandler(GetUserWithResolvedInboundsQuery)
export class GetUserWithResolvedInboundsHandler
    implements
        IQueryHandler<
            GetUserWithResolvedInboundsQuery,
            ICommandResponse<UserWithResolvedInboundEntity>
        >
{
    private readonly logger = new Logger(GetUserWithResolvedInboundsHandler.name);
    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(
        query: GetUserWithResolvedInboundsQuery,
    ): Promise<ICommandResponse<UserWithResolvedInboundEntity>> {
        try {
            const user = await this.usersRepository.getUserWithResolvedInbounds(query.userUuid);

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
