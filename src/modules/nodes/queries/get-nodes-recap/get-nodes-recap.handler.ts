import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { parseRamToBytes } from '@common/utils/bytes';
import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodesRepository } from '../../repositories/nodes.repository';
import { GetNodesRecapQuery } from './get-nodes-recap.query';

@QueryHandler(GetNodesRecapQuery)
export class GetNodesRecapHandler implements IQueryHandler<GetNodesRecapQuery> {
    private readonly logger = new Logger(GetNodesRecapHandler.name);
    constructor(private readonly nodesRepository: NodesRepository) {}

    async execute() {
        try {
            const nodes = await this.nodesRepository.findAllNodes();

            let totalRamBytes = 0;
            let totalCpuCores = 0;
            const countries = new Set<string>();

            for (const row of nodes) {
                totalRamBytes += parseRamToBytes(row.totalRam);
                totalCpuCores += row.cpuCount || 0;
                if (row.countryCode && row.countryCode !== 'XX') {
                    countries.add(row.countryCode);
                }
            }

            return ok({
                total: nodes.length,
                totalRam: totalRamBytes,
                totalCpuCores,
                distinctCountries: countries.size,
            });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
