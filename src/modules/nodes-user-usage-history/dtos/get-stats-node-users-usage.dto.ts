import { createZodDto } from 'nestjs-zod';

import { GetStatsNodeUsersUsageCommand } from '@contract/commands';

export class GetStatsNodeUsersUsageRequestQueryDto extends createZodDto(
    GetStatsNodeUsersUsageCommand.RequestQuerySchema,
) {}

export class GetStatsNodeUsersUsageRequestDto extends createZodDto(
    GetStatsNodeUsersUsageCommand.RequestSchema,
) {}

export class GetStatsNodeUsersUsageResponseDto extends createZodDto(
    GetStatsNodeUsersUsageCommand.ResponseSchema,
) {}
