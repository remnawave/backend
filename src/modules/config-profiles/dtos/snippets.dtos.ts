import { createZodDto } from 'nestjs-zod';

import {
    CreateSnippetCommand,
    DeleteSnippetCommand,
    GetSnippetsCommand,
    UpdateSnippetCommand,
} from '@libs/contracts/commands';

export class CreateSnippetRequestDto extends createZodDto(CreateSnippetCommand.RequestSchema) {}

export class CreateSnippetResponseDto extends createZodDto(CreateSnippetCommand.ResponseSchema) {}

export class UpdateSnippetRequestDto extends createZodDto(UpdateSnippetCommand.RequestSchema) {}

export class UpdateSnippetResponseDto extends createZodDto(UpdateSnippetCommand.ResponseSchema) {}

export class DeleteSnippetRequestDto extends createZodDto(DeleteSnippetCommand.RequestSchema) {}

export class DeleteSnippetResponseDto extends createZodDto(DeleteSnippetCommand.ResponseSchema) {}

export class GetSnippetsResponseDto extends createZodDto(GetSnippetsCommand.ResponseSchema) {}
