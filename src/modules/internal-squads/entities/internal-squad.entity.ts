import { InternalSquads } from '@prisma/client';

export class InternalSquadEntity implements InternalSquads {
    public uuid: string;
    public viewPosition: number;
    public name: string;

    public createdAt: Date;
    public updatedAt: Date;

    constructor(internalSquad: Partial<InternalSquads>) {
        Object.assign(this, internalSquad);
        return this;
    }
}
