import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiParam,
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
    GetNodeMetadataCommand,
    GetUserMetadataCommand,
    UpsertNodeMetadataCommand,
    UpsertUserMetadataCommand,
} from '@libs/contracts/commands';
import { CONTROLLERS_INFO, METADATA_CONTROLLER } from '@libs/contracts/api';
import { ERRORS, ROLE } from '@libs/contracts/constants';

import {
    GetNodeMetadataRequestParamDto,
    GetNodeMetadataResponseDto,
    GetUserMetadataRequestParamDto,
    GetUserMetadataResponseDto,
    UpsertNodeMetadataRequestBodyDto,
    UpsertNodeMetadataResponseDto,
    UpsertUserMetadataRequestBodyDto,
    UpsertUserMetadataResponseDto,
} from './dtos';
import { MetadataService } from './metadata.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.METADATA.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(METADATA_CONTROLLER)
export class MetadataController {
    constructor(private readonly metadataService: MetadataService) {}

    @ApiNotFoundResponse({
        description: 'User or Metadata not found (see errorCode for more details)',
        schema: {
            oneOf: [
                {
                    example: {
                        timestamp: 'omitted',
                        path: 'omitted',
                        message: ERRORS.USER_NOT_FOUND.message,
                        errorCode: ERRORS.USER_NOT_FOUND.code,
                    },
                    properties: {
                        timestamp: { type: 'string' },
                        path: { type: 'string' },
                        message: { type: 'string' },
                        errorCode: {
                            type: 'string',
                            enum: [ERRORS.USER_NOT_FOUND.code] as const,
                        },
                    },
                },
                {
                    example: {
                        timestamp: 'omitted',
                        path: 'omitted',
                        message: ERRORS.METADATA_NOT_FOUND.message,
                        errorCode: ERRORS.METADATA_NOT_FOUND.code,
                    },
                    properties: {
                        timestamp: { type: 'string' },
                        path: { type: 'string' },
                        message: { type: 'string' },
                        errorCode: {
                            type: 'string',
                            enum: [ERRORS.METADATA_NOT_FOUND.code] as const,
                        },
                    },
                },
            ],
        },
    })
    @ApiOkResponse({
        type: GetUserMetadataResponseDto,
        description: 'User Metadata retrieved successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'UUID of the user', required: true })
    @Endpoint({
        command: GetUserMetadataCommand,
        httpCode: HttpStatus.OK,
    })
    async getUserMetadata(
        @Param() params: GetUserMetadataRequestParamDto,
    ): Promise<GetUserMetadataResponseDto> {
        const result = await this.metadataService.getUserMetadata(params.uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'User not found (see errorCode for more details)',
        schema: {
            example: {
                timestamp: 'omitted',
                path: 'omitted',
                message: ERRORS.USER_NOT_FOUND.message,
                errorCode: ERRORS.USER_NOT_FOUND.code,
            },
            properties: {
                timestamp: { type: 'string' },
                path: { type: 'string' },
                message: { type: 'string' },
                errorCode: {
                    type: 'string',
                    enum: [ERRORS.USER_NOT_FOUND.code] as const,
                },
            },
        },
    })
    @ApiOkResponse({
        type: UpsertUserMetadataResponseDto,
        description: 'User Metadata upserted successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'UUID of the user', required: true })
    @Endpoint({
        command: UpsertUserMetadataCommand,
        httpCode: HttpStatus.OK,
        apiBody: UpsertUserMetadataRequestBodyDto,
    })
    async upsertUserMetadata(
        @Param() params: GetUserMetadataRequestParamDto,
        @Body() body: UpsertUserMetadataRequestBodyDto,
    ): Promise<UpsertUserMetadataResponseDto> {
        const result = await this.metadataService.upsertUserMetadata(params.uuid, body.metadata);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'Node or Metadata not found (see errorCode for more details)',
        schema: {
            oneOf: [
                {
                    example: {
                        timestamp: 'omitted',
                        path: 'omitted',
                        message: ERRORS.NODE_NOT_FOUND.message,
                        errorCode: ERRORS.NODE_NOT_FOUND.code,
                    },
                    properties: {
                        timestamp: { type: 'string' },
                        path: { type: 'string' },
                        message: { type: 'string' },
                        errorCode: {
                            type: 'string',
                            enum: [ERRORS.NODE_NOT_FOUND.code] as const,
                        },
                    },
                },
                {
                    example: {
                        timestamp: 'omitted',
                        path: 'omitted',
                        message: ERRORS.METADATA_NOT_FOUND.message,
                        errorCode: ERRORS.METADATA_NOT_FOUND.code,
                    },
                    properties: {
                        timestamp: { type: 'string' },
                        path: { type: 'string' },
                        message: { type: 'string' },
                        errorCode: {
                            type: 'string',
                            enum: [ERRORS.METADATA_NOT_FOUND.code] as const,
                        },
                    },
                },
            ],
        },
    })
    @ApiOkResponse({
        type: GetNodeMetadataResponseDto,
        description: 'Node Metadata retrieved successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'UUID of the node', required: true })
    @Endpoint({
        command: GetNodeMetadataCommand,
        httpCode: HttpStatus.OK,
    })
    async getNodeMetadata(
        @Param() params: GetNodeMetadataRequestParamDto,
    ): Promise<GetNodeMetadataResponseDto> {
        const result = await this.metadataService.getNodeMetadata(params.uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'Node not found (see errorCode for more details)',
        schema: {
            example: {
                timestamp: 'omitted',
                path: 'omitted',
                message: ERRORS.NODE_NOT_FOUND.message,
                errorCode: ERRORS.NODE_NOT_FOUND.code,
            },
            properties: {
                timestamp: { type: 'string' },
                path: { type: 'string' },
                message: { type: 'string' },
                errorCode: {
                    type: 'string',
                    enum: [ERRORS.NODE_NOT_FOUND.code] as const,
                },
            },
        },
    })
    @ApiOkResponse({
        type: UpsertNodeMetadataResponseDto,
        description: 'Node Metadata upserted successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'UUID of the node', required: true })
    @Endpoint({
        command: UpsertNodeMetadataCommand,
        httpCode: HttpStatus.OK,
        apiBody: UpsertNodeMetadataRequestBodyDto,
    })
    async upsertNodeMetadata(
        @Param() params: GetNodeMetadataRequestParamDto,
        @Body() body: UpsertNodeMetadataRequestBodyDto,
    ): Promise<UpsertNodeMetadataResponseDto> {
        const result = await this.metadataService.upsertNodeMetadata(params.uuid, body.metadata);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
