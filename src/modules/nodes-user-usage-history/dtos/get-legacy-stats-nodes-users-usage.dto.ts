import { createZodDto } from 'nestjs-zod';

import { GetLegacyStatsNodeUserUsageCommand } from '@contract/commands';

export class GetLegacyStatsNodesUsersUsageRequestQueryDto extends createZodDto(
    GetLegacyStatsNodeUserUsageCommand.RequestQuerySchema,
) {}

export class GetLegacyStatsNodesUsersUsageRequestDto extends createZodDto(
    GetLegacyStatsNodeUserUsageCommand.RequestSchema,
) {}

export class GetLegacyStatsNodesUsersUsageResponseDto extends createZodDto(
    GetLegacyStatsNodeUserUsageCommand.ResponseSchema,
) {}
