import { Injectable, Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { ACME_PROVIDER_REGISTRY, ERRORS, TAcmeProvider } from '@libs/contracts/constants';

import { AcmeSecretBoxService } from '../crypto/acme-secret-box.service';
import { CreateAcmeCredentialBodyDto, UpdateAcmeCredentialBodyDto } from '../dtos';
import { SolverFactory } from '../engine/solvers/solver.factory';
import { AcmeCredentialEntity } from '../entities';
import { TAcmeCredentialPayload } from '../interfaces/credential-payload.interface';
import {
    AcmeCredentialResponseModel,
    AcmeCredentialTestResponseModel,
    GetAcmeCredentialsResponseModel,
} from '../models';
import { AcmeCredentialsRepository } from '../repositories/acme-credentials.repository';

@Injectable()
export class AcmeCredentialsService {
    private readonly logger = new Logger(AcmeCredentialsService.name);

    constructor(
        private readonly credentialsRepository: AcmeCredentialsRepository,
        private readonly secretBox: AcmeSecretBoxService,
        private readonly solverFactory: SolverFactory,
    ) {}

    public async getAll(): Promise<TResult<GetAcmeCredentialsResponseModel>> {
        try {
            const credentials = await this.credentialsRepository.findAll();

            return ok(
                new GetAcmeCredentialsResponseModel(
                    credentials.map((credential) => this.toResponse(credential)),
                ),
            );
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_ACME_CREDENTIALS_ERROR);
        }
    }

    public async create(
        dto: CreateAcmeCredentialBodyDto,
    ): Promise<TResult<AcmeCredentialResponseModel>> {
        if (!this.secretBox.isConfigured) {
            return fail(ERRORS.ACME_SECRET_KEY_MISSING);
        }

        try {
            const existing = await this.credentialsRepository.findByName(dto.name);

            if (existing) {
                return fail(ERRORS.ACME_CREDENTIAL_NAME_ALREADY_EXISTS);
            }

            const payload = this.buildPayload(dto.provider, dto.config ?? {});

            const credential = await this.credentialsRepository.create({
                name: dto.name,
                provider: dto.provider,
                payloadEncrypted: payload ? this.secretBox.encryptJson(payload) : null,
            });

            return ok(this.toResponse(credential));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.CREATE_ACME_CREDENTIAL_ERROR);
        }
    }

    public async update(
        dto: UpdateAcmeCredentialBodyDto,
    ): Promise<TResult<AcmeCredentialResponseModel>> {
        if (!this.secretBox.isConfigured) {
            return fail(ERRORS.ACME_SECRET_KEY_MISSING);
        }

        try {
            const credential = await this.credentialsRepository.findByUUID(dto.uuid);

            if (!credential) {
                return fail(ERRORS.ACME_CREDENTIAL_NOT_FOUND);
            }

            if (dto.name && dto.name !== credential.name) {
                const sameName = await this.credentialsRepository.findByName(dto.name);

                if (sameName) {
                    return fail(ERRORS.ACME_CREDENTIAL_NAME_ALREADY_EXISTS);
                }
            }

            // Secrets are write-only: a request that omits them keeps whatever is
            // stored, and a partial update merges into the existing payload so
            // changing only the base URL does not wipe the token.
            const current = this.readPayload(credential);
            const merged = this.mergePayload(credential.provider, current, dto.config ?? {});

            const updated = await this.credentialsRepository.update(dto.uuid, {
                ...(dto.name ? { name: dto.name } : {}),
                ...(merged ? { payloadEncrypted: this.secretBox.encryptJson(merged) } : {}),
            });

            return ok(this.toResponse(updated));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.UPDATE_ACME_CREDENTIAL_ERROR);
        }
    }

    public async delete(uuid: string): Promise<TResult<{ isDeleted: boolean }>> {
        try {
            const credential = await this.credentialsRepository.findByUUID(uuid);

            if (!credential) {
                return fail(ERRORS.ACME_CREDENTIAL_NOT_FOUND);
            }

            // Deleting a credential a certificate still points at would leave that
            // certificate unable to renew, and the failure would only surface weeks
            // later. Refuse instead.
            if (credential.certificatesCount > 0) {
                return fail(ERRORS.ACME_CREDENTIAL_IN_USE);
            }

            const isDeleted = await this.credentialsRepository.deleteByUUID(uuid);

            return ok({ isDeleted });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.DELETE_ACME_CREDENTIAL_ERROR);
        }
    }

    /**
     * Checks that the credential actually works and reports what it may do.
     *
     * For broker credentials this is the only way an operator sees the allow list without
     * shell access to the proxy host — which is exactly when a certificate fails
     * with "domain is not allowed" and nobody remembers what was configured.
     */
    public async test(uuid: string): Promise<TResult<AcmeCredentialTestResponseModel>> {
        if (!this.secretBox.isConfigured) {
            return fail(ERRORS.ACME_SECRET_KEY_MISSING);
        }

        try {
            const credential = await this.credentialsRepository.findByUUID(uuid);

            if (!credential) {
                return fail(ERRORS.ACME_CREDENTIAL_NOT_FOUND);
            }

            const solver = this.solverFactory.create(credential);
            const description = await solver.describe();

            return ok(new AcmeCredentialTestResponseModel(description));
        } catch (error) {
            this.logger.error(error);

            return fail(ERRORS.ACME_CREDENTIAL_TEST_FAILED.withMessage(String(error)));
        }
    }

    /** Decrypted payload of a credential, or null when there is nothing stored. */
    public readPayload(credential: AcmeCredentialEntity): null | TAcmeCredentialPayload {
        if (!credential.payloadEncrypted) {
            return null;
        }

        return this.secretBox.decryptJson<TAcmeCredentialPayload>(credential.payloadEncrypted);
    }

    public toResponse(credential: AcmeCredentialEntity): AcmeCredentialResponseModel {
        return new AcmeCredentialResponseModel(credential, this.readPublicConfig(credential));
    }

    /**
     * The non-secret provider fields, for display. A payload that cannot be
     * decrypted usually means ACME_SECRET_KEY was replaced; listing must still
     * work so the operator can see and fix the credentials.
     */
    private readPublicConfig(credential: AcmeCredentialEntity): Record<string, string> {
        if (!credential.payloadEncrypted) {
            return {};
        }

        const info = ACME_PROVIDER_REGISTRY.find((entry) => entry.provider === credential.provider);

        try {
            const payload = this.secretBox.decryptJson<TAcmeCredentialPayload>(
                credential.payloadEncrypted,
            );

            const publicConfig: Record<string, string> = {};

            for (const field of info?.fields ?? []) {
                if (!field.secret && payload[field.key]) {
                    publicConfig[field.key] = payload[field.key];
                }
            }

            return publicConfig;
        } catch (error) {
            this.logger.error(`Failed to read credential ${credential.uuid} payload: ${error}`);

            return {};
        }
    }

    /** Normalizes a single field value; URLs must not keep trailing slashes. */
    private normalizeField(key: string, value: string): string {
        return key === 'baseUrl' ? value.trim().replace(/\/+$/, '') : value.trim();
    }

    private buildPayload(
        provider: TAcmeProvider,
        config: Record<string, string>,
    ): null | TAcmeCredentialPayload {
        const info = ACME_PROVIDER_REGISTRY.find((entry) => entry.provider === provider);

        if (!info || info.fields.length === 0) {
            return null;
        }

        const payload: TAcmeCredentialPayload = {};

        // Only registry keys are stored: whatever else arrives in config is
        // dropped rather than persisted blindly.
        for (const field of info.fields) {
            const value = config[field.key];

            if (value) {
                payload[field.key] = this.normalizeField(field.key, value);
            }
        }

        return Object.keys(payload).length > 0 ? payload : null;
    }

    private mergePayload(
        provider: TAcmeProvider,
        current: null | TAcmeCredentialPayload,
        config: Record<string, string>,
    ): null | TAcmeCredentialPayload {
        const info = ACME_PROVIDER_REGISTRY.find((entry) => entry.provider === provider);

        if (!info || info.fields.length === 0) {
            return null;
        }

        const merged: TAcmeCredentialPayload = { ...(current ?? {}) };
        let touched = false;

        for (const field of info.fields) {
            const value = config[field.key];

            // An empty string is what an untouched secret input submits as:
            // it means "keep what is stored", not "erase it".
            if (value) {
                merged[field.key] = this.normalizeField(field.key, value);
                touched = true;
            }
        }

        return touched ? merged : null;
    }
}
