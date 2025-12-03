import { QueueEvents } from 'bullmq';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { sleep } from '@common/utils/sleep';

import { NodesQueuesService } from '@queue/_nodes';
import { QUEUES_NAMES } from '@queue/queue.enum';

@Injectable()
export class StartAllNodesByProfileQueueEvents implements OnModuleInit {
    private readonly logger = new Logger(StartAllNodesByProfileQueueEvents.name);
    private waitingProfiles = new Set<string>();

    private queueEvents: QueueEvents;

    constructor(private readonly nodesQueuesService: NodesQueuesService) {}

    async onModuleInit() {
        this.logger.log('Initializing deduplication event listener.');

        this.queueEvents = new QueueEvents(QUEUES_NAMES.NODES.START_ALL_BY_PROFILE, {
            connection: this.nodesQueuesService.queues.startAllNodesByProfile.opts.connection,
        });

        this.queueEvents.on('deduplicated', async (event) => {
            const { jobId, deduplicationId } = event;
            const profileUuid = deduplicationId;

            if (this.waitingProfiles.has(profileUuid)) {
                this.logger.log(`[deduplicated] ${deduplicationId} – already waiting for retry`);
                return;
            }

            this.waitingProfiles.add(profileUuid);

            this.logger.log(`[deduplicated] ${deduplicationId} – retrying job ${jobId} in 10s`);

            await sleep(10_000);

            this.waitingProfiles.delete(profileUuid);

            await this.nodesQueuesService.startAllNodesByProfile({
                profileUuid,
                emitter: 'RetryStartAllNodesByProfile',
            });
        });
    }
}
