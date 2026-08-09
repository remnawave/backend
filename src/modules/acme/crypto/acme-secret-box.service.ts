import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { TypedConfigService } from '@common/config/app-config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const FORMAT_VERSION = 'v1';

/**
 * Encrypts the ACME module's secrets at rest: DNS provider credentials, ACME
 * account keys and certificate private keys.
 *
 * The key comes from ACME_SECRET_KEY and is deliberately separate from
 * APP_SECRET: rotating the login secret should not make every stored
 * certificate unreadable, and vice versa.
 *
 * Stored form is "v1:<base64 iv>:<base64 ciphertext+tag>". The version prefix is
 * there so a future format change can be recognised instead of failing as
 * corrupted data.
 */
@Injectable()
export class AcmeSecretBoxService {
    private readonly key: Buffer | null;

    constructor(private readonly configService: TypedConfigService) {
        const raw = this.configService.get('ACME_SECRET_KEY');

        if (!raw) {
            this.key = null;
            return;
        }

        const key = Buffer.from(raw, 'base64');

        this.key = key.length === KEY_LENGTH ? key : null;
    }

    /**
     * Whether a usable key is configured. Callers check this and fail with a
     * clear error instead of silently storing secrets in the clear.
     */
    public get isConfigured(): boolean {
        return this.key !== null;
    }

    public encrypt(plaintext: string): string {
        const key = this.requireKey();
        const iv = randomBytes(IV_LENGTH);
        const cipher = createCipheriv(ALGORITHM, key, iv);

        const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();

        return [
            FORMAT_VERSION,
            iv.toString('base64'),
            Buffer.concat([ciphertext, authTag]).toString('base64'),
        ].join(':');
    }

    public decrypt(payload: string): string {
        const key = this.requireKey();
        const [version, ivPart, bodyPart] = payload.split(':');

        if (version !== FORMAT_VERSION || !ivPart || !bodyPart) {
            throw new Error('Unrecognized encrypted payload format');
        }

        const iv = Buffer.from(ivPart, 'base64');
        const body = Buffer.from(bodyPart, 'base64');

        const ciphertext = body.subarray(0, body.length - AUTH_TAG_LENGTH);
        const authTag = body.subarray(body.length - AUTH_TAG_LENGTH);

        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    }

    public encryptJson<T>(value: T): string {
        return this.encrypt(JSON.stringify(value));
    }

    public decryptJson<T>(payload: string): T {
        return JSON.parse(this.decrypt(payload)) as T;
    }

    private requireKey(): Buffer {
        if (!this.key) {
            throw new Error('ACME_SECRET_KEY is not configured');
        }

        return this.key;
    }
}
