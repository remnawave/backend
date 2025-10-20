import { ExternalSquads } from '@prisma/client';

export class ExternalSquadEntity implements ExternalSquads {
    public uuid: string;
    public name: string;

    public createdAt: Date;
    public updatedAt: Date;

    constructor(externalSquad: Partial<ExternalSquads>) {
        Object.assign(this, externalSquad);
        return this;
    }
}
