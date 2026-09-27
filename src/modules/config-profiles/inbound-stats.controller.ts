import { Controller, HttpStatus, Param, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Endpoint } from '@common/decorators/base-endpoint/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { ApiScopeResource } from '@common/decorators/scopes';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { RolesGuard } from '@common/guards/roles';
import { ScopesGuard } from '@common/guards/scopes';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { BANDWIDTH_STATS_INBOUNDS_CONTROLLER, CONTROLLERS_INFO } from '@libs/contracts/api';
import {
    GetInboundTopUsersUsageCommand,
    GetInboundUsageCommand,
    GetInboundUserUsageCommand,
} from '@libs/contracts/commands';
import { ROLE } from '@libs/contracts/constants';

import { ConfigProfileService } from './config-profile.service';
import {
    GetInboundTopUsersUsageParamDto,
    GetInboundTopUsersUsageQueryDto,
    GetInboundTopUsersUsageResponseDto,
    GetInboundUsageParamDto,
    GetInboundUsageQueryDto,
    GetInboundUsageResponseDto,
    GetInboundUserUsageParamDto,
    GetInboundUserUsageQueryDto,
    GetInboundUserUsageResponseDto,
} from './dtos';

@ApiBearerAuth('Authorization')
@ApiScopeResource(CONTROLLERS_INFO.BANDWIDTH_STATS.resource)
@ApiTags(CONTROLLERS_INFO.BANDWIDTH_STATS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard, ScopesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(BANDWIDTH_STATS_INBOUNDS_CONTROLLER)
export class InboundStatsController {
    constructor(private readonly configProfileService: ConfigProfileService) {}

    @Endpoint({
        command: GetInboundUsageCommand,
        httpCode: HttpStatus.OK,
        type: GetInboundUsageResponseDto,
    })
    async getInboundUsage(
        @Param() param: GetInboundUsageParamDto,
        @Query() query: GetInboundUsageQueryDto,
    ): Promise<GetInboundUsageResponseDto> {
        const result = await this.configProfileService.getInboundUsage(param.uuid, query);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetInboundUserUsageCommand,
        httpCode: HttpStatus.OK,
        type: GetInboundUserUsageResponseDto,
    })
    async getInboundUserUsage(
        @Param() param: GetInboundUserUsageParamDto,
        @Query() query: GetInboundUserUsageQueryDto,
    ): Promise<GetInboundUserUsageResponseDto> {
        const result = await this.configProfileService.getInboundUserUsage(
            param.uuid,
            param.userId,
            query,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetInboundTopUsersUsageCommand,
        httpCode: HttpStatus.OK,
        type: GetInboundTopUsersUsageResponseDto,
    })
    async getInboundTopUsersUsage(
        @Param() param: GetInboundTopUsersUsageParamDto,
        @Query() query: GetInboundTopUsersUsageQueryDto,
    ): Promise<GetInboundTopUsersUsageResponseDto> {
        const result = await this.configProfileService.getInboundTopUsersUsage(param.uuid, query);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
