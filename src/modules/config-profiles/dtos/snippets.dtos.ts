import { createZodDto } from 'nestjs-zod';

import {
    CreateSnippetCommand,
    DeleteSnippetCommand,
    GetSnippetsCommand,
    SyncSnippetCommand,
    UpdateSnippetCommand,
} from '@libs/contracts/commands';

export class CreateSnippetBodyDto extends createZodDto(CreateSnippetCommand.RequestBodySchema) {}

export class CreateSnippetResponseDto extends createZodDto(CreateSnippetCommand.ResponseSchema) {}

export class UpdateSnippetBodyDto extends createZodDto(UpdateSnippetCommand.RequestBodySchema) {}

export class UpdateSnippetResponseDto extends createZodDto(UpdateSnippetCommand.ResponseSchema) {}

export class DeleteSnippetBodyDto extends createZodDto(DeleteSnippetCommand.RequestBodySchema) {}

export class GetSnippetsResponseDto extends createZodDto(GetSnippetsCommand.ResponseSchema) {}

export class SyncSnippetBodyDto extends createZodDto(SyncSnippetCommand.RequestBodySchema) {}
