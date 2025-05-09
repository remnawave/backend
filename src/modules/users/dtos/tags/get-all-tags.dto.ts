import { createZodDto } from 'nestjs-zod';

import { GetAllTagsCommand } from '@libs/contracts/commands';

export class GetAllTagsResponseDto extends createZodDto(GetAllTagsCommand.ResponseSchema) {}
