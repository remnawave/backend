import { createZodDto } from 'nestjs-zod';

import { InstallNodeWarpCommand } from '@contract/commands';

export class InstallNodeWarpRequestParamDto extends createZodDto(
    InstallNodeWarpCommand.RequestSchema,
) {}
export class InstallNodeWarpResponseDto extends createZodDto(
    InstallNodeWarpCommand.ResponseSchema,
) {}
