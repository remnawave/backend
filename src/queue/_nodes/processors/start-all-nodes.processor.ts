import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Scope } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { FindNodesByCriteriaQuery } from '@modules/nodes/queries/find-nodes-by-criteria';
import { NodesEntity } from '@modules/nodes';

import { NodesQueuesService } from '@queue/_nodes';

import { QUEUES_NAMES } from '../../queue.enum';
import { NODES_JOB_NAMES } from '../constants';

@Processor(
    {
        name: QUEUES_NAMES.NODES.START_ALL_NODES,
        scope: Scope.REQUEST,
    },
    {
        concurrency: 1,
    },
)
export class StartAllNodesQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(StartAllNodesQueueProcessor.name);

    constructor(
        private readonly nodesQueuesService: NodesQueuesService,
        private readonly queryBus: QueryBus,
    ) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case NODES_JOB_NAMES.START_ALL_NODES:
                return this.handleStartAllNodes(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleStartAllNodes(job: Job<{ emitter: string; force?: boolean }>) {
        try {
            const result = await this.queryBus.execute(
                new FindNodesByCriteriaQuery({
                    isDisabled: false,
                }),
            );

            if (!result.isOk) {
                return;
            }

            const forceRestart = job.data.force;

            if (forceRestart) {
                this.logger.warn('Force restart all nodes requested.');
            }

            const groupedByProfile = new Map<string, NodesEntity[]>();

            for (const node of result.response) {
                if (!node.activeConfigProfileUuid) {
                    this.logger.warn(`Node "${node.uuid}" has no active config profile`);
                    continue;
                }
                const nodes = groupedByProfile.get(node.activeConfigProfileUuid) || [];
                nodes.push(node);
                groupedByProfile.set(node.activeConfigProfileUuid, nodes);
            }

            for (const profile of groupedByProfile.keys()) {
                await this.nodesQueuesService.startAllNodesByProfile({
                    profileUuid: profile,
                    emitter: 'StartAllNodesQueueProcessor',
                    force: forceRestart,
                });
            }
        } catch (error) {
            this.logger.error(`Error handling "${NODES_JOB_NAMES.START_ALL_NODES}" job: ${error}`);
        }
    }
}
