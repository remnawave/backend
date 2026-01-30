import type { AdminModel as Admin } from '@generated/prisma/models';

import { TRoleTypes } from '@libs/contracts/constants';

export class AdminEntity implements Admin {
    public uuid: string;
    public username: string;
    public passwordHash: string;
    public role: TRoleTypes;

    public createdAt: Date;
    public updatedAt: Date;

    constructor(admin: Partial<Admin>) {
        Object.assign(this, admin);
        return this;
    }
}
