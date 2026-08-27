import { createZodDto } from 'nestjs-zod';

import { GetNodePluginsTagsCommand, SetNodePluginTagsCommand } from '@libs/contracts/commands';

export class GetNodePluginsTagsResponseDto extends createZodDto(
    GetNodePluginsTagsCommand.ResponseSchema,
) {}

export class SetNodePluginsTagsBodyDto extends createZodDto(
    SetNodePluginTagsCommand.RequestBodySchema,
) {}
export class SetNodePluginsTagsResponseDto extends createZodDto(
    SetNodePluginTagsCommand.ResponseSchema,
) {}
