import { createZodDto } from 'nestjs-zod';

import { ReorderInternalSquadCommand } from '@libs/contracts/commands';

export class ReorderInternalSquadsRequestDto extends createZodDto(
    ReorderInternalSquadCommand.RequestSchema,
) {}
export class ReorderInternalSquadsResponseDto extends createZodDto(
    ReorderInternalSquadCommand.ResponseSchema,
) {}
