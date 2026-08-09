import { TAcmeProvider } from '@libs/contracts/constants';

import { AcmeCredentialEntity } from '../entities';

/**
 * Credentials as seen from outside. Secret fields never appear here — only
 * whether a secret is stored, plus the non-secret fields (endpoints and the
 * like) so the UI can show where a credential points.
 */
export class AcmeCredentialResponseModel {
    public uuid: string;
    public name: string;
    public provider: TAcmeProvider;
    public hasSecret: boolean;
    public config: Record<string, string>;
    public certificatesCount: number;
    public createdAt: Date;
    public updatedAt: Date;

    constructor(entity: AcmeCredentialEntity, config: Record<string, string>) {
        this.uuid = entity.uuid;
        this.name = entity.name;
        this.provider = entity.provider;
        this.hasSecret = entity.payloadEncrypted !== null;
        this.config = config;
        this.certificatesCount = entity.certificatesCount;
        this.createdAt = entity.createdAt;
        this.updatedAt = entity.updatedAt;
    }
}

export class GetAcmeCredentialsResponseModel {
    public total: number;
    public credentials: AcmeCredentialResponseModel[];

    constructor(credentials: AcmeCredentialResponseModel[]) {
        this.credentials = credentials;
        this.total = credentials.length;
    }
}
