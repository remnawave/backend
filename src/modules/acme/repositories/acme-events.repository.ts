import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

import { Injectable } from '@nestjs/common';

import { TAcmeEventLevel } from '@libs/contracts/constants';

import { AcmeEventEntity } from '../entities';

/** How many events are kept per certificate; older ones are dropped on write. */
const MAX_EVENTS_PER_CERTIFICATE = 200;

@Injectable()
export class AcmeEventsRepository {
    constructor(private readonly prisma: TransactionHost<TransactionalAdapterPrisma>) {}

    public async create(
        certificateUuid: null | string,
        level: TAcmeEventLevel,
        message: string,
    ): Promise<void> {
        await this.prisma.tx.acmeEvents.create({
            data: { certificateUuid, level, message },
        });

        if (!certificateUuid) {
            return;
        }

        await this.prisma.tx.$executeRaw`
            DELETE FROM acme_events
            WHERE certificate_uuid = ${certificateUuid}::uuid
              AND id NOT IN (
                  SELECT id FROM acme_events
                  WHERE certificate_uuid = ${certificateUuid}::uuid
                  ORDER BY id DESC
                  LIMIT ${MAX_EVENTS_PER_CERTIFICATE}
              )
        `;
    }

    public async findByCertificateUuid(certificateUuid: string): Promise<AcmeEventEntity[]> {
        const result = await this.prisma.tx.acmeEvents.findMany({
            where: { certificateUuid },
            orderBy: { id: 'desc' },
            take: MAX_EVENTS_PER_CERTIFICATE,
        });

        return result.map((event) => new AcmeEventEntity(event));
    }
}
