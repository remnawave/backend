import { AcmeCredentials } from '@prisma/client';

import { TAcmeProvider } from '@libs/contracts/constants';

export class AcmeCredentialEntity implements AcmeCredentials {
    public uuid: string;
    public name: string;
    public provider: TAcmeProvider;
    public payloadEncrypted: null | string;

    public createdAt: Date;
    public updatedAt: Date;

    /** How many certificates use this credential; a credential in use cannot be deleted. */
    public certificatesCount: number;

    constructor(credential: Partial<AcmeCredentials> & { certificatesCount?: number }) {
        Object.assign(this, credential);

        this.certificatesCount = credential.certificatesCount ?? 0;

        return this;
    }
}
