import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';

import { BullModule } from '@nestjs/bullmq';
import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { useBullBoard, useQueueProcessor } from '@common/utils/startup-app';

import { ExternalSquadActionsQueueProcessor } from './external-squad-actions.processor';
import { ExternalSquadActionsQueueService } from './external-squad-actions.service';
import { QueueNames } from '../queue.enum';

const requiredModules = [CqrsModule];

const processors = [ExternalSquadActionsQueueProcessor];
const services = [ExternalSquadActionsQueueService];

const queues = [BullModule.registerQueue({ name: QueueNames.externalSquadActions })];

const bullBoard = [
    BullBoardModule.forFeature({ name: QueueNames.externalSquadActions, adapter: BullMQAdapter }),
];

const providers = useQueueProcessor() ? processors : [];
const imports = useBullBoard() ? bullBoard : [];

@Module({
    imports: [...queues, ...imports, ...requiredModules],
    providers: [...providers, ...services],
    exports: [...services],
})
export class ExternalSquadActionsQueueModule {}
