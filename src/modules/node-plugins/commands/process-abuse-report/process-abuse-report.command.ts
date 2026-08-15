import { Command } from '@nestjs/cqrs';

import type { AbuseBlockerReportModel } from '@remnawave/node-contract';

import { INodeConnectionOpts } from '@common/axios';

export class ProcessAbuseReportCommand extends Command<void> {
    constructor(
        public readonly nodeUuid: string,
        public readonly connectionOpts: INodeConnectionOpts,
        public readonly report: AbuseBlockerReportModel,
    ) {
        super();
    }
}
