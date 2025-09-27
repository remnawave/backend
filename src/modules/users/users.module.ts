import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { UsersBulkActionsController, UsersController, UsersStatsController } from './controllers';
import { UsersRepository } from './repositories/users.repository';
import { UserConverter } from './users.converter';
import { UsersService } from './users.service';
import { COMMANDS } from './commands';
import { QUERIES } from './queries';
import { SubscriptionModule } from '@modules/subscription/subscription.module';

@Module({
    imports: [CqrsModule, SubscriptionModule],
    controllers: [UsersController, UsersBulkActionsController, UsersStatsController],
    providers: [UsersRepository, UserConverter, UsersService, ...QUERIES, ...COMMANDS],
    exports: [],
})
export class UsersModule {}