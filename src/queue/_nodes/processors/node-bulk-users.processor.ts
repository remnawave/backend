import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import { AxiosService } from '@common/axios';

import { QUEUES_NAMES } from '@queue/queue.enum';

import { IAddUsersToNodePayload, IRemoveUsersFromNodePayload } from '../interfaces';
import { NODES_JOB_NAMES } from '../constants/nodes-job-name.constant';

@Processor(QUEUES_NAMES.NODES.BULK_USERS, {
    concurrency: 20,
})
export class NodeBulkUsersQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(NodeBulkUsersQueueProcessor.name);

    constructor(private readonly axios: AxiosService) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case NODES_JOB_NAMES.ADD_USERS_TO_NODE:
                return await this.handleAddUsersToNode(job);
            case NODES_JOB_NAMES.REMOVE_USERS_FROM_NODE:
                return await this.handleRemoveUsersFromNode(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleAddUsersToNode(job: Job<IAddUsersToNodePayload>) {
        try {
            const { data, node } = job.data;
            const result = await this.axios.addUsers(data, node.address, node.port);

            if (!result.isOk) {
                this.logger.error(
                    `Failed to add users to Node ${node.address}:${node.port}: ${result.message}`,
                );
            }

            return result;
        } catch (error) {
            this.logger.error(
                `Error handling "${NODES_JOB_NAMES.ADD_USERS_TO_NODE}" job: ${error}`,
            );
            return;
        }
    }

    private async handleRemoveUsersFromNode(job: Job<IRemoveUsersFromNodePayload>) {
        try {
            const { data, node } = job.data;
            const result = await this.axios.deleteUsers(data, node.address, node.port);

            if (!result.isOk) {
                this.logger.error(
                    `Failed to remove users from Node ${node.address}:${node.port}: ${result.message}`,
                );
            }

            return result;
        } catch (error) {
            this.logger.error(
                `Error handling "${NODES_JOB_NAMES.REMOVE_USERS_FROM_NODE}" job: ${error}`,
            );
            return;
        }
    }
}
