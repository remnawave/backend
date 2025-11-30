import { ERRORS } from '@contract/constants';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { NodesUserUsageHistoryRepository } from '../../repositories/nodes-user-usage-history.repository';
import { CleanOldUsageRecordsCommand } from './clean-old-usage-records.command';

@CommandHandler(CleanOldUsageRecordsCommand)
export class CleanOldUsageRecordsHandler implements ICommandHandler<
    CleanOldUsageRecordsCommand,
    ICommandResponse<{
        deletedCount: number;
    }>
> {
    public readonly logger = new Logger(CleanOldUsageRecordsHandler.name);

    constructor(
        private readonly nodesUserUsageHistoryRepository: NodesUserUsageHistoryRepository,
    ) {}

    @Transactional<TransactionalAdapterPrisma>({
        maxWait: 60_000,
        timeout: 120_000,
    })
    async execute(): Promise<
        ICommandResponse<{
            deletedCount: number;
        }>
    > {
        try {
            const deletedCount = await this.nodesUserUsageHistoryRepository.cleanOldUsageRecords();

            return {
                isOk: true,
                response: {
                    deletedCount,
                },
            };
        } catch (error: unknown) {
            this.logger.error(`Error during clean old usage records: ${error}`);
            return {
                isOk: false,
                ...ERRORS.CLEAN_OLD_USAGE_RECORDS_ERROR,
            };
        }
    }
}
