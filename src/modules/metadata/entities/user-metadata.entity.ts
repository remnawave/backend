import { UserMeta } from '@prisma/client';

export class UserMetadataEntity implements UserMeta {
    public userId: bigint;
    public metadata: Record<string, unknown>;

    constructor(userMetadata: Partial<UserMeta>) {
        Object.assign(this, userMetadata);
        return this;
    }
}
