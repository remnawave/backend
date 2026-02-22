import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { Controller, HttpStatus, Param, UseFilters, UseGuards } from '@nestjs/common';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import { CreateUserIpsJobCommand, GetUserIpsResultCommand } from '@libs/contracts/commands';
import { BANDWIDTH_STATS_USER_IPS_CONTROLLER, CONTROLLERS_INFO } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    CreateUserIpsJobRequestDto,
    CreateUserIpsJobResponseDto,
    GetUserIpsResultRequestDto,
    GetUserIpsResultResponseDto,
} from './dtos';
import { NodesUserUsageHistoryService } from './nodes-user-usage-history.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.BANDWIDTH_STATS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(BANDWIDTH_STATS_USER_IPS_CONTROLLER)
export class BandwidthStatsUserIpsController {
    constructor(private readonly nodesUserUsageHistoryService: NodesUserUsageHistoryService) {}

    @ApiNotFoundResponse({
        description: 'User not found',
    })
    @ApiOkResponse({
        type: CreateUserIpsJobResponseDto,
        description: 'Return jobId for further processing',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'UUID of the user', required: true })
    @Endpoint({
        command: CreateUserIpsJobCommand,
        httpCode: HttpStatus.CREATED,
    })
    async createUserIpsJob(
        @Param() paramData: CreateUserIpsJobRequestDto,
    ): Promise<CreateUserIpsJobResponseDto> {
        const result = await this.nodesUserUsageHistoryService.createUserIpsJob(paramData.uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'Job not found',
    })
    @ApiOkResponse({
        type: GetUserIpsResultResponseDto,
        description: 'Return result or status of the job',
    })
    @ApiParam({ name: 'jobId', type: String, description: 'Job ID', required: true })
    @Endpoint({
        command: GetUserIpsResultCommand,
        httpCode: HttpStatus.OK,
    })
    async getUserIpsResult(
        @Param() paramData: GetUserIpsResultRequestDto,
    ): Promise<GetUserIpsResultResponseDto> {
        const result = await this.nodesUserUsageHistoryService.getUserIpsResult(paramData.jobId);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
