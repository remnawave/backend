import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { COMMANDS } from './commands';
import { NodePluginController } from './node-plugins.controller';
import { NodePluginConverter } from './node-plugins.converter';
import { NodePluginService } from './node-plugins.service';
import { QUERIES } from './queries';
import { NodePluginRepository } from './repositories/node-plugins.repository';
import { SharedListsRepository } from './repositories/shared-lists.repository';
import { TorrentBlockerReportsRepository } from './repositories/torrent-blocker-report.repository';
import { SharedListsConverter } from './shared-lists.converter';
import { SharedListsService } from './shared-lists.service';
import { TorrentBlockerReportConverter } from './torrent-blocker-report.converter';
import { TorrentBlockerReportsController } from './torrent-blocker-reports.controller';

@Module({
    imports: [CqrsModule],
    controllers: [TorrentBlockerReportsController, NodePluginController],
    providers: [
        NodePluginService,
        NodePluginRepository,
        NodePluginConverter,
        SharedListsService,
        SharedListsRepository,
        SharedListsConverter,
        TorrentBlockerReportsRepository,
        TorrentBlockerReportConverter,
        ...QUERIES,
        ...COMMANDS,
    ],
    exports: [],
})
export class NodePluginModule {}
