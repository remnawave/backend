import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import { AxiosService } from '@common/axios';
import { buildClientEmail, parseClientEmail } from '@common/helpers/xray-config/client-email';

import { QUEUES_NAMES } from '@queue/queue.enum';

import { NODES_JOB_NAMES } from '../constants/nodes-job-name.constant';
import { IAddUserToNodePayload, IRemoveUserFromNodePayload } from '../interfaces';
import { NodeUserRemovalService } from '../node-user-removal.service';

@Processor(QUEUES_NAMES.NODES.USERS, {
    concurrency: 75,
})
export class NodeUsersQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(NodeUsersQueueProcessor.name);

    constructor(
        private readonly axios: AxiosService,
        private readonly nodeUserRemovalService: NodeUserRemovalService,
    ) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case NODES_JOB_NAMES.ADD_USER_TO_NODE:
                return await this.handleAddUserToNode(job);
            case NODES_JOB_NAMES.REMOVE_USER_FROM_NODE:
                return await this.handleRemoveUserFromNode(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleAddUserToNode(job: Job<IAddUserToNodePayload>) {
        try {
            const { data, node, cleanupInbounds } = job.data;
            const { userId } = parseClientEmail(data.data[0].username);

            const usernamesToCleanup = new Set(
                cleanupInbounds.map((inbound) => buildClientEmail(BigInt(userId), inbound.uuid)),
            );

            // Empty inboundData uses the node's add/update cleanup without dropping IP sockets.
            // Restore the full tag list on every call: removing the last hash removes its tag.
            for (const username of usernamesToCleanup) {
                const cleanupResult = await this.axios.addUsers(
                    {
                        affectedInboundTags: cleanupInbounds.map((inbound) => inbound.tag),
                        users: [
                            {
                                userData: {
                                    userId: username,
                                    hashUuid:
                                        data.hashData.prevVlessUuid ?? data.hashData.vlessUuid,
                                    vlessUuid: data.hashData.vlessUuid,
                                    trojanPassword: '',
                                    ssPassword: '',
                                },
                                inboundData: [],
                            },
                        ],
                    },
                    node,
                );

                if (!cleanupResult.isOk || !cleanupResult.response.success) {
                    this.logger.error(`Failed to clean user ${username} before node sync`);
                    return cleanupResult;
                }
            }

            const result = await this.axios.addUser(data, {
                address: node.address,
                port: node.port,
                proxyUrl: node.proxyUrl,
            });

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
            const { data, node, cleanupInbounds } = job.data;

            const result = await this.nodeUserRemovalService.removeUsers({
                data: { users: [{ userId: data.username, hashUuid: data.hashData.vlessUuid }] },
                node,
                cleanupInbounds,
            });

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
