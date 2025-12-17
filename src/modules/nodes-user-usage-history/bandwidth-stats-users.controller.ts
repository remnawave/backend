import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { Controller, HttpStatus, Param, Query, UseFilters, UseGuards } from '@nestjs/common';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import { GetLegacyStatsUserUsageCommand, GetStatsUserUsageCommand } from '@libs/contracts/commands';
import { BANDWIDTH_STATS_USERS_CONTROLLER, CONTROLLERS_INFO } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    GetLegacyStatsUserUsageRequestDto,
    GetLegacyStatsUserUsageRequestQueryDto,
    GetLegacyStatsUserUsageResponseDto,
} from './dtos/get-legacy-stats-users-usage.dto';
import {
    GetStatsUserUsageRequestDto,
    GetStatsUserUsageRequestQueryDto,
    GetStatsUserUsageResponseDto,
} from './dtos';
import { NodesUserUsageHistoryService } from './nodes-user-usage-history.service';
import { GetLegacyStatsUserUsageResponseModel } from './models';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.BANDWIDTH_STATS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(BANDWIDTH_STATS_USERS_CONTROLLER)
export class BandwidthStatsUsersController {
    constructor(private readonly nodesUserUsageHistoryService: NodesUserUsageHistoryService) {}

    @ApiNotFoundResponse({
        description: 'User not found',
    })
    @ApiOkResponse({
        type: GetLegacyStatsUserUsageResponseDto,
        description: 'User usage by range fetched successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'UUID of the user', required: true })
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
        command: GetLegacyStatsUserUsageCommand,
        httpCode: HttpStatus.OK,
    })
    async getUserUsageByRange(
        @Query() query: GetLegacyStatsUserUsageRequestQueryDto,
        @Param() paramData: GetLegacyStatsUserUsageRequestDto,
    ): Promise<GetLegacyStatsUserUsageResponseDto> {
        const result = await this.nodesUserUsageHistoryService.getLegacyStatsUserUsage(
            paramData.uuid,
            new Date(query.start),
            new Date(query.end),
        );

        const data = errorHandler(result);
        return {
            response: data.map((item) => new GetLegacyStatsUserUsageResponseModel(item)),
        };
    }

    @ApiOkResponse({
        type: GetStatsUserUsageResponseDto,
        description: 'Stats user usage fetched successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'UUID of the user', required: true })
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
        command: GetStatsUserUsageCommand,
        httpCode: HttpStatus.OK,
    })
    async getStatsNodesUsage(
        @Query() query: GetStatsUserUsageRequestQueryDto,
        @Param() paramData: GetStatsUserUsageRequestDto,
    ): Promise<GetStatsUserUsageResponseDto> {
        const result = await this.nodesUserUsageHistoryService.getStatsUserUsage(
            paramData.uuid,
            query.start,
            query.end,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
