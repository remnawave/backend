import {
    type PublicKeyCredentialCreationOptionsJSON,
    RegistrationResponseJSON,
    generateRegistrationOptions,
    verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { findAuthenticatorById } from 'passkey-authenticator-aaguids';
import { Cache } from 'cache-manager';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { QueryBus } from '@nestjs/cqrs';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants/errors';
import { CACHE_KEYS } from '@libs/contracts/constants';

import { GetCachedRemnawaveSettingsQuery } from '@modules/remnawave-settings/queries/get-cached-remnawave-settings';
import { IJWTAuthPayload } from '@modules/auth/interfaces';
import { PasskeyEntity } from '@modules/admin/entities';

import { UpdatePasskeyRequestDto, VerifyPasskeyRegistrationRequestDto } from '../dtos';
import { GetActivePasskeysResponseModel } from '../models/get-active-passkeys.model';
import { PasskeyRepository } from '../repositories/passkey.repository';
import { AdminRepository } from '../repositories/admin.repository';

const RP_NAME = 'Remnawave';

@Injectable()
export class PasskeyService {
    private readonly logger = new Logger(PasskeyService.name);

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly adminRepository: AdminRepository,
        private readonly passkeyRepository: PasskeyRepository,
        private readonly queryBus: QueryBus,
    ) {}

    public async generatePasskeyRegistrationOptions(
        payload: IJWTAuthPayload,
    ): Promise<TResult<PublicKeyCredentialCreationOptionsJSON>> {
        try {
            const { uuid } = payload;

            if (!uuid) {
                return {
                    isOk: false,
                    ...ERRORS.FORBIDDEN,
                };
            }

            const admin = await this.adminRepository.findByUUID(uuid);

            if (!admin) {
                return {
                    isOk: false,
                    ...ERRORS.ADMIN_NOT_FOUND,
                };
            }

            const { passkeySettings } = await this.queryBus.execute(
                new GetCachedRemnawaveSettingsQuery(),
            );

            if (!passkeySettings.enabled) {
                return {
                    isOk: false,
                    ...ERRORS.PASSKEYS_NOT_ENABLED,
                };
            }

            if (!passkeySettings.rpId || !passkeySettings.origin) {
                return {
                    isOk: false,
                    ...ERRORS.PASSKEYS_NOT_CONFIGURED,
                };
            }

            const existingPasskeys = await this.passkeyRepository.findByCriteria({
                adminUuid: uuid,
            });

            const options = await generateRegistrationOptions({
                rpName: RP_NAME,
                rpID: passkeySettings.rpId,
                userName: admin.username,
                userDisplayName: 'Remnawave Administrator',
                userID: new Uint8Array(Buffer.from(admin.uuid)),
                attestationType: 'none',
                excludeCredentials: existingPasskeys.map((passkey) => ({
                    id: passkey.id,
                    transports: passkey.getTransports(),
                })),
                authenticatorSelection: {
                    residentKey: 'preferred',
                    userVerification: 'required',
                },
            });

            await this.cacheManager.set(
                CACHE_KEYS.PASSKEY_REGISTRATION_OPTIONS(uuid),
                options.challenge,
                300_000,
            );

            return {
                isOk: true,
                response: options,
            };
        } catch (error) {
            this.logger.error(`Passkey registration options error: ${error}`);
            return {
                isOk: false,
                ...ERRORS.GENERATE_PASSKEY_REGISTRATION_OPTIONS,
            };
        }
    }

    public async verifyPasskeyRegistration(
        jwtPayload: IJWTAuthPayload,
        dto: VerifyPasskeyRegistrationRequestDto,
    ): Promise<TResult<{ verified: boolean; message: string }>> {
        try {
            const response = dto.response as unknown as RegistrationResponseJSON;

            const { uuid } = jwtPayload;

            if (!uuid) {
                return fail(ERRORS.FORBIDDEN);
            }

            const admin = await this.adminRepository.findByUUID(uuid);

            if (!admin) {
                return fail(ERRORS.ADMIN_NOT_FOUND);
            }

            const expectedChallenge = await this.cacheManager.get<string>(
                CACHE_KEYS.PASSKEY_REGISTRATION_OPTIONS(admin.uuid),
            );

            if (!expectedChallenge) {
                return fail({
                    ...ERRORS.FORBIDDEN,
                    message: 'Challenge not found or expired',
                });
            }

            await this.cacheManager.del(CACHE_KEYS.PASSKEY_REGISTRATION_OPTIONS(uuid));

            const { passkeySettings } = await this.queryBus.execute(
                new GetCachedRemnawaveSettingsQuery(),
            );

            if (!passkeySettings.enabled) {
                return fail(ERRORS.PASSKEYS_NOT_ENABLED);
            }

            if (!passkeySettings.rpId || !passkeySettings.origin) {
                return fail(ERRORS.PASSKEYS_NOT_CONFIGURED);
            }

            const verification = await verifyRegistrationResponse({
                response,
                expectedChallenge,
                expectedOrigin: passkeySettings.origin,
                expectedRPID: passkeySettings.rpId,
                requireUserVerification: true,
            });

            if (!verification.verified || !verification.registrationInfo) {
                this.logger.error(`Passkey registration verification error.`);
                return fail(ERRORS.VERIFY_PASSKEY_REGISTRATION_ERROR);
            }

            const { credential, credentialDeviceType, credentialBackedUp } =
                verification.registrationInfo;

            const authenticator = findAuthenticatorById({
                authenticatorId: verification.registrationInfo.aaguid,
            });

            const provider = authenticator?.name;

            await this.passkeyRepository.create(
                new PasskeyEntity({
                    id: credential.id,
                    adminUuid: admin.uuid,
                    publicKey: Buffer.from(credential.publicKey),
                    counter: BigInt(credential.counter),
                    deviceType: credentialDeviceType,
                    backedUp: credentialBackedUp,
                    transports: credential.transports?.join(',') ?? null,
                    passkeyProvider: provider,
                }),
            );

            return ok({
                verified: true,
                message: 'Passkey registered successfully',
            });
        } catch (error) {
            this.logger.error(`Passkey registration verification error: ${error}`);
            return fail(ERRORS.VERIFY_PASSKEY_REGISTRATION_ERROR);
        }
    }

    public async getActivePasskeys(
        payload: IJWTAuthPayload,
    ): Promise<TResult<GetActivePasskeysResponseModel>> {
        try {
            const { uuid } = payload;

            if (!uuid) return fail(ERRORS.FORBIDDEN);

            const admin = await this.adminRepository.findByUUID(uuid);

            if (!admin) return fail(ERRORS.ADMIN_NOT_FOUND);

            const passkeys = await this.passkeyRepository.findByCriteria({
                adminUuid: admin.uuid,
            });

            return ok(
                new GetActivePasskeysResponseModel({
                    passkeys: passkeys.map((passkey) => ({
                        id: passkey.id,
                        name: passkey.passkeyProvider ?? 'Unknown',
                        createdAt: passkey.createdAt,
                        lastUsedAt: passkey.updatedAt,
                    })),
                }),
            );
        } catch (error) {
            this.logger.error(`Get active passkeys error: ${error}`);
            return fail(ERRORS.GET_ACTIVE_PASSKEYS_ERROR);
        }
    }

    public async deletePasskey(
        payload: IJWTAuthPayload,
        id: string,
    ): Promise<TResult<GetActivePasskeysResponseModel>> {
        try {
            const { uuid } = payload;

            if (!uuid) return fail(ERRORS.FORBIDDEN);

            const admin = await this.adminRepository.findByUUID(uuid);

            if (!admin) return fail(ERRORS.ADMIN_NOT_FOUND);

            await this.passkeyRepository.deleteByUUID(id);

            return await this.getActivePasskeys(payload);
        } catch (error) {
            this.logger.error(`Delete passkey error: ${error}`);
            return fail(ERRORS.DELETE_PASSKEY_ERROR);
        }
    }

    public async updatePasskey(
        jwtPayload: IJWTAuthPayload,
        dto: UpdatePasskeyRequestDto,
    ): Promise<TResult<GetActivePasskeysResponseModel>> {
        try {
            const { uuid } = jwtPayload;

            if (!uuid) return fail(ERRORS.FORBIDDEN);

            const passkey = await this.passkeyRepository.findByUUID(dto.id);

            if (!passkey) return fail(ERRORS.PASSKEY_NOT_FOUND);

            await this.passkeyRepository.update({
                id: passkey.id,
                passkeyProvider: dto.name,
            });

            return await this.getActivePasskeys(jwtPayload);
        } catch (error) {
            this.logger.error(`Update passkey error: ${error}`);
            return fail(ERRORS.UPDATE_PASSKEY_ERROR);
        }
    }
}
