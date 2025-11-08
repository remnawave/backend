import { createZodDto } from 'nestjs-zod';

import { CreateExternalSquadCommand } from '@libs/contracts/commands';

export class CreateExternalSquadRequestDto extends createZodDto(
    CreateExternalSquadCommand.RequestSchema,
) {}

export class CreateExternalSquadResponseDto extends createZodDto(
    CreateExternalSquadCommand.ResponseSchema,
) {}
