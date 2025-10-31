import { createZodDto } from 'nestjs-zod';

import { ResetNodeTrafficCommand } from '@contract/commands';

export class ResetNodeTrafficRequestDto extends createZodDto(
    ResetNodeTrafficCommand.RequestSchema,
) {}
export class ResetNodeTrafficResponseDto extends createZodDto(
    ResetNodeTrafficCommand.ResponseSchema,
) {}
