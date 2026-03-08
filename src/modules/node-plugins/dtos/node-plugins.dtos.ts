import { createZodDto } from 'nestjs-zod';

import {
    GetNodePluginsCommand,
    UpdateNodePluginCommand,
    GetNodePluginCommand,
    DeleteNodePluginCommand,
    CreateNodePluginCommand,
    ReorderNodePluginCommand,
    CloneNodePluginCommand,
    PluginExecutorCommand,
} from '@libs/contracts/commands';
import {
    GetTorrentBlockerReportsCommand,
    TruncateTorrentBlockerReportsCommand,
} from '@libs/contracts/commands/node-plugins/torrent-blocker';
import { GetTorrentBlockerReportsStatsCommand } from '@libs/contracts/commands/node-plugins/torrent-blocker/get-torrent-blocker-reports-stats.command';

export class GetNodePluginsResponseDto extends createZodDto(GetNodePluginsCommand.ResponseSchema) {} // GET_ALL

export class UpdateNodePluginRequestDto extends createZodDto(
    UpdateNodePluginCommand.RequestSchema,
) {} // UPDATE

export class UpdateNodePluginResponseDto extends createZodDto(
    UpdateNodePluginCommand.ResponseSchema,
) {} // UPDATE

export class GetNodePluginResponseDto extends createZodDto(GetNodePluginCommand.ResponseSchema) {} // GET BY UUID

export class GetNodePluginRequestDto extends createZodDto(GetNodePluginCommand.RequestSchema) {} // GET BY UUID

export class DeleteNodePluginRequestDto extends createZodDto(
    DeleteNodePluginCommand.RequestSchema,
) {} // DELETE

export class DeleteNodePluginResponseDto extends createZodDto(
    DeleteNodePluginCommand.ResponseSchema,
) {} // DELETE

export class CreateNodePluginRequestDto extends createZodDto(
    CreateNodePluginCommand.RequestSchema,
) {} // CREATE

export class CreateNodePluginResponseDto extends createZodDto(
    CreateNodePluginCommand.ResponseSchema,
) {} // CREATE

export class ReorderNodePluginsRequestDto extends createZodDto(
    ReorderNodePluginCommand.RequestSchema,
) {} // REORDER
export class ReorderNodePluginsResponseDto extends createZodDto(
    ReorderNodePluginCommand.ResponseSchema,
) {} // REORDER

export class CloneNodePluginRequestDto extends createZodDto(CloneNodePluginCommand.RequestSchema) {} // CLONE
export class CloneNodePluginResponseDto extends createZodDto(
    CloneNodePluginCommand.ResponseSchema,
) {} // CLONE

export class PluginExecutorRequestDto extends createZodDto(PluginExecutorCommand.RequestSchema) {} // EXECUTOR
export class PluginExecutorResponseDto extends createZodDto(PluginExecutorCommand.ResponseSchema) {} // EXECUTOR

export class GetTorrentBlockerReportsRequestDto extends createZodDto(
    GetTorrentBlockerReportsCommand.RequestQuerySchema,
) {} // TORRENT_BLOCKER_REPORT
export class GetTorrentBlockerReportsResponseDto extends createZodDto(
    GetTorrentBlockerReportsCommand.ResponseSchema,
) {} // TORRENT_BLOCKER_REPORT

export class TruncateTorrentBlockerReportsResponseDto extends createZodDto(
    TruncateTorrentBlockerReportsCommand.ResponseSchema,
) {} // TORRENT_BLOCKER_REPORT

export class GetTorrentBlockerReportsStatsResponseDto extends createZodDto(
    GetTorrentBlockerReportsStatsCommand.ResponseSchema,
) {} // TORRENT_BLOCKER_REPORT_STATS
