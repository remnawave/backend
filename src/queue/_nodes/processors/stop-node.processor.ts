import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { AxiosService } from '@common/axios';

import { DeleteNodeByUuidCommand } from '@modules/nodes/commands/delete-node-by-uuid';
import { GetNodeByUuidQuery } from '@modules/nodes/queries/get-node-by-uuid';
import { UpdateNodeCommand } from '@modules/nodes/commands/update-node';

import { QUEUES_NAMES } from '@queue/queue.enum';

import { NODES_JOB_NAMES } from '../constants/nodes-job-name.constant';

@Processor(QUEUES_NAMES.NODES.STOP, {
    concurrency: 30,
})
export class StopNodeProcessor extends WorkerHost {
    private readonly logger = new Logger(StopNodeProcessor.name);

    constructor(
        private readonly axios: AxiosService,
        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
    ) {
        super();
    }

    async process(job: Job<{ nodeUuid: string; isNeedToBeDeleted: boolean }>): Promise<boolean> {
        try {
            const { nodeUuid, isNeedToBeDeleted } = job.data;

            const { isOk, response: nodeEntity } = await this.queryBus.execute(
                new GetNodeByUuidQuery(nodeUuid),
            );

            if (!isOk || !nodeEntity) {
                this.logger.error(`Node ${nodeUuid} not found`);
                return false;
            }

            if (isNeedToBeDeleted) {
                await this.commandBus.execute(new DeleteNodeByUuidCommand(nodeUuid));
                return true;
            }

            await this.axios.stopXray(nodeEntity.address, nodeEntity.port);

            if (!isNeedToBeDeleted) {
                await this.commandBus.execute(
                    new UpdateNodeCommand({
                        uuid: nodeEntity.uuid,
                        lastStatusMessage: null,
                        lastStatusChange: new Date(),
                        isConnected: false,
                        isConnecting: false,
                        isDisabled: true,
                        usersOnline: 0,
                    }),
                );
            }

            return true;
        } catch (error) {
            this.logger.error(`Error handling "${NODES_JOB_NAMES.STOP_NODE}" job: ${error}`);
            return false;
        }
    }
}
