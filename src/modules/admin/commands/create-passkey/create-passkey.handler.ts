import { ERRORS } from '@contract/constants';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';

import { PasskeyRepository } from '@modules/admin/repositories/passkey.repository';
import { PasskeyEntity } from '@modules/admin/entities';

import { CreatePasskeyCommand } from './create-passkey.command';

@CommandHandler(CreatePasskeyCommand)
export class CreatePasskeyHandler
    implements ICommandHandler<CreatePasskeyCommand, ICommandResponse<PasskeyEntity>>
{
    public readonly logger = new Logger(CreatePasskeyHandler.name);

    constructor(private readonly passkeyRepository: PasskeyRepository) {}

    async execute(command: CreatePasskeyCommand): Promise<ICommandResponse<PasskeyEntity>> {
        try {
            const result = await this.passkeyRepository.create(command.passkeyEntity);

            return {
                isOk: true,
                response: result,
            };
        } catch (error: unknown) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.CREATE_ADMIN_ERROR,
            };
        }
    }
}
