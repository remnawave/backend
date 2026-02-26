import { createZodDto } from 'nestjs-zod';

import {
    GetNodePluginsCommand,
    UpdateNodePluginCommand,
    GetNodePluginCommand,
    DeleteNodePluginCommand,
    CreateNodePluginCommand,
    ReorderNodePluginCommand,
    CloneNodePluginCommand,
} from '@libs/contracts/commands';

export class GetNodePluginsResponseDto extends createZodDto(GetNodePluginsCommand.ResponseSchema) {} // GET_ALL

export class UpdateNodePluginRequestDto extends createZodDto(
    UpdateNodePluginCommand.RequestSchema,
) {} // UPDATE

export class UpdateNodePluginResponseDto extends createZodDto(
    UpdateNodePluginCommand.ResponseSchema,
) {} // UPDATE

export class GetNodePluginResponseDto extends createZodDto(GetNodePluginCommand.ResponseSchema) {} // GET BY UUID

export class GetNodePluginRequestDto extends createZodDto(GetNodePluginCommand.RequestSchema) {} // GET BY UUID

export class DeleteNodePluginRequestDto extends createZodDto(
    DeleteNodePluginCommand.RequestSchema,
) {} // DELETE

export class DeleteNodePluginResponseDto extends createZodDto(
    DeleteNodePluginCommand.ResponseSchema,
) {} // DELETE

export class CreateNodePluginRequestDto extends createZodDto(
    CreateNodePluginCommand.RequestSchema,
) {} // CREATE

export class CreateNodePluginResponseDto extends createZodDto(
    CreateNodePluginCommand.ResponseSchema,
) {} // CREATE

export class ReorderNodePluginsRequestDto extends createZodDto(
    ReorderNodePluginCommand.RequestSchema,
) {} // REORDER
export class ReorderNodePluginsResponseDto extends createZodDto(
    ReorderNodePluginCommand.ResponseSchema,
) {} // REORDER

export class CloneNodePluginRequestDto extends createZodDto(CloneNodePluginCommand.RequestSchema) {} // CLONE
export class CloneNodePluginResponseDto extends createZodDto(
    CloneNodePluginCommand.ResponseSchema,
) {} // CLONE
