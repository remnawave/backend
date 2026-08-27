import { createZodDto } from 'nestjs-zod';

import {
    GetExternalSquadsTagsCommand,
    SetExternalSquadTagsCommand,
} from '@libs/contracts/commands';

export class GetExternalSquadsTagsResponseDto extends createZodDto(
    GetExternalSquadsTagsCommand.ResponseSchema,
) {}

export class SetExternalSquadsTagsBodyDto extends createZodDto(
    SetExternalSquadTagsCommand.RequestBodySchema,
) {}
export class SetExternalSquadsTagsResponseDto extends createZodDto(
    SetExternalSquadTagsCommand.ResponseSchema,
) {}
