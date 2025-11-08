import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { PasskeyRepository } from '@modules/admin/repositories/passkey.repository';

import { DeletePasskeyCommand } from './delete-passkey.command';

@CommandHandler(DeletePasskeyCommand)
export class DeletePasskeyHandler
    implements ICommandHandler<DeletePasskeyCommand, ICommandResponse<boolean>>
{
    public readonly logger = new Logger(DeletePasskeyHandler.name);

    constructor(private readonly passkeyRepository: PasskeyRepository) {}

    async execute(command: DeletePasskeyCommand): Promise<ICommandResponse<boolean>> {
        try {
            const result = await this.passkeyRepository.deleteByUUID(command.id);

            return {
                isOk: true,
                response: result,
            };
        } catch (error: unknown) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }
}
