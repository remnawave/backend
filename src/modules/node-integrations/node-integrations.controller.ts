import { CONTROLLERS_INFO, NODE_INTEGRATIONS_CONTROLLER } from '@contract/api';
import { ROLE } from '@contract/constants';

import { Body, Controller, HttpStatus, Param, UseFilters, UseGuards } from '@nestjs/common';
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
    CreateNodeIntegrationCommand,
    DeleteNodeIntegrationCommand,
    GetNodeIntegrationCommand,
    GetNodeIntegrationsCommand,
    UpdateNodeIntegrationCommand,
} from '@libs/contracts/commands';

import {
    CreateNodeIntegrationBodyDto,
    CreateNodeIntegrationResponseDto,
    DeleteNodeIntegrationParamDto,
    GetNodeIntegrationParamDto,
    GetNodeIntegrationResponseDto,
    GetNodeIntegrationsResponseDto,
    UpdateNodeIntegrationBodyDto,
    UpdateNodeIntegrationResponseDto,
} from './dtos/node-integrations.dtos';
import { NodeIntegrationService } from './node-integrations.service';

@ApiBearerAuth('Authorization')
@ApiScopeResource(CONTROLLERS_INFO.NODE_INTEGRATIONS.resource)
@ApiTags(CONTROLLERS_INFO.NODE_INTEGRATIONS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard, ScopesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(NODE_INTEGRATIONS_CONTROLLER)
export class NodeIntegrationController {
    constructor(private readonly nodeIntegrationService: NodeIntegrationService) {}

    @Endpoint({
        type: GetNodeIntegrationsResponseDto,
        command: GetNodeIntegrationsCommand,
        httpCode: HttpStatus.OK,
    })
    async getAllIntegrations(): Promise<GetNodeIntegrationsResponseDto> {
        const result = await this.nodeIntegrationService.getAllIntegrations();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        type: GetNodeIntegrationResponseDto,
        command: GetNodeIntegrationCommand,
        httpCode: HttpStatus.OK,
    })
    async getIntegrationByUuid(
        @Param() param: GetNodeIntegrationParamDto,
    ): Promise<GetNodeIntegrationResponseDto> {
        const result = await this.nodeIntegrationService.getIntegrationByUuid(param.uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        type: CreateNodeIntegrationResponseDto,
        command: CreateNodeIntegrationCommand,
        httpCode: HttpStatus.CREATED,
    })
    async createIntegration(
        @Body() body: CreateNodeIntegrationBodyDto,
    ): Promise<CreateNodeIntegrationResponseDto> {
        const result = await this.nodeIntegrationService.createIntegration(
            body.name.trim(),
            body.description,
            body.config,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        type: UpdateNodeIntegrationResponseDto,
        command: UpdateNodeIntegrationCommand,
        httpCode: HttpStatus.OK,
    })
    async updateIntegration(
        @Body() body: UpdateNodeIntegrationBodyDto,
    ): Promise<UpdateNodeIntegrationResponseDto> {
        const result = await this.nodeIntegrationService.updateIntegration(
            body.uuid,
            body.name?.trim() ?? undefined,
            body.description,
            body.config,
            body.restartNodes ?? false,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: DeleteNodeIntegrationCommand,
        httpCode: HttpStatus.NO_CONTENT,
    })
    async deleteIntegration(@Param() param: DeleteNodeIntegrationParamDto) {
        const result = await this.nodeIntegrationService.deleteIntegration(param.uuid);

        errorHandler(result);
        return;
    }
}
