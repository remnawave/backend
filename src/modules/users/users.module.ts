import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { COMMANDS } from './commands';
import { UsersController, UsersBulkActionsController } from './controllers';
import { QUERIES } from './queries';
import { UsersRepository } from './repositories/users.repository';
import { UserConverter } from './users.converter';
import { UsersService } from './users.service';
@Module({
    imports: [CqrsModule],
    controllers: [UsersController, UsersBulkActionsController],
    providers: [UsersRepository, UserConverter, UsersService, ...QUERIES, ...COMMANDS],
    exports: [UsersService],
})
export class UsersModule {}
