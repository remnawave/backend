import { Command } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { BaseTorrentBlockerReportEntity } from '@modules/node-plugins/entities';

export class CreateTorrentReportCommand extends Command<TResult<BaseTorrentBlockerReportEntity>> {
    constructor(public readonly entity: BaseTorrentBlockerReportEntity) {
        super();
    }
}
