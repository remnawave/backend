import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { RemnawaveSettingsRepository } from './repositories/remnawave-settings.repository';
import { RemnawaveSettingsController } from './remnawave-settings.controller';
import { RemnawaveSettingsService } from './remnawave-settings.service';
import { QUERIES } from './queries';

@Module({
    imports: [CqrsModule],
    controllers: [RemnawaveSettingsController],
    providers: [RemnawaveSettingsService, RemnawaveSettingsRepository, ...QUERIES],
})
export class RemnawaveSettingsModule {}
