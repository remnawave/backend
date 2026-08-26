import type { Request } from 'express';

import {
    Body,
    Controller,
    HttpStatus,
    Param,
    Query,
    Req,
    UseFilters,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Endpoint } from '@common/decorators/base-endpoint';
import { IpAddress } from '@common/decorators/get-ip';
import { UserAgent } from '@common/decorators/get-useragent';
import { Roles } from '@common/decorators/roles/roles';
import { ApiScopeResource } from '@common/decorators/scopes';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { RolesGuard } from '@common/guards/roles';
import { ScopesGuard } from '@common/guards/scopes';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { extractHwidHeaders } from '@common/utils/extract-hwid-headers';
import { CONTROLLERS_INFO, SUBSCRIPTIONS_CONTROLLER } from '@libs/contracts/api';
import {
    GetConnectionKeysByUserIdCommand,
    GetRawSubscriptionByShortUuidCommand,
    GetSubscriptionByIdCommand,
    GetSubscriptionByShortUuidProtectedCommand,
    GetSubscriptionByUsernameCommand,
    GetSubscriptionsCommand,
} from '@libs/contracts/commands';
import { GetSubpageConfigByShortUuidCommand } from '@libs/contracts/commands/subscriptions/subpage/get-subpage-config-by-shortuuid.command';
import { ROLE } from '@libs/contracts/constants';

import {
    GetConnectionKeysByUserIdResponseDto,
    GetRawSubscriptionByShortUuidParamDto,
    GetRawSubscriptionByShortUuidQueryDto,
    GetRawSubscriptionByShortUuidResponseDto,
    GetSubscriptionByShortUuidProtectedParamDto,
    GetSubscriptionByShortUuidProtectedResponseDto,
    GetSubscriptionByUsernameParamDto,
    GetSubscriptionByUsernameResponseDto,
    GetSubscriptionByIdParamDto,
    GetSubscriptionByIdResponseDto,
    GetConnectionKeysByUserIdParamDto,
    GetSubscriptionsResponseDto,
    GetSubscriptionsQueryDto,
} from '../dto';
import {
    GetSubpageConfigByShortUuidBodyDto,
    GetSubpageConfigByShortUuidParamDto,
    GetSubpageConfigByShortUuidResponseDto,
} from '../dto/get-subpage-config.dto';
import { AllSubscriptionsResponseModel, SubscriptionRawResponse } from '../models';
import { SubscriptionService } from '../subscription.service';

@ApiBearerAuth('Authorization')
@ApiScopeResource(CONTROLLERS_INFO.SUBSCRIPTIONS.resource)
@ApiTags(CONTROLLERS_INFO.SUBSCRIPTIONS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard, ScopesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(SUBSCRIPTIONS_CONTROLLER)
export class SubscriptionsController {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    @Endpoint({
        command: GetSubscriptionsCommand,
        httpCode: HttpStatus.OK,
        type: GetSubscriptionsResponseDto,
    })
    async getAllSubscriptions(
        @Query() query: GetSubscriptionsQueryDto,
    ): Promise<GetSubscriptionsResponseDto> {
        const { start, size } = query;
        const result = await this.subscriptionService.getAllSubscriptions({
            start,
            size,
        });

        const data = errorHandler(result);
        return {
            response: new AllSubscriptionsResponseModel({
                total: data.total,
                subscriptions: data.subscriptions.map((item) => new SubscriptionRawResponse(item)),
            }),
        };
    }

    @Endpoint({
        command: GetSubscriptionByUsernameCommand,
        httpCode: HttpStatus.OK,
        type: GetSubscriptionByUsernameResponseDto,
    })
    async getSubscriptionByUsername(
        @Param() param: GetSubscriptionByUsernameParamDto,
    ): Promise<GetSubscriptionByUsernameResponseDto> {
        const { username } = param;
        const result = await this.subscriptionService.getSubscriptionInfo({
            searchBy: {
                uniqueField: username,
                uniqueFieldKey: 'username',
            },
            authenticated: true,
        });

        const data = errorHandler(result);

        return {
            response: new SubscriptionRawResponse(data),
        };
    }

    @Endpoint({
        command: GetSubscriptionByShortUuidProtectedCommand,
        httpCode: HttpStatus.OK,
        type: GetSubscriptionByShortUuidProtectedResponseDto,
    })
    async getSubscriptionByShortUuidProtected(
        @Param() param: GetSubscriptionByShortUuidProtectedParamDto,
    ): Promise<GetSubscriptionByShortUuidProtectedResponseDto> {
        const { shortUuid } = param;
        const result = await this.subscriptionService.getSubscriptionInfo({
            searchBy: {
                uniqueField: shortUuid,
                uniqueFieldKey: 'shortUuid',
            },
            authenticated: true,
        });

        const data = errorHandler(result);

        return {
            response: new SubscriptionRawResponse(data),
        };
    }

    @Endpoint({
        command: GetSubscriptionByIdCommand,
        httpCode: HttpStatus.OK,
        type: GetSubscriptionByIdResponseDto,
    })
    async getSubscriptionByUuid(
        @Param() param: GetSubscriptionByIdParamDto,
    ): Promise<GetSubscriptionByIdResponseDto> {
        const { userId } = param;
        const result = await this.subscriptionService.getSubscriptionInfo({
            searchBy: {
                uniqueField: BigInt(userId),
                uniqueFieldKey: 'id',
            },
            authenticated: true,
        });

        const data = errorHandler(result);

        return {
            response: new SubscriptionRawResponse(data),
        };
    }

    @Endpoint({
        command: GetRawSubscriptionByShortUuidCommand,
        httpCode: HttpStatus.OK,
        type: GetRawSubscriptionByShortUuidResponseDto,
    })
    async getRawSubscriptionByShortUuid(
        @UserAgent() userAgent: string,
        @IpAddress() ip: string,
        @Param() { shortUuid }: GetRawSubscriptionByShortUuidParamDto,
        @Query() { withDisabledHosts }: GetRawSubscriptionByShortUuidQueryDto,
        @Req() request: Request,
    ): Promise<GetRawSubscriptionByShortUuidResponseDto> {
        const result = await this.subscriptionService.getRawSubscriptionByShortUuid(
            shortUuid,
            withDisabledHosts,
            extractHwidHeaders(request),
            userAgent,
            ip,
        );

        const data = errorHandler(result);

        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetSubpageConfigByShortUuidCommand,
        httpCode: HttpStatus.OK,
        type: GetSubpageConfigByShortUuidResponseDto,
    })
    async getSubpageConfigByShortUuid(
        @Param() param: GetSubpageConfigByShortUuidParamDto,
        @Body() body: GetSubpageConfigByShortUuidBodyDto,
    ): Promise<GetSubpageConfigByShortUuidResponseDto> {
        const { shortUuid } = param;
        const result = await this.subscriptionService.getSubpageConfigByShortUuid(
            shortUuid,
            body.requestHeaders,
        );
        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetConnectionKeysByUserIdCommand,
        httpCode: HttpStatus.OK,
        type: GetConnectionKeysByUserIdResponseDto,
    })
    async getConnectionKeysByUserId(
        @Param() param: GetConnectionKeysByUserIdParamDto,
    ): Promise<GetConnectionKeysByUserIdResponseDto> {
        const { userId } = param;
        const result = await this.subscriptionService.getConnectionKeysByUserId(userId);
        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
