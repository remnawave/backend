import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { AcmeCertificateEntity } from '../../entities';
import { AcmeCertificatesRepository } from '../../repositories/acme-certificates.repository';
import { GetCertificatesDueForRenewalQuery } from './get-certificates-due-for-renewal.query';

@QueryHandler(GetCertificatesDueForRenewalQuery)
export class GetCertificatesDueForRenewalHandler implements IQueryHandler<
    GetCertificatesDueForRenewalQuery,
    TResult<AcmeCertificateEntity[]>
> {
    private readonly logger = new Logger(GetCertificatesDueForRenewalHandler.name);

    constructor(private readonly certificatesRepository: AcmeCertificatesRepository) {}

    async execute(): Promise<TResult<AcmeCertificateEntity[]>> {
        try {
            return ok(await this.certificatesRepository.findDueForRenewal(new Date()));
        } catch (error) {
            this.logger.error(error);

            return fail(ERRORS.GET_ACME_CERTIFICATES_ERROR);
        }
    }
}
