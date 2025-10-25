import { Controller, HttpStatus, Param, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    GetNodesRealtimeUsageCommand,
    GetNodeUserUsageByRangeCommand,
} from '@libs/contracts/commands';
import { CONTROLLERS_INFO, NODES_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    GetNodeUserUsageByRangeRequestDto,
    GetNodeUserUsageByRangeRequestQueryDto,
    GetNodeUserUsageByRangeResponseDto,
} from './dtos';
import { GetNodesRealtimeUsageResponseModel, GetNodeUserUsageByRangeResponseModel } from './models';
import { GetNodesRealtimeUsageResponseDto } from './dtos/nodes-realtime-usage.dto';
import { NodesUserUsageHistoryService } from './nodes-user-usage-history.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.BANDWIDTH_STATS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(NODES_CONTROLLER)
export class NodesUserUsageHistoryController {
    constructor(private readonly nodesUserUsageHistoryService: NodesUserUsageHistoryService) {}

    @ApiOkResponse({
        type: GetNodeUserUsageByRangeResponseDto,
        description: 'Nodes user usage by range fetched successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'UUID of the node', required: true })
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
        command: GetNodeUserUsageByRangeCommand,
        httpCode: HttpStatus.OK,
    })
    async getNodeUserUsage(
        @Query() query: GetNodeUserUsageByRangeRequestQueryDto,
        @Param() paramData: GetNodeUserUsageByRangeRequestDto,
    ): Promise<GetNodeUserUsageByRangeResponseDto> {
        const result = await this.nodesUserUsageHistoryService.getNodesUserUsageByRange(
            paramData.uuid,
            new Date(query.start),
            new Date(query.end),
        );

        const data = errorHandler(result);
        return {
            response: data.map((item) => new GetNodeUserUsageByRangeResponseModel(item)),
        };
    }

    @ApiOkResponse({
        type: GetNodesRealtimeUsageResponseDto,
        description: 'Nodes realtime usage fetched successfully',
    })
    @Endpoint({
        command: GetNodesRealtimeUsageCommand,
        httpCode: HttpStatus.OK,
    })
    async getNodesRealtimeUsage(): Promise<GetNodesRealtimeUsageResponseDto> {
        const result = await this.nodesUserUsageHistoryService.getNodesRealtimeUsage();

        const data = errorHandler(result);
        return {
            response: data.map((item) => new GetNodesRealtimeUsageResponseModel(item)),
        };
    }
}
