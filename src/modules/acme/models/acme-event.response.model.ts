import { TAcmeEventLevel } from '@libs/contracts/constants';

import { AcmeEventEntity } from '../entities';

export class AcmeEventResponseModel {
    public id: number;
    public certificateUuid: null | string;
    public level: TAcmeEventLevel;
    public message: string;
    public createdAt: Date;

    constructor(entity: AcmeEventEntity) {
        this.id = Number(entity.id);
        this.certificateUuid = entity.certificateUuid;
        this.level = entity.level;
        this.message = entity.message;
        this.createdAt = entity.createdAt;
    }
}

export class GetAcmeCertificateEventsResponseModel {
    public total: number;
    public events: AcmeEventResponseModel[];

    constructor(events: AcmeEventResponseModel[]) {
        this.events = events;
        this.total = events.length;
    }
}
