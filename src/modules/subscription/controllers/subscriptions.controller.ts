import { Request, Response } from 'express';

import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { Controller, HttpStatus, Param, Query, Req, UseFilters, UseGuards } from '@nestjs/common';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { extractHwidHeaders } from '@common/utils/extract-hwid-headers';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { IpAddress } from '@common/decorators/get-ip';
import { RolesGuard } from '@common/guards/roles';
import {
    GetAllSubscriptionsCommand,
    GetRawSubscriptionByShortUuidCommand,
    GetSubscriptionByShortUuidProtectedCommand,
    GetSubscriptionByUsernameCommand,
    GetSubscriptionByUuidCommand,
} from '@libs/contracts/commands';
import { CONTROLLERS_INFO, SUBSCRIPTIONS_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    GetAllSubscriptionsQueryDto,
    GetAllSubscriptionsResponseDto,
    GetRawSubscriptionByShortUuidRequestDto,
    GetRawSubscriptionByShortUuidRequestQueryDto,
    GetRawSubscriptionByShortUuidResponseDto,
    GetSubscriptionByShortUuidProtectedRequestDto,
    GetSubscriptionByShortUuidProtectedResponseDto,
    GetSubscriptionByUsernameRequestDto,
    GetSubscriptionByUsernameResponseDto,
    GetSubscriptionByUuidRequestDto,
    GetSubscriptionByUuidResponseDto,
} from '../dto';
import { AllSubscriptionsResponseModel, SubscriptionRawResponse } from '../models';
import { SubscriptionService } from '../subscription.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.SUBSCRIPTIONS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(SUBSCRIPTIONS_CONTROLLER)
export class SubscriptionsController {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    @ApiOkResponse({
        type: GetAllSubscriptionsResponseDto,
        description: 'Users fetched successfully',
    })
    @ApiQuery({
        name: 'start',
        type: 'number',
        required: false,
        example: 0,
        description: GetAllSubscriptionsCommand.RequestQuerySchema.shape.start.description,
    })
    @ApiQuery({
        name: 'size',
        type: 'number',
        required: false,
        example: 25,
        description: GetAllSubscriptionsCommand.RequestQuerySchema.shape.size.description,
    })
    @Endpoint({
        command: GetAllSubscriptionsCommand,
        httpCode: HttpStatus.OK,
    })
    async getAllSubscriptions(
        @Query() query: GetAllSubscriptionsQueryDto,
    ): Promise<GetAllSubscriptionsResponseDto> {
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

    @ApiNotFoundResponse({
        description: 'User not found',
        schema: {
            type: 'object',
            properties: {
                timestamp: { type: 'string', format: 'date-time' },
                path: { type: 'string' },
                message: { type: 'string' },
                errorCode: { type: 'string' },
            },
        },
    })
    @ApiOkResponse({
        type: GetSubscriptionByUsernameResponseDto,
        description: 'Subscription fetched successfully',
    })
    @ApiParam({
        name: 'username',
        type: String,
        description: 'Username of the user',
        required: true,
    })
    @Endpoint({
        command: GetSubscriptionByUsernameCommand,
        httpCode: HttpStatus.OK,
    })
    async getSubscriptionByUsername(
        @Param() paramData: GetSubscriptionByUsernameRequestDto,
    ): Promise<GetSubscriptionByUsernameResponseDto> {
        const { username } = paramData;
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

    @ApiNotFoundResponse({
        description: 'User not found',
        schema: {
            type: 'object',
            properties: {
                timestamp: { type: 'string', format: 'date-time' },
                path: { type: 'string' },
                message: { type: 'string' },
                errorCode: { type: 'string' },
            },
        },
    })
    @ApiOkResponse({
        type: GetSubscriptionByShortUuidProtectedResponseDto,
        description: 'Subscription fetched successfully',
    })
    @ApiParam({
        name: 'shortUuid',
        type: String,
        description: 'Short uuid of the user',
        required: true,
    })
    @Endpoint({
        command: GetSubscriptionByShortUuidProtectedCommand,
        httpCode: HttpStatus.OK,
    })
    async getSubscriptionByShortUuidProtected(
        @Param() paramData: GetSubscriptionByShortUuidProtectedRequestDto,
    ): Promise<GetSubscriptionByShortUuidProtectedResponseDto> {
        const { shortUuid } = paramData;
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

    @ApiNotFoundResponse({
        description: 'User not found',
        schema: {
            type: 'object',
            properties: {
                timestamp: { type: 'string', format: 'date-time' },
                path: { type: 'string' },
                message: { type: 'string' },
                errorCode: { type: 'string' },
            },
        },
    })
    @ApiOkResponse({
        type: GetSubscriptionByUuidResponseDto,
        description: 'Subscription fetched successfully',
    })
    @ApiParam({
        name: 'uuid',
        type: String,
        description: 'Uuid of the user',
        required: true,
    })
    @Endpoint({
        command: GetSubscriptionByUuidCommand,
        httpCode: HttpStatus.OK,
    })
    async getSubscriptionByUuid(
        @Param() paramData: GetSubscriptionByUuidRequestDto,
    ): Promise<GetSubscriptionByUuidResponseDto> {
        const { uuid } = paramData;
        const result = await this.subscriptionService.getSubscriptionInfo({
            searchBy: {
                uniqueField: uuid,
                uniqueFieldKey: 'uuid',
            },
            authenticated: true,
        });

        const data = errorHandler(result);

        return {
            response: new SubscriptionRawResponse(data),
        };
    }

    @ApiOkResponse({
        description: 'Raw subscription fetched successfully',
        type: GetRawSubscriptionByShortUuidResponseDto,
    })
    @ApiParam({
        name: 'shortUuid',
        type: String,
        description: 'Short UUID of the user',
        required: true,
    })
    @ApiQuery({
        name: 'withDisabledHosts',
        type: Boolean,
        description: 'Include disabled hosts in the subscription. Default is false.',
        required: false,
    })
    @Endpoint({
        command: GetRawSubscriptionByShortUuidCommand,
        httpCode: HttpStatus.OK,
    })
    async getRawSubscriptionByShortUuid(
        @IpAddress() ip: string,
        @Param() { shortUuid }: GetRawSubscriptionByShortUuidRequestDto,
        @Query() { withDisabledHosts }: GetRawSubscriptionByShortUuidRequestQueryDto,
        @Req() request: Request,
    ): Promise<GetRawSubscriptionByShortUuidResponseDto> {
        const result = await this.subscriptionService.getRawSubscriptionByShortUuid(
            shortUuid,
            request.headers['user-agent'] as string,
            withDisabledHosts,
            extractHwidHeaders(request),
            ip,
        );

        const data = errorHandler(result);

        return {
            response: data,
        };
    }
}
