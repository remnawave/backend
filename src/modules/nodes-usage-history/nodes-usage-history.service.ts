import dayjs from 'dayjs';

import { Injectable, Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { GetNodesUsageByRangeResponseModel } from './models/get-nodes-usage-by-range.response.model';
import { NodesUsageHistoryRepository } from './repositories/nodes-usage-history.repository';

@Injectable()
export class NodesUsageHistoryService {
    private readonly logger = new Logger(NodesUsageHistoryService.name);
    constructor(private readonly nodeUsageHistoryRepository: NodesUsageHistoryRepository) {}

    async getNodesUsageByRange(
        start: Date,
        end: Date,
    ): Promise<ICommandResponse<GetNodesUsageByRangeResponseModel[]>> {
        try {
            const startDate = dayjs(start).utc().toDate();
            const endDate = dayjs(end).utc().toDate();

            const nodesUsage = await this.nodeUsageHistoryRepository.getNodesUsageByRange(
                startDate,
                endDate,
            );

            return {
                isOk: true,
                response: nodesUsage.map(
                    (nodeUsage) => new GetNodesUsageByRangeResponseModel(nodeUsage),
                ),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_NODES_USAGE_BY_RANGE_ERROR,
            };
        }
    }
}
