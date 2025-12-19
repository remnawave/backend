import { createZodDto } from 'nestjs-zod';

import { GetStatsNodesRealtimeUsageCommand } from '@contract/commands';

export class GetStatsNodesRealtimeUsageResponseDto extends createZodDto(
    GetStatsNodesRealtimeUsageCommand.ResponseSchema,
) {}
