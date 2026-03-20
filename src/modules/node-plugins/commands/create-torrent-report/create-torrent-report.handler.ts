import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { TorrentBlockerReportsRepository } from '@modules/node-plugins/repositories/torrent-blocker-report.repository';

import { CreateTorrentReportCommand } from './create-torrent-report.command';

@CommandHandler(CreateTorrentReportCommand)
export class CreateTorrentReportHandler implements ICommandHandler<CreateTorrentReportCommand> {
    public readonly logger = new Logger(CreateTorrentReportHandler.name);

    constructor(
        private readonly torrentBlockerReportsRepository: TorrentBlockerReportsRepository,
    ) {}

    async execute(command: CreateTorrentReportCommand) {
        try {
            const result = await this.torrentBlockerReportsRepository.create(command.entity);

            return ok(result);
        } catch (error: unknown) {
            this.logger.error(`Error: ${JSON.stringify(error)}`);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }
}
