import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { UserMetadataRepository } from './repositories/user-metadata.repository';
import { NodeMetadataRepository } from './repositories/node-metadata.repository';
import { NodeMetadataConverter, UserMetadataConverter } from './converters';
import { MetadataController } from './metadata.controller';
import { MetadataService } from './metadata.service';

@Module({
    imports: [CqrsModule],
    controllers: [MetadataController],
    providers: [
        UserMetadataRepository,
        NodeMetadataRepository,
        UserMetadataConverter,
        NodeMetadataConverter,
        MetadataService,
    ],
})
export class MetadataModule {}
