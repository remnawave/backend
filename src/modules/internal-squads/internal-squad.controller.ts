import {
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { Body, Controller, HttpStatus, Param, UseFilters, UseGuards } from '@nestjs/common';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { Endpoint } from '@common/decorators/base-endpoint/base-endpoint';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    AddUsersToInternalSquadCommand,
    CreateInternalSquadCommand,
    DeleteInternalSquadCommand,
    DeleteUsersFromInternalSquadCommand,
    GetInternalSquadAccessibleNodesCommand,
    GetInternalSquadByUuidCommand,
    GetInternalSquadsCommand,
    UpdateInternalSquadCommand,
} from '@libs/contracts/commands';
import { CONTROLLERS_INFO, INTERNAL_SQUADS_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    AddUsersToInternalSquadResponseDto,
    CreateInternalSquadRequestDto,
    CreateInternalSquadResponseDto,
    DeleteInternalSquadResponseDto,
    GetInternalSquadAccessibleNodesRequestDto,
    GetInternalSquadAccessibleNodesResponseDto,
    GetInternalSquadByUuidResponseDto,
    GetInternalSquadsResponseDto,
    RemoveUsersFromInternalSquadResponseDto,
    UpdateInternalSquadRequestDto,
    UpdateInternalSquadResponseDto,
} from './dtos';
import { InternalSquadService } from './internal-squad.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.INTERNAL_SQUADS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(INTERNAL_SQUADS_CONTROLLER)
export class InternalSquadController {
    constructor(private readonly internalSquadService: InternalSquadService) {}

    @ApiOkResponse({
        type: GetInternalSquadsResponseDto,
        description: 'Internal squads retrieved successfully',
    })
    @Endpoint({
        command: GetInternalSquadsCommand,
        httpCode: HttpStatus.OK,
    })
    async getInternalSquads(): Promise<GetInternalSquadsResponseDto> {
        const result = await this.internalSquadService.getInternalSquads();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: GetInternalSquadByUuidResponseDto,
        description: 'Internal squad retrieved successfully',
    })
    @Endpoint({
        command: GetInternalSquadByUuidCommand,
        httpCode: HttpStatus.OK,
    })
    async getInternalSquadByUuid(
        @Param('uuid') uuid: string,
    ): Promise<GetInternalSquadByUuidResponseDto> {
        const result = await this.internalSquadService.getInternalSquadByUuid(uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiConflictResponse({
        description: 'Internal squad already exists',
    })
    @ApiCreatedResponse({
        type: CreateInternalSquadResponseDto,
        description: 'Internal squad created successfully',
    })
    @Endpoint({
        command: CreateInternalSquadCommand,
        httpCode: HttpStatus.CREATED,
    })
    async createInternalSquad(
        @Body() createInternalSquadDto: CreateInternalSquadRequestDto,
    ): Promise<CreateInternalSquadResponseDto> {
        const result = await this.internalSquadService.createInternalSquad(
            createInternalSquadDto.name,
            createInternalSquadDto.inbounds,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'Internal squad not found',
    })
    @ApiOkResponse({
        type: GetInternalSquadAccessibleNodesResponseDto,
        description: 'Internal squad accessible nodes fetched successfully',
    })
    @ApiParam({
        name: 'uuid',
        type: String,
        description: 'UUID of the internal squad',
        required: true,
    })
    @Endpoint({
        command: GetInternalSquadAccessibleNodesCommand,
        httpCode: HttpStatus.OK,
    })
    async getInternalSquadAccessibleNodes(
        @Param() paramData: GetInternalSquadAccessibleNodesRequestDto,
    ): Promise<GetInternalSquadAccessibleNodesResponseDto> {
        const result = await this.internalSquadService.getInternalSquadAccessibleNodes(
            paramData.uuid,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiConflictResponse({
        description: 'Internal squad already exists',
    })
    @ApiNotFoundResponse({
        description: 'Internal squad not found',
    })
    @ApiOkResponse({
        type: UpdateInternalSquadResponseDto,
        description: 'Internal squad updated successfully',
    })
    @Endpoint({
        command: UpdateInternalSquadCommand,
        httpCode: HttpStatus.OK,
    })
    async updateInternalSquad(
        @Body() updateInternalSquadDto: UpdateInternalSquadRequestDto,
    ): Promise<UpdateInternalSquadResponseDto> {
        const result = await this.internalSquadService.updateInternalSquad(
            updateInternalSquadDto.uuid,
            updateInternalSquadDto.name,
            updateInternalSquadDto.inbounds,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'Internal squad not found',
    })
    @ApiOkResponse({
        type: DeleteInternalSquadResponseDto,
        description: 'Internal squad deleted successfully',
    })
    @Endpoint({
        command: DeleteInternalSquadCommand,
        httpCode: HttpStatus.OK,
    })
    async deleteInternalSquad(
        @Param('uuid') uuid: string,
    ): Promise<DeleteInternalSquadResponseDto> {
        const result = await this.internalSquadService.deleteInternalSquad(uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'Internal squad not found',
    })
    @ApiOkResponse({
        type: AddUsersToInternalSquadResponseDto,
        description: 'Task added to internal job queue',
    })
    @Endpoint({
        command: AddUsersToInternalSquadCommand,
        httpCode: HttpStatus.OK,
    })
    async addUsersToInternalSquad(
        @Param('uuid') uuid: string,
    ): Promise<AddUsersToInternalSquadResponseDto> {
        const result = await this.internalSquadService.addUsersToInternalSquad(uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'Internal squad not found',
    })
    @ApiOkResponse({
        type: RemoveUsersFromInternalSquadResponseDto,
        description: 'Task added to internal job queue',
    })
    @Endpoint({
        command: DeleteUsersFromInternalSquadCommand,
        httpCode: HttpStatus.OK,
    })
    async removeUsersFromInternalSquad(
        @Param('uuid') uuid: string,
    ): Promise<RemoveUsersFromInternalSquadResponseDto> {
        const result = await this.internalSquadService.removeUsersFromInternalSquad(uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
