import {
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Body, Controller, HttpStatus, UseFilters, UseGuards } from '@nestjs/common';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    CreateSnippetCommand,
    DeleteSnippetCommand,
    GetSnippetsCommand,
    UpdateSnippetCommand,
} from '@libs/contracts/commands';
import { CONTROLLERS_INFO, SNIPPETS_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    CreateSnippetRequestDto,
    CreateSnippetResponseDto,
    DeleteSnippetRequestDto,
    DeleteSnippetResponseDto,
    GetSnippetsResponseDto,
    UpdateSnippetRequestDto,
    UpdateSnippetResponseDto,
} from './dtos';
import { SnippetsService } from './snippets.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.SNIPPETS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(SNIPPETS_CONTROLLER)
export class SnippetsController {
    constructor(private readonly snippetsService: SnippetsService) {}

    @ApiOkResponse({
        type: GetSnippetsResponseDto,
        description: 'Snippets retrieved successfully',
    })
    @Endpoint({
        command: GetSnippetsCommand,
        httpCode: HttpStatus.OK,
    })
    async getSnippets(): Promise<GetSnippetsResponseDto> {
        const result = await this.snippetsService.getSnippets();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'Snippet not found',
    })
    @ApiOkResponse({
        type: DeleteSnippetResponseDto,
        description: 'Snippet deleted successfully',
    })
    @Endpoint({
        command: DeleteSnippetCommand,
        httpCode: HttpStatus.OK,
    })
    async deleteSnippetByName(
        @Body() deleteSnippetByNameDto: DeleteSnippetRequestDto,
    ): Promise<DeleteSnippetResponseDto> {
        const result = await this.snippetsService.deleteSnippetByName(deleteSnippetByNameDto.name);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiConflictResponse({
        description: 'Snippet name already exists.',
    })
    @ApiCreatedResponse({
        type: CreateSnippetResponseDto,
        description: 'Snippet created successfully',
    })
    @Endpoint({
        command: CreateSnippetCommand,
        httpCode: HttpStatus.CREATED,
    })
    async createSnippet(
        @Body() createSnippetDto: CreateSnippetRequestDto,
    ): Promise<CreateSnippetResponseDto> {
        const result = await this.snippetsService.createSnippet(
            createSnippetDto.name,
            createSnippetDto.snippet,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiConflictResponse({
        description: 'Snippet name already exists.',
    })
    @ApiNotFoundResponse({
        description: 'Snippet not found',
    })
    @ApiOkResponse({
        type: UpdateSnippetResponseDto,
        description: 'Snippet updated successfully',
    })
    @Endpoint({
        command: UpdateSnippetCommand,
        httpCode: HttpStatus.OK,
    })
    async updateSnippet(
        @Body() updateSnippetDto: UpdateSnippetRequestDto,
    ): Promise<UpdateSnippetResponseDto> {
        const result = await this.snippetsService.updateSnippet(
            updateSnippetDto.name,
            updateSnippetDto.snippet,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
