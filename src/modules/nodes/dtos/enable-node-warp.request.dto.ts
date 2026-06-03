import { createZodDto } from 'nestjs-zod';

import { EnableNodeWarpCommand } from '@contract/commands';

export class EnableNodeWarpRequestParamDto extends createZodDto(
    EnableNodeWarpCommand.RequestSchema,
) {}
export class EnableNodeWarpResponseDto extends createZodDto(EnableNodeWarpCommand.ResponseSchema) {}
