import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { HostsEntity } from '@modules/hosts';

import { HostsRepository } from '../../repositories/hosts.repository';
import { GetHostsForUserQuery } from './get-hosts-for-user.query';

@QueryHandler(GetHostsForUserQuery)
export class GetHostsForUserHandler implements IQueryHandler<
    GetHostsForUserQuery,
    ICommandResponse<HostsEntity[]>
> {
    private readonly logger = new Logger(GetHostsForUserHandler.name);
    constructor(private readonly hostsRepository: HostsRepository) {}

    async execute(query: GetHostsForUserQuery): Promise<ICommandResponse<HostsEntity[]>> {
        try {
            const hosts = await this.hostsRepository.findActiveHostsByUserUuid(
                query.userUuid,
                query.returnDisabledHosts,
                query.returnHiddenHosts,
            );

            return {
                isOk: true,
                response: hosts,
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
