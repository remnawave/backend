import { ERRORS } from '@contract/constants';
import { createOPRF } from '@noble/curves/abstract/oprf.js';
import { ristretto255, ristretto255_hasher } from '@noble/curves/ed25519.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256, sha512 } from '@noble/hashes/sha2.js';

import { Injectable, Logger } from '@nestjs/common';

import { TypedConfigService } from '@common/config/app-config';
import { RawCacheService } from '@common/raw-cache/raw-cache.service';
import { fail, ok, TResult } from '@common/types';

import { EvaluateVaultResponseModel } from './models';

const oprf = createOPRF({
    hash: sha512,
    hashToGroup: ristretto255_hasher.hashToCurve,
    hashToScalar: ristretto255_hasher.hashToScalar,
    name: 'ristretto255-SHA512',
    Point: ristretto255.Point,
});

const ATTEMPT_LIMIT = 10;
const ATTEMPT_WINDOW_SECONDS = 15 * 60;

const attemptKey = (adminUuid: string) => `ssh_vault_oprf:${adminUuid}`;

@Injectable()
export class VaultOprfService {
    private readonly logger = new Logger(VaultOprfService.name);
    private readonly secretKey: Uint8Array;

    constructor(
        private readonly configService: TypedConfigService,
        private readonly rawCacheService: RawCacheService,
    ) {
        const seed = hkdf(
            sha256,
            new TextEncoder().encode(this.configService.getOrThrow('APP_SECRET')),
            undefined,
            new TextEncoder().encode('rw-vault-oprf-v1'),
            32,
        );

        this.secretKey = oprf.oprf.deriveKeyPair(
            seed,
            new TextEncoder().encode('rw-vault'),
        ).secretKey;
    }

    public async evaluate(
        adminUuid: string,
        blinded: Buffer,
    ): Promise<TResult<EvaluateVaultResponseModel>> {
        try {
            const attempts = await this.rawCacheService.incrementWithTtl(
                attemptKey(adminUuid),
                ATTEMPT_WINDOW_SECONDS,
            );

            if (attempts > ATTEMPT_LIMIT) {
                this.logger.warn(`Vault unlock rate limit reached for ${adminUuid}.`);
                return fail(ERRORS.EVALUATE_VAULT_ERROR);
            }

            const evaluated = oprf.oprf.blindEvaluate(this.secretKey, blinded);

            return ok(
                new EvaluateVaultResponseModel({
                    evaluated: Buffer.from(evaluated).toString('base64'),
                }),
            );
        } catch (error) {
            this.logger.error(`Vault evaluation failed: ${String(error)}`);
            return fail(ERRORS.EVALUATE_VAULT_ERROR);
        }
    }
}
