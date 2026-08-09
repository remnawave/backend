import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Cron } from '@nestjs/schedule';

import { GetCertificatesDueForRenewalQuery } from '@modules/acme/queries/get-certificates-due-for-renewal';

import { AcmeQueueService } from '@queue/_acme';

import { JOBS_INTERVALS } from '../../intervals';

/**
 * Queues certificates that are due.
 *
 * "Due" covers three cases at once: never issued, inside the renewal window, and
 * failed with the backoff expired. Certificates waiting for a record to be
 * published by hand are left alone.
 */
@Injectable()
export class AcmeRenewTask {
    private static readonly CRON_NAME = 'acmeRenew';
    private readonly logger = new Logger(AcmeRenewTask.name);

    constructor(
        private readonly queryBus: QueryBus,
        private readonly acmeQueueService: AcmeQueueService,
    ) {}

    @Cron(JOBS_INTERVALS.ACME_RENEW, {
        name: AcmeRenewTask.CRON_NAME,
        waitForCompletion: true,
    })
    async handleCron() {
        try {
            const result = await this.queryBus.execute(new GetCertificatesDueForRenewalQuery());

            if (!result.isOk || result.response.length === 0) {
                return;
            }

            this.logger.log(`Queueing ${result.response.length} certificate(s) for issuance`);

            for (const certificate of result.response) {
                await this.acmeQueueService.issueCertificate({
                    certificateUuid: certificate.uuid,
                });
            }
        } catch (error) {
            this.logger.error(error);
        }
    }
}
