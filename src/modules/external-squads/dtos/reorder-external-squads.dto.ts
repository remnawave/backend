import { createZodDto } from 'nestjs-zod';

import { ReorderExternalSquadCommand } from '@libs/contracts/commands';

export class ReorderExternalSquadsRequestDto extends createZodDto(
    ReorderExternalSquadCommand.RequestSchema,
) {}
export class ReorderExternalSquadsResponseDto extends createZodDto(
    ReorderExternalSquadCommand.ResponseSchema,
) {}
