import { CONTROLLERS_INFO, NODE_PLUGINS_CONTROLLER } from '@contract/api';
import { ROLE } from '@contract/constants';

import { Controller, HttpStatus, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import { GetTorrentBlockerReportsStatsCommand } from '@libs/contracts/commands/node-plugins/torrent-blocker/get-torrent-blocker-reports-stats.command';
import {
    GetTorrentBlockerReportsCommand,
    TruncateTorrentBlockerReportsCommand,
} from '@libs/contracts/commands';

import {
    GetTorrentBlockerReportsResponseDto,
    GetTorrentBlockerReportsRequestDto,
    GetTorrentBlockerReportsStatsResponseDto,
    TruncateTorrentBlockerReportsResponseDto,
} from './dtos/node-plugins.dtos';
import { GetTorrentBlockerReportsResponseModel, TorrentBlockerReportResponseModel } from './models';
import { NodePluginService } from './node-plugins.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.NODE_PLUGINS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(NODE_PLUGINS_CONTROLLER)
export class TorrentBlockerReportsController {
    constructor(private readonly nodePluginService: NodePluginService) {}

    @ApiOkResponse({
        type: GetTorrentBlockerReportsResponseDto,
        description: 'Torrent blocker reports fetched successfully',
    })
    @ApiQuery({
        name: 'start',
        type: 'number',
        required: false,
        description: 'Offset for pagination',
    })
    @ApiQuery({
        name: 'size',
        type: 'number',
        required: false,
        description: 'Page size for pagination',
    })
    @Endpoint({
        command: GetTorrentBlockerReportsCommand,
        httpCode: HttpStatus.OK,
    })
    async getTorrentBlockerReports(
        @Query() query: GetTorrentBlockerReportsRequestDto,
    ): Promise<GetTorrentBlockerReportsResponseDto> {
        const { start, size, filters, filterModes, globalFilterMode, sorting } = query;
        const result = await this.nodePluginService.getTorrentBlockerReports({
            start,
            size,
            filters,
            filterModes,
            globalFilterMode,
            sorting,
        });

        const data = errorHandler(result);
        return {
            response: new GetTorrentBlockerReportsResponseModel({
                total: data.total,
                records: data.records.map((item) => new TorrentBlockerReportResponseModel(item)),
            }),
        };
    }

    @ApiOkResponse({
        type: GetTorrentBlockerReportsStatsResponseDto,
        description: 'Torrent blocker reports stats fetched successfully',
    })
    @Endpoint({
        command: GetTorrentBlockerReportsStatsCommand,
        httpCode: HttpStatus.OK,
    })
    async getTorrentBlockerReportsStats(): Promise<GetTorrentBlockerReportsStatsResponseDto> {
        const result = await this.nodePluginService.getTorrentBlockerReportsStats();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: TruncateTorrentBlockerReportsResponseDto,
        description: 'Torrent blocker reports truncated successfully',
    })
    @Endpoint({
        command: TruncateTorrentBlockerReportsCommand,
        httpCode: HttpStatus.OK,
    })
    async truncateTorrentBlockerReports(): Promise<TruncateTorrentBlockerReportsResponseDto> {
        const result = await this.nodePluginService.truncateTorrentBlockerReports();

        const data = errorHandler(result);
        return {
            response: new GetTorrentBlockerReportsResponseModel({
                total: data.total,
                records: data.records.map((item) => new TorrentBlockerReportResponseModel(item)),
            }),
        };
    }
}
