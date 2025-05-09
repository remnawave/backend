import { Request, Response } from 'express';

import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { Controller, HttpStatus, Param, Query, UseFilters, UseGuards } from '@nestjs/common';

import { HttpExceptionFilter } from '@common/exception/httpException.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    GetAllSubscriptionsCommand,
    GetSubscriptionByUsernameCommand,
} from '@libs/contracts/commands';
import { SUBSCRIPTIONS_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    GetAllSubscriptionsQueryDto,
    GetAllSubscriptionsResponseDto,
    GetSubscriptionByUsernameRequestDto,
    GetSubscriptionByUsernameResponseDto,
} from '../dto';
import { AllSubscriptionsResponseModel, SubscriptionRawResponse } from '../models';
import { SubscriptionService } from '../subscription.service';

@ApiBearerAuth('Authorization')
@ApiTags('Subscriptions Controller')
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
    async getAllUsers(
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
        const result = await this.subscriptionService.getSubscriptionByUsername(username);

        const data = errorHandler(result);

        return {
            response: new SubscriptionRawResponse(data),
        };
    }
}
