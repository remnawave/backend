import { createZodDto } from 'nestjs-zod';

import {
    GetInternalSquadsTagsCommand,
    SetInternalSquadTagsCommand,
} from '@libs/contracts/commands';

export class GetInternalSquadsTagsResponseDto extends createZodDto(
    GetInternalSquadsTagsCommand.ResponseSchema,
) {}

export class SetInternalSquadsTagsBodyDto extends createZodDto(
    SetInternalSquadTagsCommand.RequestBodySchema,
) {}
export class SetInternalSquadsTagsResponseDto extends createZodDto(
    SetInternalSquadTagsCommand.ResponseSchema,
) {}
