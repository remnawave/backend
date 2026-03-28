import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import { AxiosService } from '@common/axios';

import { QUEUES_NAMES } from '@queue/queue.enum';

import {
    IAddUsersToNodePayload,
    IDropIpsConnectionsPayload,
    IDropUsersConnectionsPayload,
    IRemoveUsersFromNodePayload,
} from '../interfaces';
import {
    IBlockIpsPayload,
    IRecreateTablesPayload,
    IUnblockIpsPayload,
} from '../interfaces/executor.payload.interface';
import { NODES_JOB_NAMES } from '../constants/nodes-job-name.constant';

@Processor(QUEUES_NAMES.NODES.BULK_USERS, {
    concurrency: 25,
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
            case NODES_JOB_NAMES.DROP_USERS_CONNECTIONS:
                return await this.handleDropUsersConnections(job);
            case NODES_JOB_NAMES.DROP_IPS_CONNECTIONS:
                return await this.handleDropIpsConnections(job);
            case NODES_JOB_NAMES.BLOCK_IPS:
                return await this.handleBlockIps(job);
            case NODES_JOB_NAMES.UNBLOCK_IPS:
                return await this.handleUnblockIps(job);
            case NODES_JOB_NAMES.RECREATE_TABLES:
                return await this.handleRecreateTables(job);

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

    private async handleDropUsersConnections(job: Job<IDropUsersConnectionsPayload>) {
        try {
            const { data, node } = job.data;
            const result = await this.axios.dropUsersConnections(data, node.address, node.port);

            if (!result.isOk) {
                this.logger.error(
                    `Failed to drop users connections from Node ${node.address}:${node.port}: ${result.message}`,
                );
            }

            return result;
        } catch (error) {
            this.logger.error(
                `Error handling "${NODES_JOB_NAMES.DROP_USERS_CONNECTIONS}" job: ${error}`,
            );
        }
    }

    private async handleDropIpsConnections(job: Job<IDropIpsConnectionsPayload>) {
        try {
            const { data, node } = job.data;
            const result = await this.axios.dropIpsConnections(data, node.address, node.port);

            if (!result.isOk) {
                this.logger.error(
                    `Failed to drop ips connections from Node ${node.address}:${node.port}: ${result.message}`,
                );
            }

            return result;
        } catch (error) {
            this.logger.error(
                `Error handling "${NODES_JOB_NAMES.DROP_IPS_CONNECTIONS}" job: ${error}`,
            );
        }
    }

    private async handleBlockIps(job: Job<IBlockIpsPayload>) {
        try {
            const { data, node } = job.data;
            const result = await this.axios.blockIps(data, node.address, node.port);

            if (!result.isOk) {
                this.logger.error(
                    `Failed to block ips from Node ${node.address}:${node.port}: ${result.message}`,
                );
            }

            return result;
        } catch (error) {
            this.logger.error(`Error handling "${NODES_JOB_NAMES.BLOCK_IPS}" job: ${error}`);
            return;
        }
    }

    private async handleUnblockIps(job: Job<IUnblockIpsPayload>) {
        try {
            const { data, node } = job.data;
            const result = await this.axios.unblockIps(data, node.address, node.port);

            if (!result.isOk) {
                this.logger.error(
                    `Failed to unblock ips from Node ${node.address}:${node.port}: ${result.message}`,
                );
            }

            return result;
        } catch (error) {
            this.logger.error(`Error handling "${NODES_JOB_NAMES.UNBLOCK_IPS}" job: ${error}`);
            return;
        }
    }

    private async handleRecreateTables(job: Job<IRecreateTablesPayload>) {
        try {
            const { node } = job.data;
            const result = await this.axios.recreateTables(node.address, node.port);

            if (!result.isOk) {
                this.logger.error(
                    `Failed to recreate tables from Node ${node.address}:${node.port}: ${result.message}`,
                );
            }

            return result;
        } catch (error) {
            this.logger.error(`Error handling "${NODES_JOB_NAMES.RECREATE_TABLES}" job: ${error}`);
            return;
        }
    }
}
