import { createZodDto } from 'nestjs-zod';

import {
    GetAbuseBlockerReportsCommand,
    GetAbuseBlockerReviewQueueCommand,
    GetAbuseBlockerStatsCommand,
    GetNodePluginsCommand,
    UpdateNodePluginCommand,
    GetNodePluginCommand,
    DeleteNodePluginCommand,
    CreateNodePluginCommand,
    ReorderNodePluginCommand,
    CloneNodePluginCommand,
    PluginExecutorCommand,
    ReviewAbuseBlockerUserCommand,
} from '@libs/contracts/commands';
import { GetTorrentBlockerReportsCommand } from '@libs/contracts/commands/node-plugins/torrent-blocker';
import { GetTorrentBlockerReportsStatsCommand } from '@libs/contracts/commands/node-plugins/torrent-blocker/get-torrent-blocker-reports-stats.command';

export class GetNodePluginsResponseDto extends createZodDto(GetNodePluginsCommand.ResponseSchema) {} // GET_ALL

export class UpdateNodePluginBodyDto extends createZodDto(
    UpdateNodePluginCommand.RequestBodySchema,
) {} // UPDATE

export class UpdateNodePluginResponseDto extends createZodDto(
    UpdateNodePluginCommand.ResponseSchema,
) {} // UPDATE

export class GetNodePluginResponseDto extends createZodDto(GetNodePluginCommand.ResponseSchema) {} // GET BY UUID

export class GetNodePluginParamDto extends createZodDto(GetNodePluginCommand.RequestParamSchema) {} // GET BY UUID

export class DeleteNodePluginParamDto extends createZodDto(
    DeleteNodePluginCommand.RequestParamSchema,
) {} // DELETE

export class CreateNodePluginBodyDto extends createZodDto(
    CreateNodePluginCommand.RequestBodySchema,
) {} // CREATE

export class CreateNodePluginResponseDto extends createZodDto(
    CreateNodePluginCommand.ResponseSchema,
) {} // CREATE

export class ReorderNodePluginsBodyDto extends createZodDto(
    ReorderNodePluginCommand.RequestBodySchema,
) {} // REORDER
export class ReorderNodePluginsResponseDto extends createZodDto(
    ReorderNodePluginCommand.ResponseSchema,
) {} // REORDER

export class CloneNodePluginBodyDto extends createZodDto(
    CloneNodePluginCommand.RequestBodySchema,
) {} // CLONE
export class CloneNodePluginResponseDto extends createZodDto(
    CloneNodePluginCommand.ResponseSchema,
) {} // CLONE

export class PluginExecutorBodyDto extends createZodDto(PluginExecutorCommand.RequestBodySchema) {} // EXECUTOR

export class GetTorrentBlockerReportsQueryDto extends createZodDto(
    GetTorrentBlockerReportsCommand.RequestQuerySchema,
) {} // TORRENT_BLOCKER_REPORT
export class GetTorrentBlockerReportsResponseDto extends createZodDto(
    GetTorrentBlockerReportsCommand.ResponseSchema,
) {} // TORRENT_BLOCKER_REPORT

export class GetTorrentBlockerReportsStatsResponseDto extends createZodDto(
    GetTorrentBlockerReportsStatsCommand.ResponseSchema,
) {} // TORRENT_BLOCKER_REPORT_STATS

export class GetAbuseBlockerReportsQueryDto extends createZodDto(
    GetAbuseBlockerReportsCommand.RequestQuerySchema,
) {}
export class GetAbuseBlockerReportsResponseDto extends createZodDto(
    GetAbuseBlockerReportsCommand.ResponseSchema,
) {}
export class GetAbuseBlockerStatsResponseDto extends createZodDto(
    GetAbuseBlockerStatsCommand.ResponseSchema,
) {}
export class GetAbuseBlockerReviewQueueQueryDto extends createZodDto(
    GetAbuseBlockerReviewQueueCommand.RequestQuerySchema,
) {}
export class GetAbuseBlockerReviewQueueResponseDto extends createZodDto(
    GetAbuseBlockerReviewQueueCommand.ResponseSchema,
) {}
export class ReviewAbuseBlockerUserParamDto extends createZodDto(
    ReviewAbuseBlockerUserCommand.RequestParamSchema,
) {}
export class ReviewAbuseBlockerUserBodyDto extends createZodDto(
    ReviewAbuseBlockerUserCommand.RequestBodySchema,
) {}
export class ReviewAbuseBlockerUserResponseDto extends createZodDto(
    ReviewAbuseBlockerUserCommand.ResponseSchema,
) {}
