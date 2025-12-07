import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';

import { TriggerThresholdNotificationCommand } from './trigger-threshold-notification.command';
import { UsersRepository } from '../../repositories/users.repository';

@CommandHandler(TriggerThresholdNotificationCommand)
export class TriggerThresholdNotificationHandler implements ICommandHandler<
    TriggerThresholdNotificationCommand,
    TResult<{ tId: bigint }[]>
> {
    public readonly logger = new Logger(TriggerThresholdNotificationHandler.name);

    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(
        command: TriggerThresholdNotificationCommand,
    ): Promise<TResult<{ tId: bigint }[]>> {
        try {
            const result = await this.usersRepository.triggerThresholdNotifications(
                command.percentages,
            );

            return ok(result);
        } catch (error: unknown) {
            this.logger.error(error);
            return fail(ERRORS.TRIGGER_THRESHOLD_NOTIFICATION_ERROR);
        }
    }
}
