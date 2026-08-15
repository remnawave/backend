import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AbuseBlockerService } from '../../abuse-blocker.service';
import { ProcessAbuseReportCommand } from './process-abuse-report.command';

@CommandHandler(ProcessAbuseReportCommand)
export class ProcessAbuseReportHandler implements ICommandHandler<ProcessAbuseReportCommand> {
    constructor(private readonly abuseBlockerService: AbuseBlockerService) {}

    async execute(command: ProcessAbuseReportCommand): Promise<void> {
        await this.abuseBlockerService.processReport(
            command.nodeUuid,
            command.connectionOpts,
            command.report,
        );
    }
}
