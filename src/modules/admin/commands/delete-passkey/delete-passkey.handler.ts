import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, TResult, ok } from '@common/types';

import { PasskeyRepository } from '@modules/admin/repositories/passkey.repository';

import { DeletePasskeyCommand } from './delete-passkey.command';

@CommandHandler(DeletePasskeyCommand)
export class DeletePasskeyHandler implements ICommandHandler<
    DeletePasskeyCommand,
    TResult<boolean>
> {
    public readonly logger = new Logger(DeletePasskeyHandler.name);

    constructor(private readonly passkeyRepository: PasskeyRepository) {}

    async execute(command: DeletePasskeyCommand): Promise<TResult<boolean>> {
        try {
            const result = await this.passkeyRepository.deleteByUUID(command.id);

            return ok(result);
        } catch (error: unknown) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
