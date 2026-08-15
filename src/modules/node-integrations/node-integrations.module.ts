import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { NodeIntegrationController } from './node-integrations.controller';
import { NodeIntegrationConverter } from './node-integrations.converter';
import { NodeIntegrationService } from './node-integrations.service';
import { QUERIES } from './queries';
import { NodeIntegrationRepository } from './repositories/node-integrations.repository';

@Module({
    imports: [CqrsModule],
    controllers: [NodeIntegrationController],
    providers: [
        NodeIntegrationService,
        NodeIntegrationRepository,
        NodeIntegrationConverter,
        ...QUERIES,
    ],
    exports: [NodeIntegrationRepository],
})
export class NodeIntegrationModule {}
