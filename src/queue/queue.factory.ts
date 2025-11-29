import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';

import { DynamicModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { Type } from '@nestjs/common';

import { useBullBoard, useQueueProcessor } from '@common/utils/startup-app';

interface QueueDefinition {
    name: string;
    processor: Type;
}

interface DomainQueueOptions {
    queues: QueueDefinition[];
    service: Type;
    imports?: Type[];
    extraProviders?: Type[];
}

export function createDomainQueueModule(options: DomainQueueOptions): DynamicModule {
    const { queues, service, imports: extraImports = [], extraProviders = [] } = options;

    return {
        module: class {},
        imports: [
            BullModule.registerQueue(...queues.map((q) => ({ name: q.name }))),
            ...(useBullBoard()
                ? queues.map((q) =>
                      BullBoardModule.forFeature({ name: q.name, adapter: BullMQAdapter }),
                  )
                : []),
            ...extraImports,
        ],
        providers: [
            ...(useQueueProcessor() ? queues.map((q) => q.processor) : []),
            service,
            ...extraProviders,
        ],
        exports: [service],
    };
}
