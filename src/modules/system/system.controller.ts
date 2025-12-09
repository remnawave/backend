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
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    EncryptHappCryptoLinkCommand,
    GenerateX25519Command,
    GetBandwidthStatsCommand,
    GetNodesMetricsCommand,
    GetNodesStatisticsCommand,
    GetRemnawaveHealthCommand,
    GetStatsCommand,
    TestSrrMatcherCommand,
} from '@libs/contracts/commands';
import { CONTROLLERS_INFO, SYSTEM_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    GetBandwidthStatsRequestQueryDto,
    GetBandwidthStatsResponseDto,
    GetNodesMetricsResponseDto,
    GetNodesStatisticsResponseDto,
    GetRemnawaveHealthResponseDto,
    GetStatsResponseDto,
    GenerateX25519ResponseDto,
    EncryptHappCryptoLinkResponseDto,
    EncryptHappCryptoLinkRequestDto,
    DebugSrrMatcherRequestDto,
    DebugSrrMatcherResponseDto,
} from './dtos';
import { EncryptHappCryptoLinkResponseModel } from './models';
import { SystemService } from './system.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.SYSTEM.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(SYSTEM_CONTROLLER)
export class SystemController {
    constructor(private readonly systemService: SystemService) {}

    @ApiResponse({
        status: 200,
        description: 'Returns system statistics',
        type: GetStatsResponseDto,
    })
    @Endpoint({
        command: GetStatsCommand,
        httpCode: HttpStatus.OK,
    })
    async getStats(): Promise<GetStatsResponseDto> {
        const result = await this.systemService.getStats();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        status: 200,
        description: 'Returns bandwidth statistics',
        type: GetBandwidthStatsResponseDto,
    })
    @Endpoint({
        command: GetBandwidthStatsCommand,
        httpCode: HttpStatus.OK,
    })
    async getBandwidthStats(
        @Query() query: GetBandwidthStatsRequestQueryDto,
    ): Promise<GetBandwidthStatsResponseDto> {
        const result = await this.systemService.getBandwidthStats(query);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        status: 200,
        description: 'Returns nodes statistics',
        type: GetNodesStatisticsResponseDto,
    })
    @Endpoint({
        command: GetNodesStatisticsCommand,
        httpCode: HttpStatus.OK,
    })
    async getNodesStatistics(): Promise<GetNodesStatisticsResponseDto> {
        const result = await this.systemService.getNodesStatistics();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        status: 200,
        description: 'Returns Remnawave health',
        type: GetRemnawaveHealthResponseDto,
    })
    @Endpoint({
        command: GetRemnawaveHealthCommand,
        httpCode: HttpStatus.OK,
    })
    async getRemnawaveHealth(): Promise<GetRemnawaveHealthResponseDto> {
        const result = await this.systemService.getRemnawaveHealth();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        status: 200,
        description: 'Returns nodes metrics from Prometheus metrics endpoint',
        type: GetNodesMetricsResponseDto,
    })
    @Endpoint({
        command: GetNodesMetricsCommand,
        httpCode: HttpStatus.OK,
    })
    async getNodesMetrics(): Promise<GetNodesMetricsResponseDto> {
        const result = await this.systemService.getNodesMetrics();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        status: 200,
        description: 'Returns x25519 keypairs',
        type: GenerateX25519ResponseDto,
    })
    @Endpoint({
        command: GenerateX25519Command,
        httpCode: HttpStatus.OK,
    })
    async getX25519Keypairs(): Promise<GenerateX25519ResponseDto> {
        const result = await this.systemService.getX25519Keypairs();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: EncryptHappCryptoLinkResponseDto,
        description: 'Returns encrypted Happ crypto link',
    })
    @Endpoint({
        command: EncryptHappCryptoLinkCommand,
        httpCode: HttpStatus.OK,
        apiBody: EncryptHappCryptoLinkRequestDto,
    })
    async encryptHappCryptoLink(
        @Body() body: EncryptHappCryptoLinkRequestDto,
    ): Promise<EncryptHappCryptoLinkResponseDto> {
        const result = await this.systemService.encryptHappCryptoLink(body.linkToEncrypt);

        const data = errorHandler(result);
        return {
            response: new EncryptHappCryptoLinkResponseModel(data),
        };
    }

    @ApiCreatedResponse({
        type: DebugSrrMatcherResponseDto,
        description: 'Debug SRR matcher information',
    })
    @Endpoint({
        command: TestSrrMatcherCommand,
        httpCode: HttpStatus.OK,
        apiBody: DebugSrrMatcherRequestDto,
    })
    async debugSrrMatcher(
        @Res() response: Response,
        @Req() request: Request,
        @Body() body: DebugSrrMatcherRequestDto,
    ): Promise<Response> {
        return await this.systemService.debugSrrMatcher(request, response, body);
    }
}
