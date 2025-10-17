import {
    ROLE,
    SUBSCRIPTION_TEMPLATE_TYPE_VALUES,
    TSubscriptionTemplateType,
} from '@contract/constants';
import { CONTROLLERS_INFO, SUBSCRIPTION_TEMPLATE_CONTROLLER } from '@contract/api';

import { Body, Controller, HttpStatus, Param, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    GetSubscriptionTemplateCommand,
    UpdateSubscriptionTemplateCommand,
} from '@libs/contracts/commands';

import { GetTemplateRequestDto, GetTemplateResponseDto } from './dtos/get-template.dto';
import { SubscriptionTemplateService } from './subscription-template.service';
import { UpdateTemplateResponseDto } from './dtos/update-template.dto';
import { UpdateTemplateRequestDto } from './dtos/update-template.dto';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.SUBSCRIPTION_TEMPLATE.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(SUBSCRIPTION_TEMPLATE_CONTROLLER)
export class SubscriptionTemplateController {
    constructor(private readonly subscriptionTemplateService: SubscriptionTemplateService) {}

    @ApiOkResponse({
        type: GetTemplateResponseDto,
        description: 'Template retrieved successfully',
    })
    @ApiParam({
        name: 'templateType',
        type: String,
        description: 'Template type',
        required: true,
        enum: SUBSCRIPTION_TEMPLATE_TYPE_VALUES,
    })
    @Endpoint({
        command: GetSubscriptionTemplateCommand,
        httpCode: HttpStatus.OK,
    })
    async getTemplate(@Param() paramData: GetTemplateRequestDto): Promise<GetTemplateResponseDto> {
        const result = await this.subscriptionTemplateService.getTemplate(
            paramData.templateType as TSubscriptionTemplateType,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: UpdateTemplateResponseDto,
        description: 'Template updated successfully',
    })
    @Endpoint({
        command: UpdateSubscriptionTemplateCommand,
        httpCode: HttpStatus.OK,
        apiBody: UpdateTemplateRequestDto,
    })
    async updateTemplate(
        @Body() body: UpdateTemplateRequestDto,
    ): Promise<UpdateTemplateResponseDto> {
        const result = await this.subscriptionTemplateService.updateTemplate(
            body.templateType as TSubscriptionTemplateType,
            body.templateJson ?? undefined,
            body.encodedTemplateYaml ?? undefined,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
