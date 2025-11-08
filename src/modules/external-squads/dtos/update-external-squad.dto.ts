import { createZodDto } from 'nestjs-zod';

import { UpdateExternalSquadCommand } from '@libs/contracts/commands';

export class UpdateExternalSquadRequestDto extends createZodDto(
    UpdateExternalSquadCommand.RequestSchema,
) {}

export class UpdateExternalSquadResponseDto extends createZodDto(
    UpdateExternalSquadCommand.ResponseSchema,
) {}
