import type { ApiTokensModel as ApiTokens } from '@generated/prisma/models';

export class ApiTokenEntity implements ApiTokens {
    public uuid: string;
    public token: string;
    public tokenName: string;

    public createdAt: Date;
    public updatedAt: Date;

    constructor(apiToken: Partial<ApiTokens>) {
        Object.assign(this, apiToken);
        return this;
    }
}
