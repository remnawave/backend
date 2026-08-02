import { Request, Response } from 'express';

import {
    Body,
    Controller,
    HttpStatus,
    Query,
    Req,
    Res,
    UseFilters,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { ApiScopeResource } from '@common/decorators/scopes';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { RolesGuard } from '@common/guards/roles';
import { ScopesGuard } from '@common/guards/scopes';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { CONTROLLERS_INFO, SYSTEM_CONTROLLER } from '@libs/contracts/api';
import {
    GenerateX25519Command,
    GetBandwidthStatsCommand,
    GetMetadataCommand,
    GetNodesMetricsCommand,
    GetNodesStatisticsCommand,
    GetRecapCommand,
    GetRemnawaveHealthCommand,
    GetStatsCommand,
    GetStatsDigestCommand,
    GetHttpStatsCommand,
    TestSrrMatcherCommand,
    GetConfigurationCommand,
} from '@libs/contracts/commands';
import { ROLE } from '@libs/contracts/constants';

import {
    GetBandwidthStatsQueryDto,
    GetBandwidthStatsResponseDto,
    GetNodesMetricsResponseDto,
    GetNodesStatisticsResponseDto,
    GetRemnawaveHealthResponseDto,
    GetStatsResponseDto,
    GenerateX25519ResponseDto,
    DebugSrrMatcherBodyDto,
    DebugSrrMatcherResponseDto,
    GetMetadataResponseDto,
    GetRecapResponseDto,
    GetHttpStatsResponseDto,
    GetStatsDigestQueryDto,
    GetStatsDigestResponseDto,
    GetConfigurationResponseDto,
} from './dtos';
import { RouteCounterService } from './route-counter.service';
import { SystemService } from './system.service';

@ApiBearerAuth('Authorization')
@ApiScopeResource(CONTROLLERS_INFO.SYSTEM.resource)
@ApiTags(CONTROLLERS_INFO.SYSTEM.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard, ScopesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(SYSTEM_CONTROLLER)
export class SystemController {
    constructor(
        private readonly systemService: SystemService,
        private readonly routeCounterService: RouteCounterService,
    ) {}

    @Endpoint({
        command: GetMetadataCommand,
        httpCode: HttpStatus.OK,
        type: GetMetadataResponseDto,
    })
    async getMetadata(): Promise<GetMetadataResponseDto> {
        const result = await this.systemService.getMetadata();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetConfigurationCommand,
        httpCode: HttpStatus.OK,
        type: GetConfigurationResponseDto,
    })
    async getConfiguration(): Promise<GetConfigurationResponseDto> {
        const result = await this.systemService.getConfiguration();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetStatsCommand,
        httpCode: HttpStatus.OK,
        type: GetStatsResponseDto,
    })
    async getStats(): Promise<GetStatsResponseDto> {
        const result = await this.systemService.getStats();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetBandwidthStatsCommand,
        httpCode: HttpStatus.OK,
        type: GetBandwidthStatsResponseDto,
    })
    async getBandwidthStats(
        @Query() query: GetBandwidthStatsQueryDto,
    ): Promise<GetBandwidthStatsResponseDto> {
        const result = await this.systemService.getBandwidthStats(query);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetNodesStatisticsCommand,
        httpCode: HttpStatus.OK,
        type: GetNodesStatisticsResponseDto,
    })
    async getNodesStatistics(): Promise<GetNodesStatisticsResponseDto> {
        const result = await this.systemService.getNodesStatistics();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetRemnawaveHealthCommand,
        httpCode: HttpStatus.OK,
        type: GetRemnawaveHealthResponseDto,
    })
    async getRemnawaveHealth(): Promise<GetRemnawaveHealthResponseDto> {
        const result = await this.systemService.getRemnawaveHealth();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetNodesMetricsCommand,
        httpCode: HttpStatus.OK,
        type: GetNodesMetricsResponseDto,
    })
    async getNodesMetrics(): Promise<GetNodesMetricsResponseDto> {
        const result = await this.systemService.getNodesMetrics();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GenerateX25519Command,
        httpCode: HttpStatus.OK,
        type: GenerateX25519ResponseDto,
    })
    async getX25519Keypairs(): Promise<GenerateX25519ResponseDto> {
        const result = await this.systemService.getX25519Keypairs();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: TestSrrMatcherCommand,
        httpCode: HttpStatus.OK,
        type: DebugSrrMatcherResponseDto,
    })
    async debugSrrMatcher(
        @Res() response: Response,
        @Req() request: Request,
        @Body() body: DebugSrrMatcherBodyDto,
    ): Promise<Response> {
        return await this.systemService.debugSrrMatcher(request, response, body);
    }

    @Endpoint({
        command: GetRecapCommand,
        httpCode: HttpStatus.OK,
        type: GetRecapResponseDto,
    })
    async getRecap(): Promise<GetRecapResponseDto> {
        const result = await this.systemService.getRecap();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetStatsDigestCommand,
        httpCode: HttpStatus.OK,
        type: GetStatsDigestResponseDto,
    })
    async getStatsDigest(
        @Query() query: GetStatsDigestQueryDto,
    ): Promise<GetStatsDigestResponseDto> {
        const result = await this.systemService.getStatsDigest(query);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetHttpStatsCommand,
        httpCode: HttpStatus.OK,
        type: GetHttpStatsResponseDto,
    })
    async getHttpStats(): Promise<GetHttpStatsResponseDto> {
        const result = await this.routeCounterService.getStats();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
