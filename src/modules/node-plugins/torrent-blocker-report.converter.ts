import { TorrentBlockerReports } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { BaseTorrentBlockerReportEntity } from './entities';

const modelToEntity = (model: TorrentBlockerReports): BaseTorrentBlockerReportEntity => {
    return new BaseTorrentBlockerReportEntity(model);
};

const entityToModel = (entity: BaseTorrentBlockerReportEntity): TorrentBlockerReports => {
    return {
        id: entity.id,
        userId: entity.userId,
        nodeId: entity.nodeId,
        report: entity.report,
        createdAt: entity.createdAt,
    };
};

@Injectable()
export class TorrentBlockerReportConverter extends UniversalConverter<
    BaseTorrentBlockerReportEntity,
    TorrentBlockerReports
> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
