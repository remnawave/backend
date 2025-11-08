import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { ExternalSquadRepository } from './repositories/external-squad.repository';
import { ExternalSquadController } from './external-squads.controller';
import { ExternalSquadConverter } from './external-squads.converter';
import { ExternalSquadService } from './external-squads.service';
import { COMMANDS } from './commands';
import { QUERIES } from './queries';

@Module({
    imports: [CqrsModule],
    controllers: [ExternalSquadController],
    providers: [
        ExternalSquadRepository,
        ExternalSquadService,
        ExternalSquadConverter,
        ...COMMANDS,
        ...QUERIES,
    ],
})
export class ExternalSquadModule {}
