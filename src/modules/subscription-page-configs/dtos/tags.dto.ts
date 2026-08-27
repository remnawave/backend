import { createZodDto } from 'nestjs-zod';

import {
    GetSubpageConfigsTagsCommand,
    SetSubpageConfigTagsCommand,
} from '@libs/contracts/commands';

export class GetSubpageConfigsTagsResponseDto extends createZodDto(
    GetSubpageConfigsTagsCommand.ResponseSchema,
) {}

export class SetSubpageConfigsTagsBodyDto extends createZodDto(
    SetSubpageConfigTagsCommand.RequestBodySchema,
) {}
export class SetSubpageConfigsTagsResponseDto extends createZodDto(
    SetSubpageConfigTagsCommand.ResponseSchema,
) {}
