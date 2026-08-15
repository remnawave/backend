import { CONTROLLERS_INFO, NODE_PLUGINS_CONTROLLER } from '@contract/api';
import { ROLE } from '@contract/constants';

import { Body, Controller, HttpStatus, Param, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { ApiScopeResource } from '@common/decorators/scopes';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { RolesGuard } from '@common/guards/roles';
import { ScopesGuard } from '@common/guards/scopes';
import { errorHandler } from '@common/helpers/error-handler.helper';
import {
    GetAbuseBlockerReportsCommand,
    GetAbuseBlockerReviewQueueCommand,
    GetAbuseBlockerStatsCommand,
    ReviewAbuseBlockerUserCommand,
    TruncateAbuseBlockerReportsCommand,
} from '@libs/contracts/commands';

import { AbuseBlockerService } from './abuse-blocker.service';
import {
    GetAbuseBlockerReportsQueryDto,
    GetAbuseBlockerReportsResponseDto,
    GetAbuseBlockerReviewQueueQueryDto,
    GetAbuseBlockerReviewQueueResponseDto,
    GetAbuseBlockerStatsResponseDto,
    ReviewAbuseBlockerUserBodyDto,
    ReviewAbuseBlockerUserParamDto,
    ReviewAbuseBlockerUserResponseDto,
} from './dtos/node-plugins.dtos';

@ApiBearerAuth('Authorization')
@ApiScopeResource(CONTROLLERS_INFO.NODE_PLUGINS.resource)
@ApiTags(CONTROLLERS_INFO.NODE_PLUGINS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard, ScopesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(NODE_PLUGINS_CONTROLLER)
export class AbuseBlockerController {
    constructor(private readonly abuseBlockerService: AbuseBlockerService) {}

    @Endpoint({
        type: GetAbuseBlockerReportsResponseDto,
        command: GetAbuseBlockerReportsCommand,
        httpCode: HttpStatus.OK,
    })
    async getReports(
        @Query() query: GetAbuseBlockerReportsQueryDto,
    ): Promise<GetAbuseBlockerReportsResponseDto> {
        return { response: errorHandler(await this.abuseBlockerService.getReports(query)) };
    }

    @Endpoint({
        type: GetAbuseBlockerStatsResponseDto,
        command: GetAbuseBlockerStatsCommand,
        httpCode: HttpStatus.OK,
    })
    async getStats(): Promise<GetAbuseBlockerStatsResponseDto> {
        return { response: errorHandler(await this.abuseBlockerService.getStats()) };
    }

    @Endpoint({
        type: GetAbuseBlockerReviewQueueResponseDto,
        command: GetAbuseBlockerReviewQueueCommand,
        httpCode: HttpStatus.OK,
    })
    async getReviewQueue(
        @Query() query: GetAbuseBlockerReviewQueueQueryDto,
    ): Promise<GetAbuseBlockerReviewQueueResponseDto> {
        return { response: errorHandler(await this.abuseBlockerService.getReviewQueue(query)) };
    }

    @Endpoint({
        type: ReviewAbuseBlockerUserResponseDto,
        command: ReviewAbuseBlockerUserCommand,
        httpCode: HttpStatus.OK,
    })
    async review(
        @Param() param: ReviewAbuseBlockerUserParamDto,
        @Body() body: ReviewAbuseBlockerUserBodyDto,
    ): Promise<ReviewAbuseBlockerUserResponseDto> {
        return {
            response: errorHandler(
                await this.abuseBlockerService.review(param.userUuid, body.action),
            ),
        };
    }

    @Endpoint({
        command: TruncateAbuseBlockerReportsCommand,
        httpCode: HttpStatus.NO_CONTENT,
    })
    async truncateReports(): Promise<void> {
        errorHandler(await this.abuseBlockerService.truncateReports());
    }
}
