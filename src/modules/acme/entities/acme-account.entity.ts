import { AcmeAccounts } from '@prisma/client';

export class AcmeAccountEntity implements AcmeAccounts {
    public uuid: string;
    public directoryUrl: string;
    public email: string;
    public accountUrl: null | string;

    public accountKeyEncrypted: string;
    public eabKid: null | string;
    public eabHmacEncrypted: null | string;

    public createdAt: Date;
    public updatedAt: Date;

    constructor(account: Partial<AcmeAccounts>) {
        Object.assign(this, account);

        return this;
    }
}
