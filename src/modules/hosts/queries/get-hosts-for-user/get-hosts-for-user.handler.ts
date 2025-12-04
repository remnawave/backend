import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { HostsRepository } from '../../repositories/hosts.repository';
import { GetHostsForUserQuery } from './get-hosts-for-user.query';

@QueryHandler(GetHostsForUserQuery)
export class GetHostsForUserHandler implements IQueryHandler<GetHostsForUserQuery> {
    private readonly logger = new Logger(GetHostsForUserHandler.name);
    constructor(private readonly hostsRepository: HostsRepository) {}

    async execute(query: GetHostsForUserQuery) {
        try {
            const hosts = await this.hostsRepository.findActiveHostsByUserId(
                query.userId,
                query.returnDisabledHosts,
                query.returnHiddenHosts,
            );

            return ok(hosts);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
