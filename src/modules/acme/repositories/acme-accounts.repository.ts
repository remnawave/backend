import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

import { Injectable } from '@nestjs/common';

import { AcmeAccountEntity } from '../entities';

@Injectable()
export class AcmeAccountsRepository {
    constructor(private readonly prisma: TransactionHost<TransactionalAdapterPrisma>) {}

    public async findByDirectoryAndEmail(
        directoryUrl: string,
        email: string,
    ): Promise<AcmeAccountEntity | null> {
        const result = await this.prisma.tx.acmeAccounts.findUnique({
            where: { directoryUrl_email: { directoryUrl, email } },
        });

        if (!result) {
            return null;
        }

        return new AcmeAccountEntity(result);
    }

    public async findByUUID(uuid: string): Promise<AcmeAccountEntity | null> {
        const result = await this.prisma.tx.acmeAccounts.findUnique({ where: { uuid } });

        if (!result) {
            return null;
        }

        return new AcmeAccountEntity(result);
    }

    public async create(data: {
        accountKeyEncrypted: string;
        directoryUrl: string;
        eabHmacEncrypted?: null | string;
        eabKid?: null | string;
        email: string;
    }): Promise<AcmeAccountEntity> {
        const result = await this.prisma.tx.acmeAccounts.create({ data });

        return new AcmeAccountEntity(result);
    }

    public async setAccountUrl(uuid: string, accountUrl: string): Promise<AcmeAccountEntity> {
        const result = await this.prisma.tx.acmeAccounts.update({
            where: { uuid },
            data: { accountUrl },
        });

        return new AcmeAccountEntity(result);
    }
}
