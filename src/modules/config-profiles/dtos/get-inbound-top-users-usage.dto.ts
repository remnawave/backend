import { createZodDto } from 'nestjs-zod';

import { GetInboundTopUsersUsageCommand } from '@libs/contracts/commands';

export class GetInboundTopUsersUsageParamDto extends createZodDto(
    GetInboundTopUsersUsageCommand.RequestParamSchema,
) {}
export class GetInboundTopUsersUsageQueryDto extends createZodDto(
    GetInboundTopUsersUsageCommand.RequestQuerySchema,
) {}
export class GetInboundTopUsersUsageResponseDto extends createZodDto(
    GetInboundTopUsersUsageCommand.ResponseSchema,
) {}
