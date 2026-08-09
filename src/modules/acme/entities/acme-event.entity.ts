import { AcmeEvents } from '@prisma/client';

import { TAcmeEventLevel } from '@libs/contracts/constants';

export class AcmeEventEntity implements AcmeEvents {
    public id: bigint;
    public certificateUuid: null | string;
    public level: TAcmeEventLevel;
    public message: string;
    public createdAt: Date;

    constructor(event: Partial<AcmeEvents>) {
        Object.assign(this, event);

        return this;
    }
}
