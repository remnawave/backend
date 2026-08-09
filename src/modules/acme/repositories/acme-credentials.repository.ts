import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

import { Injectable } from '@nestjs/common';

import { AcmeCredentialEntity } from '../entities';

@Injectable()
export class AcmeCredentialsRepository {
    constructor(private readonly prisma: TransactionHost<TransactionalAdapterPrisma>) {}

    public async create(data: {
        name: string;
        payloadEncrypted: null | string;
        provider: string;
    }): Promise<AcmeCredentialEntity> {
        const result = await this.prisma.tx.acmeCredentials.create({ data });

        return new AcmeCredentialEntity(result);
    }

    public async update(
        uuid: string,
        data: { name?: string; payloadEncrypted?: string },
    ): Promise<AcmeCredentialEntity> {
        const result = await this.prisma.tx.acmeCredentials.update({
            where: { uuid },
            data,
        });

        return new AcmeCredentialEntity(result);
    }

    public async findByUUID(uuid: string): Promise<AcmeCredentialEntity | null> {
        const result = await this.prisma.tx.acmeCredentials.findUnique({
            where: { uuid },
            include: { _count: { select: { certificates: true } } },
        });

        if (!result) {
            return null;
        }

        return new AcmeCredentialEntity({
            ...result,
            certificatesCount: result._count.certificates,
        });
    }

    public async findByName(name: string): Promise<AcmeCredentialEntity | null> {
        const result = await this.prisma.tx.acmeCredentials.findUnique({ where: { name } });

        if (!result) {
            return null;
        }

        return new AcmeCredentialEntity(result);
    }

    public async findAll(): Promise<AcmeCredentialEntity[]> {
        const result = await this.prisma.tx.acmeCredentials.findMany({
            include: { _count: { select: { certificates: true } } },
            orderBy: { createdAt: 'asc' },
        });

        return result.map(
            (credential) =>
                new AcmeCredentialEntity({
                    ...credential,
                    certificatesCount: credential._count.certificates,
                }),
        );
    }

    public async deleteByUUID(uuid: string): Promise<boolean> {
        const result = await this.prisma.tx.acmeCredentials.delete({ where: { uuid } });

        return !!result;
    }
}
