import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { NodePluginRepository } from './repositories/node-plugins.repository';
import { NodePluginController } from './node-plugins.controller';
import { NodePluginConverter } from './node-plugins.converter';
import { NodePluginService } from './node-plugins.service';

@Module({
    imports: [CqrsModule],
    controllers: [NodePluginController],
    providers: [NodePluginService, NodePluginRepository, NodePluginConverter],
    exports: [],
})
export class NodePluginModule {}
