import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';

import { BullModule } from '@nestjs/bullmq';
import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { useBullBoard, useQueueProcessor } from '@common/utils/startup-app';

import { PushFromRedisQueueProcessor } from './push-from-redis.processor';
import { PushFromRedisQueueService } from './push-from-redis.service';
import { QUEUES_NAMES } from '../queue.enum';

const requiredModules = [CqrsModule];

const processors = [PushFromRedisQueueProcessor];
const services = [PushFromRedisQueueService];

const queues = [BullModule.registerQueue({ name: QUEUES_NAMES.PUSH_TO_DB })];

const bullBoard = [
    BullBoardModule.forFeature({ name: QUEUES_NAMES.PUSH_TO_DB, adapter: BullMQAdapter }),
];

const providers = useQueueProcessor() ? processors : [];
const imports = useBullBoard() ? bullBoard : [];

@Module({
    imports: [...queues, ...imports, ...requiredModules],
    providers: [...providers, ...services],
    exports: [...services],
})
export class PushFromRedisQueueModule {}
