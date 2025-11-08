import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { PrismaModule } from '@common/database';

import { PasskeyRepository } from './repositories/passkey.repository';
import { AdminRepository } from './repositories/admin.repository';
import { AdminConverter } from './converters/admin.converter';
import { PasskeyConverter } from './converters';
import { CONTROLLERS } from './controllers';
import { COMMANDS } from './commands';
import { SERVICES } from './services';
import { QUERIES } from './queries';

@Module({
    imports: [CqrsModule, PrismaModule],
    controllers: [...CONTROLLERS],
    providers: [
        AdminRepository,
        AdminConverter,
        PasskeyRepository,
        PasskeyConverter,
        ...SERVICES,
        ...QUERIES,
        ...COMMANDS,
    ],
})
export class AdminModule {}
