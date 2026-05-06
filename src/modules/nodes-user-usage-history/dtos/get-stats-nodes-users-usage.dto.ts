import { createZodDto } from 'nestjs-zod';

import { GetStatsNodesUsersUsageCommand } from '@contract/commands';

export class GetStatsNodesUsersUsageRequestQueryDto extends createZodDto(
    GetStatsNodesUsersUsageCommand.RequestQuerySchema,
) {}

export class GetStatsNodesUsersUsageRequestDto extends createZodDto(
    GetStatsNodesUsersUsageCommand.RequestSchema,
) {}

export class GetStatsNodesUsersUsageResponseDto extends createZodDto(
    GetStatsNodesUsersUsageCommand.ResponseSchema,
) {}
