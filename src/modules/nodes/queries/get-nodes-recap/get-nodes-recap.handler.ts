import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodesSystemCacheService } from '@modules/nodes/nodes-system-cache.service';

import { NodesRepository } from '../../repositories/nodes.repository';
import { GetNodesRecapQuery } from './get-nodes-recap.query';

@QueryHandler(GetNodesRecapQuery)
export class GetNodesRecapHandler implements IQueryHandler<GetNodesRecapQuery> {
    private readonly logger = new Logger(GetNodesRecapHandler.name);
    constructor(
        private readonly nodesRepository: NodesRepository,
        private readonly nodesSystemCacheService: NodesSystemCacheService,
    ) {}

    async execute() {
        try {
            const nodes = await this.nodesRepository.findAllNodes();
            const systemInfoMap = await this.nodesSystemCacheService.getMany(nodes);

            let totalRamBytes = 0;
            let totalCpuCores = 0;
            const countries = new Set<string>();

            for (const row of nodes) {
                const hotCache = systemInfoMap.get(row.uuid);
                if (!hotCache || !hotCache.system) {
                    continue;
                }
                totalRamBytes += hotCache.system.info.memoryTotal;
                totalCpuCores += hotCache.system.info.cpus;
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
