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
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    CreateConfigProfileCommand,
    DeleteConfigProfileCommand,
    GetAllInboundsCommand,
    GetComputedConfigProfileByUuidCommand,
    GetConfigProfileByUuidCommand,
    GetConfigProfilesCommand,
    GetInboundsByProfileUuidCommand,
    UpdateConfigProfileCommand,
} from '@libs/contracts/commands';
import { CONFIG_PROFILES_CONTROLLER, CONTROLLERS_INFO } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    CreateConfigProfileRequestDto,
    CreateConfigProfileResponseDto,
    DeleteConfigProfileResponseDto,
    GetAllInboundsResponseDto,
    GetComputedConfigProfileByUuidResponseDto,
    GetConfigProfileByUuidResponseDto,
    GetConfigProfilesResponseDto,
    GetInboundsByProfileUuidResponseDto,
    UpdateConfigProfileRequestDto,
    UpdateConfigProfileResponseDto,
} from './dtos';
import { ConfigProfileService } from './config-profile.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.CONFIG_PROFILES.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(CONFIG_PROFILES_CONTROLLER)
export class ConfigProfileController {
    constructor(private readonly configProfileService: ConfigProfileService) {}

    @ApiOkResponse({
        type: GetConfigProfilesResponseDto,
        description: 'Config profiles retrieved successfully',
    })
    @Endpoint({
        command: GetConfigProfilesCommand,
        httpCode: HttpStatus.OK,
    })
    async getConfigProfiles(): Promise<GetConfigProfilesResponseDto> {
        const result = await this.configProfileService.getConfigProfiles();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: GetAllInboundsResponseDto,
        description: 'Inbounds retrieved successfully',
    })
    @Endpoint({
        command: GetAllInboundsCommand,
        httpCode: HttpStatus.OK,
    })
    async getAllInbounds(): Promise<GetAllInboundsResponseDto> {
        const result = await this.configProfileService.getAllInbounds();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'Config profile not found',
    })
    @ApiOkResponse({
        type: GetInboundsByProfileUuidResponseDto,
        description: 'Inbounds retrieved successfully',
    })
    @Endpoint({
        command: GetInboundsByProfileUuidCommand,
        httpCode: HttpStatus.OK,
    })
    async getInboundsByProfileUuid(
        @Param('uuid') profileUuid: string,
    ): Promise<GetInboundsByProfileUuidResponseDto> {
        const result = await this.configProfileService.getInboundsByProfileUuid(profileUuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'Config profile not found',
    })
    @ApiOkResponse({
        type: GetConfigProfileByUuidResponseDto,
        description: 'Config profile retrieved successfully',
    })
    @Endpoint({
        command: GetConfigProfileByUuidCommand,
        httpCode: HttpStatus.OK,
    })
    async getConfigProfileByUuid(
        @Param('uuid') uuid: string,
    ): Promise<GetConfigProfileByUuidResponseDto> {
        const result = await this.configProfileService.getConfigProfileByUUID(uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'Config profile not found',
    })
    @ApiOkResponse({
        type: GetComputedConfigProfileByUuidResponseDto,
        description: 'Computed config profile retrieved successfully',
    })
    @Endpoint({
        command: GetComputedConfigProfileByUuidCommand,
        httpCode: HttpStatus.OK,
    })
    async getComputedConfigProfileByUuid(
        @Param('uuid') uuid: string,
    ): Promise<GetComputedConfigProfileByUuidResponseDto> {
        const result = await this.configProfileService.getComputedConfigProfileByUUID(uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'Config profile not found',
    })
    @ApiOkResponse({
        type: DeleteConfigProfileResponseDto,
        description: 'Config profile deleted successfully',
    })
    @Endpoint({
        command: DeleteConfigProfileCommand,
        httpCode: HttpStatus.OK,
    })
    async deleteConfigProfileByUuid(
        @Param('uuid') uuid: string,
    ): Promise<DeleteConfigProfileResponseDto> {
        const result = await this.configProfileService.deleteConfigProfileByUUID(uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiConflictResponse({
        description:
            'Config profile name already exists or inbound tags are not unique. Inbound tags must be unique in global scope.',
    })
    @ApiCreatedResponse({
        type: CreateConfigProfileResponseDto,
        description: 'Config profile created successfully',
    })
    @Endpoint({
        command: CreateConfigProfileCommand,
        httpCode: HttpStatus.CREATED,
    })
    async createConfigProfile(
        @Body() createConfigProfileDto: CreateConfigProfileRequestDto,
    ): Promise<CreateConfigProfileResponseDto> {
        const result = await this.configProfileService.createConfigProfile(
            createConfigProfileDto.name,
            createConfigProfileDto.config,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiConflictResponse({
        description:
            'Config profile name already exists or inbound tags are not unique. Inbound tags must be unique in global scope.',
    })
    @ApiNotFoundResponse({
        description: 'Config profile not found',
    })
    @ApiOkResponse({
        type: UpdateConfigProfileResponseDto,
        description: 'Config profile updated successfully',
    })
    @Endpoint({
        command: UpdateConfigProfileCommand,
        httpCode: HttpStatus.OK,
    })
    async updateConfigProfile(
        @Body() updateConfigProfileDto: UpdateConfigProfileRequestDto,
    ): Promise<UpdateConfigProfileResponseDto> {
        const result = await this.configProfileService.updateConfigProfile(
            updateConfigProfileDto.uuid,
            updateConfigProfileDto.name,
            updateConfigProfileDto.config,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
