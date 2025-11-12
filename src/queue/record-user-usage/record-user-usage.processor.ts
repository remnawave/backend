import { Job } from 'bullmq';
import pMap from 'p-map';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { GetUsersStatsCommand } from '@remnawave/node-contract';

import { ICommandResponse } from '@common/types/command-response.type';
import { fromNanoToNumber } from '@common/utils/nano';
import { AxiosService } from '@common/axios';

import { BulkUpsertUserHistoryEntryCommand } from '@modules/nodes-user-usage-history/commands/bulk-upsert-user-history-entry';
import { NodesUserUsageHistoryEntity } from '@modules/nodes-user-usage-history/entities';
import { GetUuidByUsernameQuery } from '@modules/users/queries/get-uuid-by-username';
import { UpdateNodeCommand } from '@modules/nodes/commands/update-node';
import { NodesEntity } from '@modules/nodes';

import { UpdateUsersUsageQueueService } from '@queue/update-users-usage/update-users-usage.service';

import { RecordUserUsagePayload } from './interfaces';
import { RecordUserUsageJobNames } from './enums';
import { QueueNames } from '../queue.enum';

@Processor(QueueNames.recordUserUsage, {
    concurrency: 50,
})
export class RecordUserUsageQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(RecordUserUsageQueueProcessor.name);

    constructor(
        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
        private readonly axios: AxiosService,
        private readonly updateUsersUsageQueueService: UpdateUsersUsageQueueService,
    ) {
        super();
    }

    async process(job: Job<RecordUserUsagePayload>) {
        try {
            const { nodeUuid, nodeAddress, nodePort, consumptionMultiplier, nodeId } = job.data;

            const response = await this.axios.getUsersStats(
                {
                    reset: true,
                },
                nodeAddress,
                nodePort,
            );

            switch (response.isOk) {
                case true:
                    return await this.handleOk(
                        nodeUuid,
                        BigInt(nodeId),
                        response.response!,
                        consumptionMultiplier,
                    );
                case false:
                    await this.updateNode({
                        node: {
                            uuid: nodeUuid,
                            usersOnline: 0,
                        },
                    });

                    this.logger.error(
                        `Failed to get users stats, node: ${nodeUuid} – ${nodeAddress}:${nodePort}, error: ${JSON.stringify(
                            response,
                        )}`,
                    );

                    return;
            }
        } catch (error) {
            this.logger.error(
                `Error handling "${RecordUserUsageJobNames.recordUserUsage}" job: ${error}`,
            );
            return { isOk: false };
        }
    }

    private async handleOk(
        nodeUuid: string,
        nodeId: bigint,
        response: GetUsersStatsCommand.Response,
        consumptionMultiplier: string,
    ) {
        let usersOnline = 0;

        let users = response.response.users.filter((user) => {
            if (user.downlink === 0 && user.uplink === 0) {
                return false;
            }
            usersOnline++;
            return true;
        });

        let allUsageRecords: NodesUserUsageHistoryEntity[] = [];
        let userUsageList: { u: string; b: string; n: string }[] = [];

        if (users.length > 0) {
            await pMap(
                users,
                async (xrayUser) => {
                    const userResponse = await this.queryBus.execute(
                        new GetUuidByUsernameQuery(xrayUser.username),
                    );

                    if (!userResponse.isOk || !userResponse.response) {
                        return;
                    }

                    const totalBytes = xrayUser.downlink + xrayUser.uplink;

                    const { tId } = userResponse.response;

                    allUsageRecords.push(
                        new NodesUserUsageHistoryEntity({
                            nodeId: nodeId,
                            userId: tId,
                            totalBytes: BigInt(totalBytes),
                        }),
                    );

                    userUsageList.push({
                        u: tId.toString(),
                        b: this.multiplyConsumption(consumptionMultiplier, totalBytes).toString(),
                        n: nodeUuid,
                    });
                },
                { concurrency: 40 },
            );

            await this.reportBulkUserUsageHistory({
                userUsageHistoryList: allUsageRecords,
            });

            await this.updateUsersUsageQueueService.updateUserUsage(userUsageList);
        }

        await this.updateNode({
            node: {
                uuid: nodeUuid,
                usersOnline,
            },
        });

        allUsageRecords = [];
        userUsageList = [];
        users = [];

        return;
    }

    private async reportBulkUserUsageHistory(
        dto: BulkUpsertUserHistoryEntryCommand,
    ): Promise<ICommandResponse<void>> {
        return this.commandBus.execute<BulkUpsertUserHistoryEntryCommand, ICommandResponse<void>>(
            new BulkUpsertUserHistoryEntryCommand(dto.userUsageHistoryList),
        );
    }

    private async updateNode(dto: UpdateNodeCommand): Promise<ICommandResponse<NodesEntity>> {
        return this.commandBus.execute<UpdateNodeCommand, ICommandResponse<NodesEntity>>(
            new UpdateNodeCommand(dto.node),
        );
    }

    private multiplyConsumption(consumptionMultiplier: string, totalBytes: number): bigint {
        const consumptionMultiplierNumber = BigInt(consumptionMultiplier);
        if (consumptionMultiplierNumber === BigInt(1000000000)) {
            // skip if 1:1 ratio
            return BigInt(totalBytes);
        }

        return BigInt(Math.floor(fromNanoToNumber(consumptionMultiplierNumber) * totalBytes));
    }
}
