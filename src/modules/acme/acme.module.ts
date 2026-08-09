import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AcmeCertificatesController } from './acme-certificates.controller';
import { AcmeCredentialsController } from './acme-credentials.controller';
import { COMMANDS } from './commands';
import { AcmeSecretBoxService } from './crypto/acme-secret-box.service';
import { AcmeOrderService } from './engine/acme-order.service';
import { SolverFactory } from './engine/solvers/solver.factory';
import { QUERIES } from './queries';
import { AcmeAccountsRepository } from './repositories/acme-accounts.repository';
import { AcmeCertificatesRepository } from './repositories/acme-certificates.repository';
import { AcmeCredentialsRepository } from './repositories/acme-credentials.repository';
import { AcmeEventsRepository } from './repositories/acme-events.repository';
import { AcmeCertificatesService } from './services/acme-certificates.service';
import { AcmeCredentialsService } from './services/acme-credentials.service';

@Module({
    imports: [CqrsModule],
    controllers: [AcmeCredentialsController, AcmeCertificatesController],
    providers: [
        AcmeSecretBoxService,
        SolverFactory,
        AcmeOrderService,
        AcmeCredentialsService,
        AcmeCertificatesService,
        AcmeCredentialsRepository,
        AcmeCertificatesRepository,
        AcmeAccountsRepository,
        AcmeEventsRepository,
        ...QUERIES,
        ...COMMANDS,
    ],
    exports: [AcmeSecretBoxService, AcmeCertificatesRepository],
})
export class AcmeModule {}
