import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { Logger } from '@nestjs/common';
import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@contract/constants';
import { CreateManyUserActiveInboundsCommand } from './create-many-user-active-inbounds.command';
import { Transactional } from '@nestjs-cls/transactional';
import { ActiveUserInboundsRepository } from '../../repositories/active-user-inbounds.repository';

@CommandHandler(CreateManyUserActiveInboundsCommand)
export class CreateManyUserActiveInboundsHandler
    implements ICommandHandler<CreateManyUserActiveInboundsCommand, ICommandResponse<number>>
{
    public readonly logger = new Logger(CreateManyUserActiveInboundsHandler.name);

    constructor(private readonly activeUserInboundsRepository: ActiveUserInboundsRepository) {}

    @Transactional()
    async execute(command: CreateManyUserActiveInboundsCommand): Promise<ICommandResponse<number>> {
        try {
            const response = await this.activeUserInboundsRepository.createMany(
                command.userUuid,
                command.inboundUuids,
            );
            return {
                isOk: true,
                response,
            };
        } catch (error: unknown) {
            this.logger.error(`Error: ${JSON.stringify(error)}`);
            return {
                isOk: false,
                ...ERRORS.CREATE_MANY_INBOUNDS_ERROR,
            };
        }
    }
}