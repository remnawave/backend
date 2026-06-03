import { createZodDto } from 'nestjs-zod';

import { UninstallNodeWarpCommand } from '@contract/commands';

export class UninstallNodeWarpRequestParamDto extends createZodDto(
    UninstallNodeWarpCommand.RequestSchema,
) {}
export class UninstallNodeWarpResponseDto extends createZodDto(
    UninstallNodeWarpCommand.ResponseSchema,
) {}
