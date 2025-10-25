import { AuthenticatorTransportFuture } from '@simplewebauthn/server';
import { Passkeys } from '@prisma/client';

type TTransports = AuthenticatorTransportFuture;

export class PasskeyEntity implements Passkeys {
    public id: string;
    public adminUuid: string;
    public publicKey: Uint8Array<ArrayBufferLike>;
    public counter: bigint;
    public deviceType: string;
    public backedUp: boolean;
    public transports: string | null;
    public passkeyProvider: string | null;
    public createdAt: Date;
    public updatedAt: Date;

    constructor(passkey: Partial<Passkeys>) {
        Object.assign(this, passkey);
        return this;
    }

    public getTransports(): TTransports[] {
        if (!this.transports) return [];
        return this.transports.split(',').map((transport) => transport as TTransports);
    }
}
