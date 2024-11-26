import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ICommandResponse } from '@common/types/command-response.type';
import { Transactional } from '@nestjs-cls/transactional';
import { ERRORS } from '@contract/constants';
import { UsersRepository } from '../../repositories/users.repository';
import { UpdateSubLastOpenedAndUserAgentCommand } from './update-sub-last-opened-and-user-agent.command';

@CommandHandler(UpdateSubLastOpenedAndUserAgentCommand)
export class UpdateSubLastOpenedAndUserAgentHandler
    implements ICommandHandler<UpdateSubLastOpenedAndUserAgentCommand, ICommandResponse<void>>
{
    public readonly logger = new Logger(UpdateSubLastOpenedAndUserAgentHandler.name);

    constructor(private readonly usersRepository: UsersRepository) {}

    @Transactional()
    async execute(
        command: UpdateSubLastOpenedAndUserAgentCommand,
    ): Promise<ICommandResponse<void>> {
        try {
            await this.usersRepository.updateSubLastOpenedAndUserAgent(
                command.userUuid,
                command.subLastOpenedAt,
                command.subLastUserAgent,
            );

            return {
                isOk: true,
            };
        } catch (error: unknown) {
            this.logger.error(`Error: ${JSON.stringify(error)}`);
            return {
                isOk: false,
                ...ERRORS.UPDATE_USER_ERROR,
            };
        }
    }
}