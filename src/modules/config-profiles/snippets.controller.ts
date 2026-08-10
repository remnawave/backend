import { Body, Controller, HttpStatus, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiTags } from '@nestjs/swagger';

import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { ApiScopeResource } from '@common/decorators/scopes';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { RolesGuard } from '@common/guards/roles';
import { ScopesGuard } from '@common/guards/scopes';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { CONTROLLERS_INFO, SNIPPETS_CONTROLLER } from '@libs/contracts/api';
import {
    CreateSnippetCommand,
    DeleteSnippetCommand,
    GetSnippetsCommand,
    SyncSnippetCommand,
    UpdateSnippetCommand,
} from '@libs/contracts/commands';
import { ROLE } from '@libs/contracts/constants';

import {
    CreateSnippetBodyDto,
    CreateSnippetResponseDto,
    DeleteSnippetBodyDto,
    GetSnippetsResponseDto,
    SyncSnippetBodyDto,
    UpdateSnippetBodyDto,
    UpdateSnippetResponseDto,
} from './dtos';
import { SnippetsService } from './snippets.service';

@ApiBearerAuth('Authorization')
@ApiScopeResource(CONTROLLERS_INFO.SNIPPETS.resource)
@ApiTags(CONTROLLERS_INFO.SNIPPETS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard, ScopesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(SNIPPETS_CONTROLLER)
export class SnippetsController {
    constructor(private readonly snippetsService: SnippetsService) {}

    @Endpoint({
        command: GetSnippetsCommand,
        httpCode: HttpStatus.OK,
        type: GetSnippetsResponseDto,
    })
    async getSnippets(): Promise<GetSnippetsResponseDto> {
        const result = await this.snippetsService.getSnippets();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: SyncSnippetCommand,
        httpCode: HttpStatus.ACCEPTED,
    })
    async syncSnippet(@Body() syncSnippetDto: SyncSnippetBodyDto) {
        const result = await this.snippetsService.syncSnippet(syncSnippetDto.name);

        errorHandler(result);
        return;
    }

    @Endpoint({
        command: DeleteSnippetCommand,
        httpCode: HttpStatus.NO_CONTENT,
    })
    async deleteSnippetByName(@Body() deleteSnippetByNameDto: DeleteSnippetBodyDto) {
        const result = await this.snippetsService.deleteSnippetByName(deleteSnippetByNameDto.name);

        errorHandler(result);
        return;
    }

    @ApiConflictResponse({
        description: 'Snippet name already exists.',
    })
    @Endpoint({
        command: CreateSnippetCommand,
        httpCode: HttpStatus.CREATED,
        type: CreateSnippetResponseDto,
    })
    async createSnippet(
        @Body() createSnippetDto: CreateSnippetBodyDto,
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
    @Endpoint({
        command: UpdateSnippetCommand,
        httpCode: HttpStatus.OK,
        type: UpdateSnippetResponseDto,
    })
    async updateSnippet(
        @Body() updateSnippetDto: UpdateSnippetBodyDto,
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
