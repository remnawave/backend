import { createZodDto } from 'nestjs-zod';

import {
    GetConfigProfilesTagsCommand,
    SetConfigProfileTagsCommand,
} from '@libs/contracts/commands';

export class GetConfigProfilesTagsResponseDto extends createZodDto(
    GetConfigProfilesTagsCommand.ResponseSchema,
) {}

export class SetConfigProfilesTagsBodyDto extends createZodDto(
    SetConfigProfileTagsCommand.RequestBodySchema,
) {}
export class SetConfigProfilesTagsResponseDto extends createZodDto(
    SetConfigProfileTagsCommand.ResponseSchema,
) {}
