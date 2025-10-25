import { CONTROLLERS_INFO, SUBSCRIPTION_TEMPLATE_CONTROLLER } from '@contract/api';
import { ROLE } from '@contract/constants';

import { Body, Controller, HttpStatus, Param, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    CreateSubscriptionTemplateCommand,
    DeleteSubscriptionTemplateCommand,
    GetSubscriptionTemplateCommand,
    GetSubscriptionTemplatesCommand,
    UpdateSubscriptionTemplateCommand,
} from '@libs/contracts/commands';

import {
    CreateSubscriptionTemplateRequestDto,
    CreateSubscriptionTemplateResponseDto,
    DeleteSubscriptionTemplateRequestDto,
    DeleteSubscriptionTemplateResponseDto,
    GetTemplateRequestDto,
    GetTemplateResponseDto,
    GetTemplatesResponseDto,
    UpdateTemplateResponseDto,
} from './dtos/subscription-templates.dtos';
import { SubscriptionTemplateService } from './subscription-template.service';
import { UpdateTemplateRequestDto } from './dtos/subscription-templates.dtos';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.SUBSCRIPTION_TEMPLATE.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(SUBSCRIPTION_TEMPLATE_CONTROLLER)
export class SubscriptionTemplateController {
    constructor(private readonly subscriptionTemplateService: SubscriptionTemplateService) {}

    @ApiOkResponse({
        type: GetTemplatesResponseDto,
        description: 'Templates retrieved successfully',
    })
    @Endpoint({
        command: GetSubscriptionTemplatesCommand,
        httpCode: HttpStatus.OK,
    })
    async getAllTemplates(): Promise<GetTemplatesResponseDto> {
        const result = await this.subscriptionTemplateService.getAllTemplates();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: GetTemplateResponseDto,
        description: 'Template retrieved successfully',
    })
    @Endpoint({
        command: GetSubscriptionTemplateCommand,
        httpCode: HttpStatus.OK,
    })
    async getTemplateByUuid(
        @Param() paramData: GetTemplateRequestDto,
    ): Promise<GetTemplateResponseDto> {
        const { uuid } = paramData;
        const result = await this.subscriptionTemplateService.getTemplateByUuid(uuid);
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
            body.uuid,
            body.name?.trim() ?? undefined,
            body.templateJson ?? undefined,
            body.encodedTemplateYaml ?? undefined,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: DeleteSubscriptionTemplateResponseDto,
        description: 'Template deleted successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'Template UUID' })
    @Endpoint({
        command: DeleteSubscriptionTemplateCommand,
        httpCode: HttpStatus.OK,
    })
    async deleteTemplate(
        @Param() paramData: DeleteSubscriptionTemplateRequestDto,
    ): Promise<DeleteSubscriptionTemplateResponseDto> {
        const result = await this.subscriptionTemplateService.deleteTemplate(paramData.uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: CreateSubscriptionTemplateResponseDto,
        description: 'Template created successfully',
    })
    @Endpoint({
        command: CreateSubscriptionTemplateCommand,
        httpCode: HttpStatus.CREATED,
        apiBody: CreateSubscriptionTemplateRequestDto,
    })
    async createTemplate(
        @Body() body: CreateSubscriptionTemplateRequestDto,
    ): Promise<CreateSubscriptionTemplateResponseDto> {
        const result = await this.subscriptionTemplateService.createTemplate(
            body.name,
            body.templateType,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
