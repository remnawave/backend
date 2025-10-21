import {
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
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
    AddUsersToExternalSquadCommand,
    CreateExternalSquadCommand,
    DeleteExternalSquadCommand,
    DeleteUsersFromExternalSquadCommand,
    GetExternalSquadByUuidCommand,
    GetExternalSquadsCommand,
    UpdateExternalSquadCommand,
} from '@libs/contracts/commands';
import { CONTROLLERS_INFO, EXTERNAL_SQUADS_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    AddUsersToExternalSquadResponseDto,
    CreateExternalSquadRequestDto,
    CreateExternalSquadResponseDto,
    DeleteExternalSquadResponseDto,
    GetExternalSquadByUuidResponseDto,
    GetExternalSquadsResponseDto,
    RemoveUsersFromExternalSquadResponseDto,
    UpdateExternalSquadRequestDto,
    UpdateExternalSquadResponseDto,
} from './dtos';
import { ExternalSquadService } from './external-squads.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.EXTERNAL_SQUADS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(EXTERNAL_SQUADS_CONTROLLER)
export class ExternalSquadController {
    constructor(private readonly externalSquadService: ExternalSquadService) {}

    @ApiOkResponse({
        type: GetExternalSquadsResponseDto,
        description: 'External squads retrieved successfully',
    })
    @Endpoint({
        command: GetExternalSquadsCommand,
        httpCode: HttpStatus.OK,
    })
    async getExternalSquads(): Promise<GetExternalSquadsResponseDto> {
        const result = await this.externalSquadService.getExternalSquads();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: GetExternalSquadByUuidResponseDto,
        description: 'External squad retrieved successfully',
    })
    @Endpoint({
        command: GetExternalSquadByUuidCommand,
        httpCode: HttpStatus.OK,
    })
    async getExternalSquadByUuid(
        @Param('uuid') uuid: string,
    ): Promise<GetExternalSquadByUuidResponseDto> {
        const result = await this.externalSquadService.getExternalSquadByUuid(uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiConflictResponse({
        description: 'External squad already exists',
    })
    @ApiCreatedResponse({
        type: CreateExternalSquadResponseDto,
        description: 'External squad created successfully',
    })
    @Endpoint({
        command: CreateExternalSquadCommand,
        httpCode: HttpStatus.CREATED,
    })
    async createExternalSquad(
        @Body() createExternalSquadDto: CreateExternalSquadRequestDto,
    ): Promise<CreateExternalSquadResponseDto> {
        const result = await this.externalSquadService.createExternalSquad(
            createExternalSquadDto.name,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiConflictResponse({
        description: 'External squad already exists',
    })
    @ApiNotFoundResponse({
        description: 'External squad not found',
    })
    @ApiOkResponse({
        type: UpdateExternalSquadResponseDto,
        description: 'External squad updated successfully',
    })
    @Endpoint({
        command: UpdateExternalSquadCommand,
        httpCode: HttpStatus.OK,
    })
    async updateExternalSquad(
        @Body() updateExternalSquadDto: UpdateExternalSquadRequestDto,
    ): Promise<UpdateExternalSquadResponseDto> {
        const result = await this.externalSquadService.updateExternalSquad(updateExternalSquadDto);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'External squad not found',
    })
    @ApiOkResponse({
        type: DeleteExternalSquadResponseDto,
        description: 'External squad deleted successfully',
    })
    @Endpoint({
        command: DeleteExternalSquadCommand,
        httpCode: HttpStatus.OK,
    })
    async deleteExternalSquad(
        @Param('uuid') uuid: string,
    ): Promise<DeleteExternalSquadResponseDto> {
        const result = await this.externalSquadService.deleteExternalSquad(uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'External squad not found',
    })
    @ApiOkResponse({
        type: AddUsersToExternalSquadResponseDto,
        description: 'Task added to external job queue',
    })
    @Endpoint({
        command: AddUsersToExternalSquadCommand,
        httpCode: HttpStatus.OK,
    })
    async addUsersToExternalSquad(
        @Param('uuid') uuid: string,
    ): Promise<AddUsersToExternalSquadResponseDto> {
        const result = await this.externalSquadService.addUsersToExternalSquad(uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'External squad not found',
    })
    @ApiOkResponse({
        type: RemoveUsersFromExternalSquadResponseDto,
        description: 'Task added to external job queue',
    })
    @Endpoint({
        command: DeleteUsersFromExternalSquadCommand,
        httpCode: HttpStatus.OK,
    })
    async removeUsersFromExternalSquad(
        @Param('uuid') uuid: string,
    ): Promise<RemoveUsersFromExternalSquadResponseDto> {
        const result = await this.externalSquadService.removeUsersFromExternalSquad(uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
