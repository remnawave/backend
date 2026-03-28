import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { TorrentBlockerReportsRepository } from './repositories/torrent-blocker-report.repository';
import { TorrentBlockerReportsController } from './torrent-blocker-reports.controller';
import { TorrentBlockerReportConverter } from './torrent-blocker-report.converter';
import { NodePluginRepository } from './repositories/node-plugins.repository';
import { NodePluginController } from './node-plugins.controller';
import { NodePluginConverter } from './node-plugins.converter';
import { NodePluginService } from './node-plugins.service';
import { COMMANDS } from './commands';
import { QUERIES } from './queries';

@Module({
    imports: [CqrsModule],
    controllers: [TorrentBlockerReportsController, NodePluginController],
    providers: [
        NodePluginService,
        NodePluginRepository,
        NodePluginConverter,
        TorrentBlockerReportsRepository,
        TorrentBlockerReportConverter,
        ...QUERIES,
        ...COMMANDS,
    ],
    exports: [],
})
export class NodePluginModule {}
