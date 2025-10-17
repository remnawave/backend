import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Body, Controller, HttpStatus, Param, Query, UseFilters, UseGuards } from '@nestjs/common';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    CreateInfraBillingHistoryRecordCommand,
    CreateInfraBillingNodeCommand,
    CreateInfraProviderCommand,
    DeleteInfraBillingHistoryRecordCommand,
    DeleteInfraBillingNodeByUuidCommand,
    DeleteInfraProviderByUuidCommand,
    GetInfraBillingHistoryRecordsCommand,
    GetInfraBillingNodesCommand,
    GetInfraProviderByUuidCommand,
    GetInfraProvidersCommand,
    UpdateInfraBillingNodeCommand,
    UpdateInfraProviderCommand,
} from '@libs/contracts/commands';
import { CONTROLLERS_INFO, INFRA_BILLING_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    CreateInfraBillingHistoryRecordRequestDto,
    CreateInfraBillingHistoryRecordResponseDto,
    CreateInfraBillingNodeRequestDto,
    CreateInfraBillingNodeResponseDto,
    CreateInfraProviderRequestDto,
    CreateInfraProviderResponseDto,
    DeleteInfraBillingHistoryRecordByUuidResponseDto,
    DeleteInfraBillingNodeByUuidResponseDto,
    DeleteInfraProviderByUuidResponseDto,
    GetInfraBillingHistoryRecordsRequestDto,
    GetInfraBillingHistoryRecordsResponseDto,
    GetInfraBillingNodesResponseDto,
    GetInfraProviderByUuidResponseDto,
    GetInfraProvidersResponseDto,
    UpdateInfraBillingNodeRequestDto,
    UpdateInfraBillingNodeResponseDto,
    UpdateInfraProviderRequestDto,
    UpdateInfraProviderResponseDto,
} from './dtos';
import { InfraBillingService } from './infra-billing.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.INFRA_BILLING.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(INFRA_BILLING_CONTROLLER)
export class InfraBillingController {
    constructor(private readonly infraBillingService: InfraBillingService) {}

    @ApiOkResponse({
        type: GetInfraProvidersResponseDto,
        description: 'Infra providers retrieved successfully',
    })
    @Endpoint({
        command: GetInfraProvidersCommand,
        httpCode: HttpStatus.OK,
    })
    async getInfraProviders(): Promise<GetInfraProvidersResponseDto> {
        const result = await this.infraBillingService.getInfraProviders();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'Infra provider not found',
    })
    @ApiOkResponse({
        type: GetInfraProviderByUuidResponseDto,
        description: 'Infra provider retrieved successfully',
    })
    @Endpoint({
        command: GetInfraProviderByUuidCommand,
        httpCode: HttpStatus.OK,
    })
    async getInfraProviderByUuid(
        @Param('uuid') uuid: string,
    ): Promise<GetInfraProviderByUuidResponseDto> {
        const result = await this.infraBillingService.getInfraProviderByUuid(uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: DeleteInfraProviderByUuidResponseDto,
        description: 'Infra provider deleted successfully',
    })
    @Endpoint({
        command: DeleteInfraProviderByUuidCommand,
        httpCode: HttpStatus.OK,
    })
    async deleteInfraProviderByUuid(
        @Param('uuid') uuid: string,
    ): Promise<DeleteInfraProviderByUuidResponseDto> {
        const result = await this.infraBillingService.deleteInfraProviderByUuid(uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiCreatedResponse({
        type: CreateInfraProviderResponseDto,
        description: 'Infra provider created successfully',
    })
    @Endpoint({
        command: CreateInfraProviderCommand,
        httpCode: HttpStatus.CREATED,
        apiBody: CreateInfraProviderRequestDto,
    })
    async createInfraProvider(
        @Body() dto: CreateInfraProviderRequestDto,
    ): Promise<CreateInfraProviderResponseDto> {
        const result = await this.infraBillingService.createInfraProvider(dto);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: UpdateInfraProviderResponseDto,
        description: 'Infra provider updated successfully',
    })
    @Endpoint({
        command: UpdateInfraProviderCommand,
        httpCode: HttpStatus.OK,
        apiBody: UpdateInfraProviderRequestDto,
    })
    async updateInfraProvider(
        @Body() dto: UpdateInfraProviderRequestDto,
    ): Promise<UpdateInfraProviderResponseDto> {
        const result = await this.infraBillingService.updateInfraProvider(dto);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiCreatedResponse({
        type: CreateInfraBillingHistoryRecordResponseDto,
        description: 'Infra billing history record created successfully',
    })
    @Endpoint({
        command: CreateInfraBillingHistoryRecordCommand,
        httpCode: HttpStatus.CREATED,
        apiBody: CreateInfraBillingHistoryRecordRequestDto,
    })
    async createInfraBillingHistoryRecord(
        @Body() dto: CreateInfraBillingHistoryRecordRequestDto,
    ): Promise<CreateInfraBillingHistoryRecordResponseDto> {
        const result = await this.infraBillingService.createInfraBillingHistoryRecord(dto);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: GetInfraBillingHistoryRecordsResponseDto,
        description: 'Infra billing history records retrieved successfully',
    })
    @Endpoint({
        command: GetInfraBillingHistoryRecordsCommand,
        httpCode: HttpStatus.OK,
    })
    async getInfraBillingHistoryRecords(
        @Query() dto: GetInfraBillingHistoryRecordsRequestDto,
    ): Promise<GetInfraBillingHistoryRecordsResponseDto> {
        const result = await this.infraBillingService.getInfraBillingHistoryRecords(dto);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: DeleteInfraBillingHistoryRecordByUuidResponseDto,
        description: 'Infra billing history record deleted successfully',
    })
    @Endpoint({
        command: DeleteInfraBillingHistoryRecordCommand,
        httpCode: HttpStatus.OK,
    })
    async deleteInfraBillingHistoryRecordByUuid(
        @Param('uuid') uuid: string,
    ): Promise<DeleteInfraBillingHistoryRecordByUuidResponseDto> {
        const result = await this.infraBillingService.deleteInfraBillingHistoryRecordByUuid(uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: GetInfraBillingNodesResponseDto,
        description: 'Infra billing nodes retrieved successfully',
    })
    @Endpoint({
        command: GetInfraBillingNodesCommand,
        httpCode: HttpStatus.OK,
    })
    async getBillingNodes(): Promise<GetInfraBillingNodesResponseDto> {
        const result = await this.infraBillingService.getBillingNodes();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: UpdateInfraBillingNodeResponseDto,
        description: 'Infra billing node updated successfully',
    })
    @Endpoint({
        command: UpdateInfraBillingNodeCommand,
        httpCode: HttpStatus.OK,
        apiBody: UpdateInfraBillingNodeRequestDto,
    })
    async updateInfraBillingNode(
        @Body() dto: UpdateInfraBillingNodeRequestDto,
    ): Promise<UpdateInfraBillingNodeResponseDto> {
        const result = await this.infraBillingService.updateInfraBillingNode(dto);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiCreatedResponse({
        type: CreateInfraBillingNodeResponseDto,
        description: 'Infra billing node created successfully',
    })
    @Endpoint({
        command: CreateInfraBillingNodeCommand,
        httpCode: HttpStatus.CREATED,
        apiBody: CreateInfraBillingNodeRequestDto,
    })
    async createInfraBillingNode(
        @Body() dto: CreateInfraBillingNodeRequestDto,
    ): Promise<CreateInfraBillingNodeResponseDto> {
        const result = await this.infraBillingService.createInfraBillingNode(dto);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: DeleteInfraBillingNodeByUuidResponseDto,
        description: 'Infra billing node deleted successfully',
    })
    @Endpoint({
        command: DeleteInfraBillingNodeByUuidCommand,
        httpCode: HttpStatus.OK,
    })
    async deleteInfraBillingNodeByUuid(
        @Param('uuid') uuid: string,
    ): Promise<DeleteInfraBillingNodeByUuidResponseDto> {
        const result = await this.infraBillingService.deleteInfraBillingNodeByUuid(uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
