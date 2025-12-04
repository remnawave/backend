import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { UpdateSubLastOpenedAndUserAgentCommand } from './update-sub-last-opened-and-user-agent.command';
import { UsersRepository } from '../../repositories/users.repository';

@CommandHandler(UpdateSubLastOpenedAndUserAgentCommand)
export class UpdateSubLastOpenedAndUserAgentHandler implements ICommandHandler<UpdateSubLastOpenedAndUserAgentCommand> {
    public readonly logger = new Logger(UpdateSubLastOpenedAndUserAgentHandler.name);

    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(command: UpdateSubLastOpenedAndUserAgentCommand) {
        try {
            await this.usersRepository.updateSubLastOpenedAndUserAgent(
                command.userUuid,
                command.subLastOpenedAt,
                command.subLastUserAgent,
            );

            return;
        } catch (error: unknown) {
            this.logger.error(`Error: ${JSON.stringify(error)}`);
            return;
        }
    }
}
