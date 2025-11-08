import { createZodDto } from 'nestjs-zod';

import { GetExternalSquadByUuidCommand } from '@libs/contracts/commands';

export class GetExternalSquadByUuidRequestDto extends createZodDto(
    GetExternalSquadByUuidCommand.RequestSchema,
) {}

export class GetExternalSquadByUuidResponseDto extends createZodDto(
    GetExternalSquadByUuidCommand.ResponseSchema,
) {}
