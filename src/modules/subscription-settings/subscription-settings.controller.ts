import { CONTROLLERS_INFO, SUBSCRIPTION_SETTINGS_CONTROLLER } from '@contract/api';
import { ROLE } from '@contract/constants';

import { Body, Controller, HttpStatus, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    GetSubscriptionSettingsCommand,
    UpdateSubscriptionSettingsCommand,
} from '@libs/contracts/commands';

import {
    GetSubscriptionSettingsResponseDto,
    UpdateSubscriptionSettingsRequestDto,
    UpdateSubscriptionSettingsResponseDto,
} from './dtos';
import { SubscriptionSettingsResponseModel } from './models/get-subscription-settings.response.model';
import { SubscriptionSettingsService } from './subscription-settings.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.SUBSCRIPTION_SETTINGS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(SUBSCRIPTION_SETTINGS_CONTROLLER)
export class SubscriptionSettingsController {
    constructor(private readonly subscriptionSettingsService: SubscriptionSettingsService) {}

    @ApiOkResponse({
        type: GetSubscriptionSettingsResponseDto,
        description: 'Subscription settings retrieved successfully',
    })
    @Endpoint({
        command: GetSubscriptionSettingsCommand,
        httpCode: HttpStatus.OK,
    })
    async getSettings(): Promise<GetSubscriptionSettingsResponseDto> {
        const result = await this.subscriptionSettingsService.getSubscriptionSettings();

        const data = errorHandler(result);
        return {
            response: new SubscriptionSettingsResponseModel(data),
        };
    }

    @ApiOkResponse({
        type: UpdateSubscriptionSettingsResponseDto,
        description: 'Subscription settings updated successfully',
    })
    @Endpoint({
        command: UpdateSubscriptionSettingsCommand,
        httpCode: HttpStatus.OK,
        apiBody: UpdateSubscriptionSettingsRequestDto,
    })
    async updateSettings(
        @Body() body: UpdateSubscriptionSettingsRequestDto,
    ): Promise<UpdateSubscriptionSettingsResponseDto> {
        const result = await this.subscriptionSettingsService.updateSettings(body);

        const data = errorHandler(result);
        return {
            response: new SubscriptionSettingsResponseModel(data),
        };
    }
}
