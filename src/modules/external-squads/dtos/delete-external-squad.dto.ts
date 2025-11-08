import { createZodDto } from 'nestjs-zod';

import { DeleteExternalSquadCommand } from '@libs/contracts/commands';

export class DeleteExternalSquadRequestDto extends createZodDto(
    DeleteExternalSquadCommand.RequestSchema,
) {}

export class DeleteExternalSquadResponseDto extends createZodDto(
    DeleteExternalSquadCommand.ResponseSchema,
) {}
