import { createZodDto } from 'nestjs-zod';

import { GetLegacyStatsUserUsageCommand } from '@contract/commands';

export class GetLegacyStatsUserUsageRequestQueryDto extends createZodDto(
    GetLegacyStatsUserUsageCommand.RequestQuerySchema,
) {}

export class GetLegacyStatsUserUsageRequestDto extends createZodDto(
    GetLegacyStatsUserUsageCommand.RequestSchema,
) {}

export class GetLegacyStatsUserUsageResponseDto extends createZodDto(
    GetLegacyStatsUserUsageCommand.ResponseSchema,
) {}
