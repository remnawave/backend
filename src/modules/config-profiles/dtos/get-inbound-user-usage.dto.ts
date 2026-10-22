import { createZodDto } from 'nestjs-zod';

import { GetInboundUserUsageCommand } from '@libs/contracts/commands';

export class GetInboundUserUsageParamDto extends createZodDto(
    GetInboundUserUsageCommand.RequestParamSchema,
) {}
export class GetInboundUserUsageQueryDto extends createZodDto(
    GetInboundUserUsageCommand.RequestQuerySchema,
) {}
export class GetInboundUserUsageResponseDto extends createZodDto(
    GetInboundUserUsageCommand.ResponseSchema,
) {}
