import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import { AxiosService } from '@common/axios';

import { QUEUES_NAMES } from '@queue/queue.enum';

import { IAddUserToNodePayload, IRemoveUserFromNodePayload } from '../interfaces';
import { NODES_JOB_NAMES } from '../constants/nodes-job-name.constant';

@Processor(QUEUES_NAMES.NODES.USERS, {
    concurrency: 75,
})
export class NodeUsersQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(NodeUsersQueueProcessor.name);

    constructor(private readonly axios: AxiosService) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case NODES_JOB_NAMES.ADD_USER_TO_NODE:
                return this.handleAddUsersToNode(job);
            case NODES_JOB_NAMES.REMOVE_USER_FROM_NODE:
                return this.handleRemoveUserFromNode(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleAddUsersToNode(job: Job<IAddUserToNodePayload>) {
        try {
            const { data, node } = job.data;
            const result = await this.axios.addUser(data, node.address, node.port);

            if (!result.isOk) {
                this.logger.error(
                    `Failed to add users to Node ${node.address}:${node.port}: ${result.message}`,
                );
            }

            return result;
        } catch (error) {
            this.logger.error(`Error handling "${NODES_JOB_NAMES.ADD_USER_TO_NODE}" job: ${error}`);
            return;
        }
    }

    private async handleRemoveUserFromNode(job: Job<IRemoveUserFromNodePayload>) {
        try {
            const { data, node } = job.data;

            const result = await this.axios.deleteUser(data, node.address, node.port);

            if (!result.isOk) {
                this.logger.error(
                    `Failed to remove user from Node ${node.address}:${node.port}: ${result.message}`,
                );
            }

            return result;
        } catch (error) {
            this.logger.error(
                `Error handling "${NODES_JOB_NAMES.REMOVE_USER_FROM_NODE}" job: ${error}`,
            );
            return;
        }
    }
}
