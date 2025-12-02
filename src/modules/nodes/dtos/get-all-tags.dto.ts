import { createZodDto } from 'nestjs-zod';

import { GetAllNodesTagsCommand } from '@contract/commands';

export class GetAllNodesTagsResponseDto extends createZodDto(
    GetAllNodesTagsCommand.ResponseSchema,
) {}
