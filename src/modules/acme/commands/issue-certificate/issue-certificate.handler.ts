import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { NodesQueuesService } from '@queue/_nodes';

import { AcmeOrderService, IIssueResult } from '../../engine/acme-order.service';
import { IssueCertificateCommand } from './issue-certificate.command';

/**
 * Runs an order and, on success, restarts the nodes the certificate is bound to.
 *
 * The queue processor reaches issuance through this command rather than by
 * injecting the module's services, which is how the rest of the codebase keeps
 * queues and modules from importing each other.
 */
@CommandHandler(IssueCertificateCommand)
export class IssueCertificateHandler implements ICommandHandler<
    IssueCertificateCommand,
    TResult<IIssueResult>
> {
    private readonly logger = new Logger(IssueCertificateHandler.name);

    constructor(
        private readonly acmeOrderService: AcmeOrderService,
        private readonly nodesQueuesService: NodesQueuesService,
    ) {}

    async execute(command: IssueCertificateCommand): Promise<TResult<IIssueResult>> {
        try {
            const result = await this.acmeOrderService.issue(
                command.certificateUuid,
                command.force,
            );

            for (const nodeUuid of new Set(result.affectedNodeUuids)) {
                // The node picks the certificate up when its config is rebuilt, so
                // a restart is what actually delivers a renewal.
                await this.nodesQueuesService.startNode({ nodeUuid });
            }

            return ok(result);
        } catch (error) {
            this.logger.error(error);

            return fail(ERRORS.ACME_CERTIFICATE_ISSUE_ERROR.withMessage(String(error)));
        }
    }
}
