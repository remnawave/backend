import { createZodDto } from 'nestjs-zod';

import { GetStatsNodesUsageCommand } from '@contract/commands';

export class GetStatsNodesUsageRequestQueryDto extends createZodDto(
    GetStatsNodesUsageCommand.RequestQuerySchema,
) {}
export class GetStatsNodesUsageResponseDto extends createZodDto(
    GetStatsNodesUsageCommand.ResponseSchema,
) {}
