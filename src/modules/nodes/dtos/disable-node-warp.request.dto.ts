import { createZodDto } from 'nestjs-zod';

import { DisableNodeWarpCommand } from '@contract/commands';

export class DisableNodeWarpRequestParamDto extends createZodDto(
    DisableNodeWarpCommand.RequestSchema,
) {}
export class DisableNodeWarpResponseDto extends createZodDto(
    DisableNodeWarpCommand.ResponseSchema,
) {}
