import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { UsersBulkActionsController, UsersController, UsersStatsController } from './controllers';
import { UsersRepository } from './repositories/users.repository';
import { UserConverter } from './users.converter';
import { UsersService } from './users.service';
import { COMMANDS } from './commands';
import { QUERIES } from './queries';
@Module({
    imports: [CqrsModule],
    controllers: [UsersController, UsersBulkActionsController, UsersStatsController],
    providers: [UsersRepository, UserConverter, UsersService, ...QUERIES, ...COMMANDS],
    exports: [],
})
export class UsersModule {}
