import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';

import { BullModule } from '@nestjs/bullmq';
import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { useBullBoard, useQueueProcessor } from '@common/utils/startup-app';

import { SquadsQueueProcessor } from './squads-queue.processor';
import { SquadsQueueService } from './squads-queue.service';
import { QUEUES_NAMES } from '../queue.enum';

const requiredModules = [CqrsModule];

const processors = [SquadsQueueProcessor];
const services = [SquadsQueueService];

const queues = [BullModule.registerQueue({ name: QUEUES_NAMES.SQUADS.ACTIONS })];

const bullBoard = [
    BullBoardModule.forFeature({ name: QUEUES_NAMES.SQUADS.ACTIONS, adapter: BullMQAdapter }),
];

const providers = useQueueProcessor() ? processors : [];
const imports = useBullBoard() ? bullBoard : [];

@Module({
    imports: [...queues, ...imports, ...requiredModules],
    providers: [...providers, ...services],
    exports: [...services],
})
export class SquadsQueueModule {}
