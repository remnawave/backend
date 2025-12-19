import { Controller, HttpStatus, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import { BANDWIDTH_STATS_NODES_CONTROLLER, CONTROLLERS_INFO } from '@libs/contracts/api';
import { GetStatsNodesUsageCommand } from '@libs/contracts/commands';
import { ROLE } from '@libs/contracts/constants';

import { GetStatsNodesUsageRequestQueryDto, GetStatsNodesUsageResponseDto } from './dtos';
import { NodesUsageHistoryService } from './nodes-usage-history.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.BANDWIDTH_STATS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(BANDWIDTH_STATS_NODES_CONTROLLER)
export class NodesUsageHistoryController {
    constructor(private readonly nodesUsageHistoryService: NodesUsageHistoryService) {}

    @ApiOkResponse({
        type: GetStatsNodesUsageResponseDto,
        description: 'Stats nodes usage fetched successfully',
    })
    @ApiQuery({
        name: 'end',
        type: Date,
        description: 'End date',
        required: true,
    })
    @ApiQuery({
        name: 'start',
        type: Date,
        description: 'Start date',
        required: true,
    })
    @Endpoint({
        command: GetStatsNodesUsageCommand,
        httpCode: HttpStatus.OK,
    })
    async getStatsNodesUsage(
        @Query() query: GetStatsNodesUsageRequestQueryDto,
    ): Promise<GetStatsNodesUsageResponseDto> {
        const { start, end } = query;

        const result = await this.nodesUsageHistoryService.getStatsNodesUsage(start, end);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
