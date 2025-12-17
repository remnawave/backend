import { Controller, HttpStatus, Param, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    GetLegacyStatsNodeUserUsageCommand,
    GetStatsNodesRealtimeUsageCommand,
    GetStatsNodeUsersUsageCommand,
} from '@libs/contracts/commands';
import { BANDWIDTH_STATS_NODES_CONTROLLER, CONTROLLERS_INFO } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    GetLegacyStatsNodesUsersUsageRequestDto,
    GetLegacyStatsNodesUsersUsageRequestQueryDto,
    GetLegacyStatsNodesUsersUsageResponseDto,
    GetStatsNodesRealtimeUsageResponseDto,
    GetStatsNodeUsersUsageRequestDto,
    GetStatsNodeUsersUsageRequestQueryDto,
    GetStatsNodeUsersUsageResponseDto,
} from './dtos';
import {
    GetLegacyStatsNodesUsersUsageResponseModel,
    GetStatsNodesRealtimeUsageResponseModel,
} from './models';
import { NodesUserUsageHistoryService } from './nodes-user-usage-history.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.BANDWIDTH_STATS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(BANDWIDTH_STATS_NODES_CONTROLLER)
export class BandwidthStatsNodesController {
    constructor(private readonly nodesUserUsageHistoryService: NodesUserUsageHistoryService) {}

    @ApiOkResponse({
        type: GetLegacyStatsNodesUsersUsageResponseDto,
        description: 'Nodes users usage by range (legacy) fetched successfully',
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
        command: GetLegacyStatsNodeUserUsageCommand,
        httpCode: HttpStatus.OK,
    })
    async getNodeUserUsage(
        @Query() query: GetLegacyStatsNodesUsersUsageRequestQueryDto,
        @Param() paramData: GetLegacyStatsNodesUsersUsageRequestDto,
    ): Promise<GetLegacyStatsNodesUsersUsageResponseDto> {
        const result = await this.nodesUserUsageHistoryService.getLegacyStatsNodesUsersUsage(
            paramData.uuid,
            new Date(query.start),
            new Date(query.end),
        );

        const data = errorHandler(result);
        return {
            response: data.map((item) => new GetLegacyStatsNodesUsersUsageResponseModel(item)),
        };
    }

    @ApiOkResponse({
        type: GetStatsNodesRealtimeUsageResponseDto,
        description: 'Nodes realtime usage fetched successfully',
    })
    @Endpoint({
        command: GetStatsNodesRealtimeUsageCommand,
        httpCode: HttpStatus.OK,
    })
    async getNodesRealtimeUsage(): Promise<GetStatsNodesRealtimeUsageResponseDto> {
        const result = await this.nodesUserUsageHistoryService.getStatsNodesRealtimeUsage();

        const data = errorHandler(result);
        return {
            response: data.map((item) => new GetStatsNodesRealtimeUsageResponseModel(item)),
        };
    }

    @ApiOkResponse({
        type: GetStatsNodeUsersUsageResponseDto,
        description: 'Stats node users usage fetched successfully',
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
    @ApiQuery({
        name: 'topUsersLimit',
        type: Number,
        description: 'Limit of top users to return',
        required: true,
    })
    @Endpoint({
        command: GetStatsNodeUsersUsageCommand,
        httpCode: HttpStatus.OK,
    })
    async getStatsNodeUsersUsage(
        @Query() query: GetStatsNodeUsersUsageRequestQueryDto,
        @Param() paramData: GetStatsNodeUsersUsageRequestDto,
    ): Promise<GetStatsNodeUsersUsageResponseDto> {
        const result = await this.nodesUserUsageHistoryService.getStatsNodesUsersUsage(
            paramData.uuid,
            query.start,
            query.end,
            query.topUsersLimit,
        );
        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
