import { QueueEvents } from 'bullmq';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { sleep } from '@common/utils/sleep';

import { QUEUES_NAMES } from '@queue/queue.enum';

import { NodesQueuesService } from '../nodes-queues.service';

@Injectable()
export class StartAllNodesByProfileQueueEvents implements OnModuleInit {
    private readonly logger = new Logger(StartAllNodesByProfileQueueEvents.name);

    private queueEvents: QueueEvents;

    constructor(private readonly nodesQueuesService: NodesQueuesService) {}

    async onModuleInit() {
        this.queueEvents = new QueueEvents(QUEUES_NAMES.NODES.START_ALL_BY_PROFILE, {
            connection: this.nodesQueuesService.queues.startAllNodesByProfile.opts.connection,
        });

        this.queueEvents.on('deduplicated', async (event) => {
            const { jobId, deduplicationId } = event;

            this.logger.log(`[deduplicated] ${deduplicationId} – retrying job ${jobId} in 10s`);

            await sleep(10_000);

            const profileUuid = deduplicationId;

            await this.nodesQueuesService.startAllNodesByProfile({
                profileUuid,
                emitter: 'RetryStartAllNodesByProfile',
            });
        });
    }
}
