import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { IpControlController } from './ip-control.controller';
import { IpControlService } from './ip-control.service';

@Module({
    imports: [CqrsModule],
    controllers: [IpControlController],
    providers: [IpControlService],
})
export class IpControlModule {}
