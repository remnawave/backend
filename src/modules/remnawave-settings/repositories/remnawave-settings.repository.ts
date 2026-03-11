import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { RemnawaveSettingsEntity } from '../entities';

const DEFAULT_REMNAAWAVE_SETTINGS_ID = 1;

@Injectable()
export class RemnawaveSettingsRepository {
    constructor(private readonly prisma: TransactionHost<TransactionalAdapterPrisma>) {}

    public async create(entity: RemnawaveSettingsEntity): Promise<RemnawaveSettingsEntity> {
        const result = await this.prisma.tx.remnawaveSettings.create({
            data: {
                id: entity.id,
                passkeySettings: entity.passkeySettings,
            },
        });

        return new RemnawaveSettingsEntity(result);
    }

    public async findById(id: number): Promise<RemnawaveSettingsEntity | null> {
        const result = await this.prisma.tx.remnawaveSettings.findUnique({
            where: { id },
        });
        if (!result) {
            return null;
        }
        return new RemnawaveSettingsEntity(result);
    }

    public async getSettings(): Promise<RemnawaveSettingsEntity> {
        const result = await this.prisma.tx.remnawaveSettings.findFirstOrThrow();
        return new RemnawaveSettingsEntity(result);
    }

    public async update({
        id = DEFAULT_REMNAAWAVE_SETTINGS_ID,
        ...data
    }: Partial<RemnawaveSettingsEntity>): Promise<RemnawaveSettingsEntity> {
        const result = await this.prisma.tx.remnawaveSettings.update({
            where: {
                id,
            },
            data,
        });

        return new RemnawaveSettingsEntity(result);
    }

    public async getInitDate(): Promise<Date> {
        const result = await this.prisma.tx.$queryRaw<{ started_at: Date }[]>`
            SELECT started_at
            FROM _prisma_migrations
            ORDER BY started_at ASC
            LIMIT 1
        `;

        if (!result.length || !result[0].started_at) {
            return new Date();
        }

        const date = new Date(result[0].started_at);

        if (isNaN(date.getTime())) {
            return new Date();
        }

        return date;
    }
}
