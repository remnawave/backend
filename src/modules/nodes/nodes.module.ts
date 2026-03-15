import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { NodesSystemCacheService } from './nodes-system-cache.service';
import { NodesRepository } from './repositories/nodes.repository';
import { NodesController } from './nodes.controller';
import { NodesConverter } from './nodes.converter';
import { NodesService } from './nodes.service';
import { COMMANDS } from './commands';
import { QUERIES } from './queries';
import { EVENTS } from './events';

@Module({
    imports: [CqrsModule],
    controllers: [NodesController],
    providers: [
        NodesRepository,
        NodesConverter,
        NodesService,
        NodesSystemCacheService,
        ...EVENTS,
        ...QUERIES,
        ...COMMANDS,
    ],
    exports: [NodesRepository],
})
export class NodesModule {}
