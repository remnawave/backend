import { BaseAgent, ParsedKey } from 'ssh2';

import {
    IBrowserAgentTransport,
    IdentitiesCallback,
    IPendingRequest,
    SignCallback,
} from '../interfaces';

function publicKeyBlob(key: Buffer | ParsedKey): Buffer {
    return Buffer.isBuffer(key) ? key : key.getPublicSSH();
}

const REQUEST_TIMEOUT_MS = 30_000;

export class BrowserSshAgent extends BaseAgent {
    private readonly pending = new Map<number, IPendingRequest>();
    private nextId = 1;

    constructor(private readonly transport: IBrowserAgentTransport) {
        super();
    }

    getIdentities(cb: IdentitiesCallback): void {
        const id = this.nextId++;

        this.track(id, {
            reject: (error) => cb(error),
            resolveIdentities: (keys) => cb(null, keys),
        });

        this.transport.requestIdentities(id);
    }

    sign(
        pubKey: Buffer | ParsedKey,
        data: Buffer,
        options: SignCallback | { hash?: string },
        cb?: SignCallback,
    ): void {
        const callback = typeof options === 'function' ? options : cb!;
        const hash = typeof options === 'function' ? null : (options.hash ?? null);

        const id = this.nextId++;

        this.track(id, {
            reject: (error) => callback(error),
            resolveSignature: (signature) => callback(null, signature),
        });

        this.transport.requestSignature(id, publicKeyBlob(pubKey), data, hash);
    }

    public resolveIdentities(id: number, keys: string[]): void {
        this.take(id)?.resolveIdentities?.(keys);
    }

    public resolveSignature(id: number, signature: Buffer): void {
        this.take(id)?.resolveSignature?.(signature);
    }

    public rejectRequest(id: number, message: string): void {
        this.take(id)?.reject(new Error(message));
    }

    public destroy(reason: string): void {
        for (const id of this.pending.keys()) {
            this.rejectRequest(id, reason);
        }
    }

    private track(id: number, handlers: Omit<IPendingRequest, 'timer'>): void {
        const timer = setTimeout(() => {
            this.rejectRequest(id, 'Browser did not answer the agent request in time');
        }, REQUEST_TIMEOUT_MS);

        timer.unref();

        this.pending.set(id, { ...handlers, timer });
    }

    private take(id: number): IPendingRequest | undefined {
        const request = this.pending.get(id);
        if (!request) {
            return undefined;
        }

        clearTimeout(request.timer);
        this.pending.delete(id);

        return request;
    }
}
