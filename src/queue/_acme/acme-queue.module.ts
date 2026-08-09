import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';

import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { useBullBoard, useQueueProcessor } from '@common/utils/startup-app';

import { QUEUES_NAMES } from '../queue.enum';
import { AcmeQueueProcessor } from './acme-queue.processor';
import { AcmeQueueService } from './acme-queue.service';

const requiredModules = [CqrsModule];

const processors = [AcmeQueueProcessor];
const services = [AcmeQueueService];

const queues = [BullModule.registerQueue({ name: QUEUES_NAMES.ACME.ISSUE })];

const bullBoard = [
    BullBoardModule.forFeature({ name: QUEUES_NAMES.ACME.ISSUE, adapter: BullMQAdapter }),
];

const providers = useQueueProcessor() ? processors : [];
const imports = useBullBoard() ? bullBoard : [];

@Module({
    imports: [...queues, ...imports, ...requiredModules],
    providers: [...providers, ...services],
    exports: [...services],
})
export class AcmeQueueModule {}
