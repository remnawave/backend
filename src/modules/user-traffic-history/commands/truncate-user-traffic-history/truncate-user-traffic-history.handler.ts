import { ERRORS } from '@contract/constants';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { UserTrafficHistoryRepository } from '../../repositories/user-traffic-history.repository';
import { TruncateUserTrafficHistoryCommand } from './truncate-user-traffic-history.command';

@CommandHandler(TruncateUserTrafficHistoryCommand)
export class TruncateUserTrafficHistoryHandler implements ICommandHandler<
    TruncateUserTrafficHistoryCommand,
    ICommandResponse<void>
> {
    public readonly logger = new Logger(TruncateUserTrafficHistoryHandler.name);

    constructor(private readonly userTrafficHistoryRepository: UserTrafficHistoryRepository) {}

    @Transactional<TransactionalAdapterPrisma>({
        maxWait: 60_000,
        timeout: 120_000,
    })
    async execute(): Promise<ICommandResponse<void>> {
        try {
            await this.userTrafficHistoryRepository.truncateTable();

            return {
                isOk: true,
            };
        } catch (error: unknown) {
            this.logger.error(`Error during truncate table: ${error}`);
            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }
}
