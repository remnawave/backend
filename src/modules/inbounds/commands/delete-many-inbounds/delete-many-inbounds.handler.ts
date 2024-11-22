import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { Logger } from '@nestjs/common';
import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@contract/constants';
import { DeleteManyInboundsCommand } from './delete-many-inbounds.command';
import { InboundsRepository } from '../../repositories/inbounds.repository';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(DeleteManyInboundsCommand)
export class DeleteManyInboundsHandler
    implements ICommandHandler<DeleteManyInboundsCommand, ICommandResponse<void>>
{
    public readonly logger = new Logger(DeleteManyInboundsHandler.name);

    constructor(private readonly inboundsRepository: InboundsRepository) {}

    @Transactional()
    async execute(command: DeleteManyInboundsCommand): Promise<ICommandResponse<void>> {
        try {
            await this.inboundsRepository.deleteMany(command.tags);
            return {
                isOk: true,
            };
        } catch (error: unknown) {
            this.logger.error(`Error: ${JSON.stringify(error)}`);
            return {
                isOk: false,
                ...ERRORS.DELETE_MANY_INBOUNDS_ERROR,
            };
        }
    }
}