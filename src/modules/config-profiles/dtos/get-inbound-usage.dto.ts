import { createZodDto } from 'nestjs-zod';

import { GetInboundUsageCommand } from '@libs/contracts/commands';

export class GetInboundUsageParamDto extends createZodDto(
    GetInboundUsageCommand.RequestParamSchema,
) {}
export class GetInboundUsageQueryDto extends createZodDto(
    GetInboundUsageCommand.RequestQuerySchema,
) {}
export class GetInboundUsageResponseDto extends createZodDto(
    GetInboundUsageCommand.ResponseSchema,
) {}
