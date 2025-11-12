import { ERRORS } from '@contract/constants';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { TriggerThresholdNotificationCommand } from './trigger-threshold-notification.command';
import { UsersRepository } from '../../repositories/users.repository';

@CommandHandler(TriggerThresholdNotificationCommand)
export class TriggerThresholdNotificationHandler
    implements
        ICommandHandler<TriggerThresholdNotificationCommand, ICommandResponse<{ tId: bigint }[]>>
{
    public readonly logger = new Logger(TriggerThresholdNotificationHandler.name);

    constructor(private readonly usersRepository: UsersRepository) {}

    @Transactional<TransactionalAdapterPrisma>({
        maxWait: 20_000,
        timeout: 120_000,
    })
    async execute(
        command: TriggerThresholdNotificationCommand,
    ): Promise<ICommandResponse<{ tId: bigint }[]>> {
        try {
            const result = await this.usersRepository.triggerThresholdNotifications(
                command.percentages,
            );

            return {
                isOk: true,
                response: result,
            };
        } catch (error: unknown) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.TRIGGER_THRESHOLD_NOTIFICATION_ERROR,
            };
        }
    }
}
