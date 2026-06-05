import { createZodDto } from 'nestjs-zod';

import { GetNodeWarpStatusCommand } from '@contract/commands';

export class GetNodeWarpStatusRequestParamDto extends createZodDto(
    GetNodeWarpStatusCommand.RequestSchema,
) {}
export class GetNodeWarpStatusResponseDto extends createZodDto(
    GetNodeWarpStatusCommand.ResponseSchema,
) {}
