import { SharedLists } from '@prisma/client';

export class SharedListEntity implements SharedLists {
    public name: string;
    public config: object;

    public createdAt: Date;
    public updatedAt: Date;

    constructor(sharedList: Partial<SharedLists>) {
        Object.assign(this, sharedList);
        return this;
    }
}
