import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { UsersModule } from '@modules/users/users.module';

import { AbuseBlockerController } from './abuse-blocker.controller';
import { AbuseBlockerService } from './abuse-blocker.service';
import { COMMANDS } from './commands';
import { NodePluginController } from './node-plugins.controller';
import { NodePluginConverter } from './node-plugins.converter';
import { NodePluginService } from './node-plugins.service';
import { QUERIES } from './queries';
import { AbuseBlockerRepository } from './repositories/abuse-blocker.repository';
import { NodePluginRepository } from './repositories/node-plugins.repository';
import { TorrentBlockerReportsRepository } from './repositories/torrent-blocker-report.repository';
import { TorrentBlockerReportConverter } from './torrent-blocker-report.converter';
import { TorrentBlockerReportsController } from './torrent-blocker-reports.controller';

@Module({
    imports: [CqrsModule, UsersModule],
    controllers: [AbuseBlockerController, TorrentBlockerReportsController, NodePluginController],
    providers: [
        NodePluginService,
        AbuseBlockerService,
        AbuseBlockerRepository,
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
