import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodeIntegrationRepository } from '../../repositories/node-integrations.repository';
import {
    resolveIntegrationConfig,
    TNodeIntegrationsPayload,
} from '../../utils/merge-node-integrations.util';
import { GetResolvedIntegrationsQuery } from './get-resolved-integrations.query';

@QueryHandler(GetResolvedIntegrationsQuery)
export class GetResolvedIntegrationsHandler implements IQueryHandler<
    GetResolvedIntegrationsQuery,
    TResult<Map<string, TNodeIntegrationsPayload>>
> {
    private readonly logger = new Logger(GetResolvedIntegrationsHandler.name);

    constructor(private readonly nodeIntegrationRepository: NodeIntegrationRepository) {}

    async execute(
        query: GetResolvedIntegrationsQuery,
    ): Promise<TResult<Map<string, TNodeIntegrationsPayload>>> {
        try {
            const integrations = await this.nodeIntegrationRepository.getIntegrationsByUuids(
                query.integrationUuids,
            );

            const resolvedIntegrations = new Map<string, TNodeIntegrationsPayload>();

            for (const [uuid, integration] of integrations) {
                resolvedIntegrations.set(uuid, resolveIntegrationConfig(integration.config));
            }

            return ok(resolvedIntegrations);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_ALL_NODE_INTEGRATIONS_ERROR);
        }
    }
}
