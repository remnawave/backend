import { Body, Controller, HttpStatus, Param, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiTags } from '@nestjs/swagger';

import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { ApiScopeResource } from '@common/decorators/scopes';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { RolesGuard } from '@common/guards/roles';
import { ScopesGuard } from '@common/guards/scopes';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { CONFIG_PROFILES_CONTROLLER, CONTROLLERS_INFO } from '@libs/contracts/api';
import {
    CreateConfigProfileCommand,
    DeleteConfigProfileCommand,
    GetAllInboundsCommand,
    GetComputedConfigProfileByUuidCommand,
    GetConfigProfileByUuidCommand,
    GetConfigProfilesCommand,
    GetInboundsByProfileUuidCommand,
    ReorderConfigProfileCommand,
    UpdateConfigProfileCommand,
} from '@libs/contracts/commands';
import {
    GetConfigProfilesTagsCommand,
    SetConfigProfileTagsCommand,
} from '@libs/contracts/commands';
import { ROLE } from '@libs/contracts/constants';

import { ConfigProfileService } from './config-profile.service';
import {
    CreateConfigProfileBodyDto,
    CreateConfigProfileResponseDto,
    DeleteConfigProfileParamDto,
    GetAllInboundsResponseDto,
    GetComputedConfigProfileByUuidParamDto,
    GetComputedConfigProfileByUuidResponseDto,
    GetConfigProfileByUuidParamDto,
    GetConfigProfileByUuidResponseDto,
    GetConfigProfilesResponseDto,
    GetInboundsByProfileUuidParamDto,
    GetInboundsByProfileUuidResponseDto,
    ReorderConfigProfilesBodyDto,
    ReorderConfigProfilesResponseDto,
    UpdateConfigProfileBodyDto,
    UpdateConfigProfileResponseDto,
} from './dtos';
import {
    GetConfigProfilesTagsResponseDto,
    SetConfigProfilesTagsBodyDto,
    SetConfigProfilesTagsResponseDto,
} from './dtos';

@ApiBearerAuth('Authorization')
@ApiScopeResource(CONTROLLERS_INFO.CONFIG_PROFILES.resource)
@ApiTags(CONTROLLERS_INFO.CONFIG_PROFILES.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard, ScopesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(CONFIG_PROFILES_CONTROLLER)
export class ConfigProfileController {
    constructor(private readonly configProfileService: ConfigProfileService) {}

    @Endpoint({
        command: GetConfigProfilesTagsCommand,
        httpCode: HttpStatus.OK,
        type: GetConfigProfilesTagsResponseDto,
    })
    async getTags(): Promise<GetConfigProfilesTagsResponseDto> {
        const result = await this.configProfileService.getTags();

        const data = errorHandler(result);
        return {
            response: { tags: data },
        };
    }

    @Endpoint({
        command: SetConfigProfileTagsCommand,
        httpCode: HttpStatus.OK,
        type: SetConfigProfilesTagsResponseDto,
    })
    async setTags(
        @Body() body: SetConfigProfilesTagsBodyDto,
    ): Promise<SetConfigProfilesTagsResponseDto> {
        const result = await this.configProfileService.setTags(body.uuid, body.tags);

        const data = errorHandler(result);
        return {
            response: { uuid: body.uuid, tags: data },
        };
    }


    @Endpoint({
        command: GetConfigProfilesCommand,
        httpCode: HttpStatus.OK,
        type: GetConfigProfilesResponseDto,
    })
    async getConfigProfiles(): Promise<GetConfigProfilesResponseDto> {
        const result = await this.configProfileService.getConfigProfiles();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetAllInboundsCommand,
        httpCode: HttpStatus.OK,
        type: GetAllInboundsResponseDto,
    })
    async getAllInbounds(): Promise<GetAllInboundsResponseDto> {
        const result = await this.configProfileService.getAllInbounds();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetInboundsByProfileUuidCommand,
        httpCode: HttpStatus.OK,
        type: GetInboundsByProfileUuidResponseDto,
    })
    async getInboundsByProfileUuid(
        @Param() param: GetInboundsByProfileUuidParamDto,
    ): Promise<GetInboundsByProfileUuidResponseDto> {
        const result = await this.configProfileService.getInboundsByProfileUuid(param.uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetConfigProfileByUuidCommand,
        httpCode: HttpStatus.OK,
        type: GetConfigProfileByUuidResponseDto,
    })
    async getConfigProfileByUuid(
        @Param() param: GetConfigProfileByUuidParamDto,
    ): Promise<GetConfigProfileByUuidResponseDto> {
        const result = await this.configProfileService.getConfigProfileByUUID(param.uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetComputedConfigProfileByUuidCommand,
        httpCode: HttpStatus.OK,
        type: GetComputedConfigProfileByUuidResponseDto,
    })
    async getComputedConfigProfileByUuid(
        @Param() param: GetComputedConfigProfileByUuidParamDto,
    ): Promise<GetComputedConfigProfileByUuidResponseDto> {
        const result = await this.configProfileService.getComputedConfigProfileByUUID(param.uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: DeleteConfigProfileCommand,
        httpCode: HttpStatus.NO_CONTENT,
    })
    async deleteConfigProfileByUuid(@Param() param: DeleteConfigProfileParamDto) {
        const result = await this.configProfileService.deleteConfigProfileByUUID(param.uuid);

        errorHandler(result);
        return;
    }

    @ApiConflictResponse({
        description:
            'Config profile name already exists or inbound tags are not unique. Inbound tags must be unique in global scope.',
    })
    @Endpoint({
        command: CreateConfigProfileCommand,
        httpCode: HttpStatus.CREATED,
        type: CreateConfigProfileResponseDto,
    })
    async createConfigProfile(
        @Body() body: CreateConfigProfileBodyDto,
    ): Promise<CreateConfigProfileResponseDto> {
        const result = await this.configProfileService.createConfigProfile(body.name, body.config);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiConflictResponse({
        description:
            'Config profile name already exists or inbound tags are not unique. Inbound tags must be unique in global scope.',
    })
    @Endpoint({
        command: UpdateConfigProfileCommand,
        httpCode: HttpStatus.OK,
        type: UpdateConfigProfileResponseDto,
    })
    async updateConfigProfile(
        @Body() body: UpdateConfigProfileBodyDto,
    ): Promise<UpdateConfigProfileResponseDto> {
        const result = await this.configProfileService.updateConfigProfile(
            body.uuid,
            body.name,
            body.config,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: ReorderConfigProfileCommand,
        httpCode: HttpStatus.OK,
        type: ReorderConfigProfilesResponseDto,
    })
    async reorderConfigProfiles(
        @Body() body: ReorderConfigProfilesBodyDto,
    ): Promise<ReorderConfigProfilesResponseDto> {
        const result = await this.configProfileService.reorderConfigProfiles(body);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

}
