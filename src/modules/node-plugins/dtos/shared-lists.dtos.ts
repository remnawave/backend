import { createZodDto } from 'nestjs-zod';

import {
    CreateSharedListCommand,
    DeleteSharedListCommand,
    GetSharedListCommand,
    GetSharedListsCommand,
    SyncSharedListCommand,
    UpdateSharedListCommand,
} from '@libs/contracts/commands';

export class GetSharedListsResponseDto extends createZodDto(GetSharedListsCommand.ResponseSchema) {} // GET_ALL

export class GetSharedListParamDto extends createZodDto(GetSharedListCommand.RequestParamSchema) {} // GET BY NAME
export class GetSharedListResponseDto extends createZodDto(GetSharedListCommand.ResponseSchema) {} // GET BY NAME

export class CreateSharedListBodyDto extends createZodDto(
    CreateSharedListCommand.RequestBodySchema,
) {} // CREATE
export class CreateSharedListResponseDto extends createZodDto(
    CreateSharedListCommand.ResponseSchema,
) {} // CREATE

export class UpdateSharedListBodyDto extends createZodDto(
    UpdateSharedListCommand.RequestBodySchema,
) {} // UPDATE
export class UpdateSharedListResponseDto extends createZodDto(
    UpdateSharedListCommand.ResponseSchema,
) {} // UPDATE

export class DeleteSharedListParamDto extends createZodDto(
    DeleteSharedListCommand.RequestParamSchema,
) {} // DELETE

export class SyncSharedListBodyDto extends createZodDto(SyncSharedListCommand.RequestBodySchema) {} // SYNC
