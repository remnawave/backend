import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { PasskeyRepository } from '@modules/admin/repositories/passkey.repository';
import { PasskeyEntity } from '@modules/admin/entities';

import { UpdatePasskeyCommand } from './update-passkey.command';

@CommandHandler(UpdatePasskeyCommand)
export class UpdatePasskeyHandler implements ICommandHandler<
    UpdatePasskeyCommand,
    ICommandResponse<PasskeyEntity>
> {
    public readonly logger = new Logger(UpdatePasskeyHandler.name);

    constructor(private readonly passkeyRepository: PasskeyRepository) {}

    async execute(command: UpdatePasskeyCommand): Promise<ICommandResponse<PasskeyEntity>> {
        try {
            const result = await this.passkeyRepository.update({
                id: command.id,
                ...command.data,
            });

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
