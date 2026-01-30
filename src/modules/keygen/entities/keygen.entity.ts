import type { KeygenModel as Keygen } from '@generated/prisma/models';

export class KeygenEntity implements Keygen {
    public uuid: string;
    public privKey: string;
    public pubKey: string;
    public caCert: string | null;
    public caKey: string | null;
    public clientCert: string | null;
    public clientKey: string | null;

    public createdAt: Date;
    public updatedAt: Date;

    constructor(keygen: Partial<Keygen>) {
        Object.assign(this, keygen);
        return this;
    }
}
