import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { ConfigProfileRepository } from './repositories/config-profile.repository';
import { ConfigProfileConverter, SnippetsConverter } from './converters';
import { SnippetsRepository } from './repositories/snippets.repository';
import { ConfigProfileController } from './config-profile.controller';
import { ConfigProfileService } from './config-profile.service';
import { SnippetsController } from './snippets.controller';
import { SnippetsService } from './snippets.service';
import { QUERIES } from './queries';

@Module({
    imports: [CqrsModule],
    controllers: [ConfigProfileController, SnippetsController],
    providers: [
        ConfigProfileRepository,
        ConfigProfileService,
        ConfigProfileConverter,
        SnippetsConverter,
        SnippetsService,
        SnippetsRepository,
        ...QUERIES,
    ],
})
export class ConfigProfileModule {}
