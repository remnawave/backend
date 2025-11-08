import { Controller, HttpStatus, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    GetSubscriptionRequestHistoryCommand,
    GetSubscriptionRequestHistoryStatsCommand,
} from '@libs/contracts/commands';
import { CONTROLLERS_INFO, SUBSCRIPTION_REQUEST_HISTORY_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    GetSubscriptionRequestHistoryRequestQueryDto,
    GetSubscriptionRequestHistoryResponseDto,
    GetSubscriptionRequestHistoryStatsResponseDto,
} from './dtos';
import {
    BaseSubscriptionRequestHistoryResponseModel,
    GetSubscriptionRequestHistoryResponseModel,
} from './models';
import { UserSubscriptionRequestHistoryService } from './user-subscription-request-history.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.SUBSCRIPTION_REQUEST_HISTORY.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(SUBSCRIPTION_REQUEST_HISTORY_CONTROLLER)
export class UserSubscriptionRequestHistoryController {
    constructor(
        private readonly userSubscriptionRequestHistoryService: UserSubscriptionRequestHistoryService,
    ) {}

    @ApiOkResponse({
        type: GetSubscriptionRequestHistoryResponseDto,
        description: 'Subscription request history fetched successfully',
    })
    @ApiQuery({
        name: 'start',
        type: 'number',
        required: false,
        description: 'Offset for pagination',
    })
    @ApiQuery({
        name: 'size',
        type: 'number',
        required: false,
        description: 'Page size for pagination',
    })
    @Endpoint({
        command: GetSubscriptionRequestHistoryCommand,
        httpCode: HttpStatus.OK,
    })
    async getSubscriptionRequestHistory(
        @Query() query: GetSubscriptionRequestHistoryRequestQueryDto,
    ): Promise<GetSubscriptionRequestHistoryResponseDto> {
        const { start, size, filters, filterModes, globalFilterMode, sorting } = query;
        const result =
            await this.userSubscriptionRequestHistoryService.getSubscriptionRequestHistory({
                start,
                size,
                filters,
                filterModes,
                globalFilterMode,
                sorting,
            });

        const data = errorHandler(result);
        return {
            response: new GetSubscriptionRequestHistoryResponseModel({
                total: data.total,
                records: data.records.map(
                    (item) => new BaseSubscriptionRequestHistoryResponseModel(item),
                ),
            }),
        };
    }

    @ApiOkResponse({
        type: GetSubscriptionRequestHistoryStatsResponseDto,
        description: 'User subscription request history stats fetched successfully',
    })
    @Endpoint({
        command: GetSubscriptionRequestHistoryStatsCommand,
        httpCode: HttpStatus.OK,
    })
    async getSubscriptionRequestHistoryStats(): Promise<GetSubscriptionRequestHistoryStatsResponseDto> {
        const result =
            await this.userSubscriptionRequestHistoryService.getSubscriptionRequestHistoryStats();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
