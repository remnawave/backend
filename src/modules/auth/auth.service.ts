import {
    AuthenticationResponseJSON,
    type PublicKeyCredentialRequestOptionsJSON,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { TelegramOAuth2 } from '@exact-team/telegram-oauth2';
import { catchError, firstValueFrom } from 'rxjs';
import { promisify } from 'node:util';
import { Cache } from 'cache-manager';
import { AxiosError } from 'axios';
import * as arctic from 'arctic';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';

import { fail, ok, TResult } from '@common/types';
import {
    CACHE_KEYS,
    EVENTS,
    OAUTH2_PROVIDERS,
    ROLE,
    TOAuth2ProvidersKeys,
} from '@libs/contracts/constants';
import { ERRORS } from '@libs/contracts/constants/errors';
import { AUTH_ROUTES } from '@libs/contracts/api';

import { ServiceEvent } from '@integration-modules/notifications/interfaces';

import { GetCachedRemnawaveSettingsQuery } from '@modules/remnawave-settings/queries/get-cached-remnawave-settings';
import { FindPasskeyByIdAndAdminUuidQuery } from '@modules/admin/queries/find-passkey-by-id-and-uuid';
import { GetPasskeysByAdminUuidQuery } from '@modules/admin/queries/get-passkeys-by-admin-uuid';
import { GetAdminByUsernameQuery } from '@modules/admin/queries/get-admin-by-username';
import { CountAdminsByRoleQuery } from '@modules/admin/queries/count-admins-by-role';
import { RemnawaveSettingsEntity } from '@modules/remnawave-settings/entities';
import { UpdatePasskeyCommand } from '@modules/admin/commands/update-passkey';
import { GetFirstAdminQuery } from '@modules/admin/queries/get-first-admin';
import { CreateAdminCommand } from '@modules/admin/commands/create-admin';
import { AdminEntity } from '@modules/admin/entities/admin.entity';

import { TelegramCallbackRequestDto, VerifyPasskeyAuthenticationRequestDto } from './dtos';
import { OAuth2AuthorizeResponseModel } from './model/oauth2-authorize.response.model';
import { OAuth2CallbackResponseModel } from './model/oauth2-callback.response.model';
import { GetStatusResponseModel } from './model/get-status.response.model';
import { ILogin, IRegister } from './interfaces';

const scryptAsync = promisify(scrypt);
const REMNAWAVE_CUSTOM_CLAIM_KEY = 'remnawaveAccess';
const OAUTH2_SCOPES = ['email', 'profile', 'openid'];

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly jwtSecret: string;
    private readonly jwtLifetime: number;

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
        private readonly eventEmitter: EventEmitter2,
        private readonly httpService: HttpService,
    ) {
        this.jwtSecret = this.configService.getOrThrow<string>('JWT_AUTH_SECRET');
        this.jwtLifetime = this.configService.getOrThrow<number>('JWT_AUTH_LIFETIME');
    }

    public async login(
        dto: ILogin,
        ip: string,
        userAgent: string,
    ): Promise<
        TResult<{
            accessToken: string;
        }>
    > {
        try {
            const { username, password } = dto;

            const statusResponse = await this.getStatus();

            if (!statusResponse.isOk) {
                return fail(ERRORS.GET_AUTH_STATUS_ERROR);
            }

            if (!statusResponse.response.isLoginAllowed) {
                await this.emitFailedLoginAttempt(
                    username,
                    password,
                    ip,
                    userAgent,
                    'Login is not allowed.',
                );
                return fail(ERRORS.FORBIDDEN);
            }

            if (!statusResponse.response.authentication) {
                return fail(ERRORS.FORBIDDEN);
            }

            if (!statusResponse.response.authentication.password.enabled) {
                await this.emitFailedLoginAttempt(
                    username,
                    password,
                    ip,
                    userAgent,
                    'Someone tried to login with password authentication, but it is disabled.',
                );
                return fail(ERRORS.FORBIDDEN);
            }

            const admin = await this.getAdminByUsername({
                username,
                role: ROLE.ADMIN,
            });

            if (!admin.isOk) {
                await this.emitFailedLoginAttempt(
                    username,
                    password,
                    ip,
                    userAgent,
                    'Admin is not found in database.',
                );
                return fail(ERRORS.FORBIDDEN);
            }

            const isPasswordValid = await this.verifyPassword(
                password,
                admin.response.passwordHash,
            );

            if (!isPasswordValid) {
                await this.emitFailedLoginAttempt(
                    username,
                    password,
                    ip,
                    userAgent,
                    'Invalid password.',
                );
                return fail(ERRORS.FORBIDDEN);
            }

            const accessToken = this.jwtService.sign(
                {
                    username,
                    uuid: admin.response.uuid,
                    role: ROLE.ADMIN,
                },
                { expiresIn: `${this.jwtLifetime}h` },
            );

            await this.emitLoginSuccess(username, ip, userAgent);

            return ok({ accessToken });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.LOGIN_ERROR);
        }
    }

    public async register(dto: IRegister): Promise<
        TResult<{
            accessToken: string;
        }>
    > {
        try {
            const { username, password } = dto;

            const statusResponse = await this.getStatus();

            if (!statusResponse.isOk) {
                return fail(ERRORS.GET_AUTH_STATUS_ERROR);
            }

            if (!statusResponse.response.isRegisterAllowed) {
                return fail(ERRORS.FORBIDDEN);
            }

            const admin = await this.getAdminByUsername({
                username,
                role: ROLE.ADMIN,
            });

            if (admin.isOk) {
                return fail(ERRORS.FORBIDDEN);
            }

            const hashedPassword = await this.hashPassword(password);

            const createAdminResponse = await this.createAdmin({
                username,
                password: hashedPassword,
                role: ROLE.ADMIN,
            });

            if (!createAdminResponse.isOk) {
                return fail(ERRORS.CREATE_ADMIN_ERROR);
            }

            const accessToken = this.jwtService.sign(
                {
                    username,
                    uuid: createAdminResponse.response.uuid,
                    role: ROLE.ADMIN,
                },
                { expiresIn: `${this.jwtLifetime}h` },
            );

            return ok({ accessToken });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.LOGIN_ERROR);
        }
    }

    public async getStatus(): Promise<TResult<GetStatusResponseModel>> {
        try {
            const remnawaveSettings = await this.queryBus.execute(
                new GetCachedRemnawaveSettingsQuery(),
            );

            const adminCount = await this.getAdminCount();

            if (!adminCount.isOk) {
                return fail(ERRORS.GET_AUTH_STATUS_ERROR);
            }

            if (adminCount.response === undefined) {
                return fail(ERRORS.GET_AUTH_STATUS_ERROR);
            }

            if (adminCount.response === 0) {
                return ok(
                    new GetStatusResponseModel({
                        isLoginAllowed: false,
                        isRegisterAllowed: true,
                        authentication: null,
                        branding: remnawaveSettings.brandingSettings,
                    }),
                );
            }

            return ok(
                new GetStatusResponseModel({
                    isLoginAllowed: true,
                    isRegisterAllowed: false,
                    authentication: {
                        passkey: {
                            enabled: remnawaveSettings.passkeySettings.enabled,
                        },
                        tgAuth: {
                            enabled: remnawaveSettings.tgAuthSettings.enabled,
                            botId: remnawaveSettings.tgAuthSettings.botToken
                                ? Number(remnawaveSettings.tgAuthSettings.botToken.split(':')[0])
                                : null,
                        },
                        oauth2: {
                            providers: {
                                [OAUTH2_PROVIDERS.GITHUB]:
                                    remnawaveSettings.oauth2Settings.github.enabled,
                                [OAUTH2_PROVIDERS.POCKETID]:
                                    remnawaveSettings.oauth2Settings.pocketid.enabled,
                                [OAUTH2_PROVIDERS.YANDEX]:
                                    remnawaveSettings.oauth2Settings.yandex.enabled,
                                [OAUTH2_PROVIDERS.KEYCLOAK]:
                                    remnawaveSettings.oauth2Settings.keycloak.enabled,
                                [OAUTH2_PROVIDERS.GENERIC]:
                                    remnawaveSettings.oauth2Settings.generic.enabled,
                            },
                        },
                        password: {
                            enabled: remnawaveSettings.passwordSettings.enabled,
                        },
                    },
                    branding: remnawaveSettings.brandingSettings,
                }),
            );
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_AUTH_STATUS_ERROR);
        }
    }

    public async telegramCallback(
        dto: TelegramCallbackRequestDto,
        ip: string,
        userAgent: string,
    ): Promise<
        TResult<{
            accessToken: string;
        }>
    > {
        try {
            const { id, username, first_name } = dto;

            const statusResponse = await this.getStatus();

            if (!statusResponse.isOk) {
                return fail(ERRORS.GET_AUTH_STATUS_ERROR);
            }

            if (!statusResponse.response.isLoginAllowed) {
                await this.emitFailedLoginAttempt(
                    username ? `@${username}` : first_name,
                    `Telegram ID: ${id}`,
                    ip,
                    userAgent,
                    'Login is not allowed.',
                );
                return fail(ERRORS.FORBIDDEN);
            }

            const remnawaveSettings = await this.queryBus.execute(
                new GetCachedRemnawaveSettingsQuery(),
            );

            if (!remnawaveSettings.tgAuthSettings.enabled) {
                await this.emitFailedLoginAttempt(
                    username ? `@${username}` : first_name,
                    `Telegram ID: ${id}`,
                    ip,
                    userAgent,
                    'Telegram authentication is not enabled.',
                );
                return fail(ERRORS.FORBIDDEN);
            }

            if (!remnawaveSettings.tgAuthSettings.adminIds.includes(id.toString())) {
                await this.emitFailedLoginAttempt(
                    username ? `@${username}` : first_name,
                    `Telegram ID: ${id}`,
                    ip,
                    userAgent,
                    'UserID is not in the allowed list.',
                );
                return fail(ERRORS.FORBIDDEN);
            }

            const isHashValid = new TelegramOAuth2({
                botToken: remnawaveSettings.tgAuthSettings.botToken!,
                validUntil: 15,
            }).handleTelegramOAuthCallback({
                auth_date: dto.auth_date,
                first_name: dto.first_name,
                hash: dto.hash,
                id: id,
                last_name: dto.last_name,
                username: dto.username,
                photo_url: dto.photo_url,
            });

            if (!isHashValid.isSuccess) {
                await this.emitFailedLoginAttempt(
                    username ? `@${username}` : first_name,
                    `Telegram ID: ${id}`,
                    ip,
                    userAgent,
                );
                return fail(ERRORS.FORBIDDEN);
            }

            const firstAdmin = await this.getFirstAdmin();

            if (!firstAdmin.isOk) {
                await this.emitFailedLoginAttempt(
                    username ? `@${username}` : first_name,
                    `Telegram ID: ${id}`,
                    ip,
                    userAgent,
                    'Superadmin is not found.',
                );
                return fail(ERRORS.FORBIDDEN);
            }

            const accessToken = this.jwtService.sign(
                {
                    username: firstAdmin.response.username,
                    uuid: firstAdmin.response.uuid,
                    role: ROLE.ADMIN,
                },
                { expiresIn: `${this.jwtLifetime}h` },
            );

            await this.emitLoginSuccess(
                `${username ? `@${username}` : first_name}, ID: ${id}`,
                ip,
                userAgent,
                'Logged via Telegram OAuth.',
            );

            return ok({ accessToken });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.LOGIN_ERROR);
        }
    }

    public async oauth2Authorize(
        provider: TOAuth2ProvidersKeys,
    ): Promise<TResult<OAuth2AuthorizeResponseModel>> {
        try {
            const statusResponse = await this.getStatus();

            if (!statusResponse.isOk) {
                return fail(ERRORS.GET_AUTH_STATUS_ERROR);
            }

            if (!statusResponse.response.isLoginAllowed) {
                return fail(ERRORS.FORBIDDEN);
            }

            if (!statusResponse.response.authentication) {
                return fail(ERRORS.FORBIDDEN);
            }

            if (!statusResponse.response.authentication?.oauth2.providers[provider]) {
                return fail(ERRORS.FORBIDDEN);
            }

            const remnawaveSettings = await this.queryBus.execute(
                new GetCachedRemnawaveSettingsQuery(),
            );

            let authorizationURL: URL;
            const state = arctic.generateState();
            let stateKey: string;

            switch (provider) {
                case OAUTH2_PROVIDERS.GITHUB:
                    const ghClient = new arctic.GitHub(
                        remnawaveSettings.oauth2Settings.github.clientId!,
                        remnawaveSettings.oauth2Settings.github.clientSecret!,
                        null,
                    );

                    authorizationURL = ghClient.createAuthorizationURL(state, ['user:email']);
                    stateKey = `oauth2:${OAUTH2_PROVIDERS.GITHUB}`;
                    break;
                case OAUTH2_PROVIDERS.POCKETID:
                    const pocketIdClient = new arctic.OAuth2Client(
                        remnawaveSettings.oauth2Settings.pocketid.clientId!,
                        remnawaveSettings.oauth2Settings.pocketid.clientSecret!,
                        null,
                    );
                    authorizationURL = pocketIdClient.createAuthorizationURL(
                        `https://${remnawaveSettings.oauth2Settings.pocketid.plainDomain}/authorize`,
                        state,
                        OAUTH2_SCOPES,
                    );
                    stateKey = `oauth2:${OAUTH2_PROVIDERS.POCKETID}`;
                    break;
                case OAUTH2_PROVIDERS.YANDEX:
                    const yandexClient = new arctic.Yandex(
                        remnawaveSettings.oauth2Settings.yandex.clientId!,
                        remnawaveSettings.oauth2Settings.yandex.clientSecret!,
                        '',
                    );
                    authorizationURL = yandexClient.createAuthorizationURL(state, ['login:email']);
                    stateKey = `oauth2:${OAUTH2_PROVIDERS.YANDEX}`;
                    break;
                case OAUTH2_PROVIDERS.KEYCLOAK:
                    const codeVerifier = arctic.generateCodeVerifier();

                    const keycloakClient = new arctic.KeyCloak(
                        `https://${remnawaveSettings.oauth2Settings.keycloak.keycloakDomain!}/realms/${remnawaveSettings.oauth2Settings.keycloak.realm!}`,
                        remnawaveSettings.oauth2Settings.keycloak.clientId!,
                        remnawaveSettings.oauth2Settings.keycloak.clientSecret!,
                        `https://${remnawaveSettings.oauth2Settings.keycloak.frontendDomain!}/${AUTH_ROUTES.OAUTH2.CALLBACK}/${OAUTH2_PROVIDERS.KEYCLOAK}`,
                    );
                    authorizationURL = keycloakClient.createAuthorizationURL(
                        state,
                        codeVerifier,
                        OAUTH2_SCOPES,
                    );

                    stateKey = `oauth2:${OAUTH2_PROVIDERS.KEYCLOAK}`;
                    await this.cacheManager.set(`${stateKey}:codeVerifier`, codeVerifier, 600_000);

                    break;
                case OAUTH2_PROVIDERS.GENERIC:
                    const authorizationEndpoint =
                        remnawaveSettings.oauth2Settings.generic.authorizationUrl!;
                    const genericOAuth2Client = new arctic.OAuth2Client(
                        remnawaveSettings.oauth2Settings.generic.clientId!,
                        remnawaveSettings.oauth2Settings.generic.clientSecret!,
                        `http://${remnawaveSettings.oauth2Settings.generic.frontendDomain!}/${AUTH_ROUTES.OAUTH2.CALLBACK}/${OAUTH2_PROVIDERS.GENERIC}`,
                    );

                    switch (remnawaveSettings.oauth2Settings.generic.withPkce) {
                        case false:
                            authorizationURL = genericOAuth2Client.createAuthorizationURL(
                                authorizationEndpoint,
                                state,
                                OAUTH2_SCOPES,
                            );
                            stateKey = `oauth2:${OAUTH2_PROVIDERS.GENERIC}`;
                            break;
                        case true:
                            const codeVerifier = arctic.generateCodeVerifier();

                            authorizationURL = genericOAuth2Client.createAuthorizationURLWithPKCE(
                                authorizationEndpoint,
                                state,
                                arctic.CodeChallengeMethod.S256,
                                codeVerifier,
                                OAUTH2_SCOPES,
                            );
                            stateKey = `oauth2:${OAUTH2_PROVIDERS.GENERIC}`;

                            await this.cacheManager.set(
                                `${stateKey}:codeVerifier`,
                                codeVerifier,
                                600_000,
                            );
                            break;
                    }
                    break;
                default:
                    return fail(ERRORS.OAUTH2_PROVIDER_NOT_FOUND);
            }

            await this.cacheManager.set(stateKey, state, 600_000);

            return ok(
                new OAuth2AuthorizeResponseModel({
                    authorizationUrl: authorizationURL.toString(),
                }),
            );
        } catch (error) {
            this.logger.error('GitHub authorization error:', error);
            return fail(ERRORS.OAUTH2_AUTHORIZE_ERROR);
        }
    }

    public async oauth2Callback(
        code: string,
        state: string,
        provider: TOAuth2ProvidersKeys,
        ip: string,
        userAgent: string,
    ): Promise<TResult<OAuth2CallbackResponseModel>> {
        try {
            const statusResponse = await this.getStatus();
            if (!statusResponse.isOk) {
                return fail(ERRORS.GET_AUTH_STATUS_ERROR);
            }

            if (!statusResponse.response.isLoginAllowed) {
                await this.emitFailedLoginAttempt(
                    'Unknown',
                    `OAuth2 code: ${code}`,
                    ip,
                    userAgent,
                    'Login is not allowed.',
                );

                return fail(ERRORS.FORBIDDEN);
            }

            if (!statusResponse.response.authentication) {
                return fail(ERRORS.FORBIDDEN);
            }

            if (!statusResponse.response.authentication.oauth2.providers[provider]) {
                await this.emitFailedLoginAttempt(
                    'Unknown',
                    `OAuth2 provider: ${provider}`,
                    '–',
                    '–',
                    'Someone tried to authorize with OAuth2, but the provider is disabled.',
                );

                return fail(ERRORS.FORBIDDEN);
            }

            const firstAdmin = await this.getFirstAdmin();
            if (!firstAdmin.isOk) {
                await this.emitFailedLoginAttempt(
                    'Unknown',
                    '–',
                    ip,
                    userAgent,
                    'Superadmin is not found.',
                );
                return fail(ERRORS.FORBIDDEN);
            }

            let callbackResult: {
                isAllowed: boolean;
                email: string | null;
            } = {
                isAllowed: false,
                email: null,
            };

            switch (provider) {
                case OAUTH2_PROVIDERS.GITHUB:
                    callbackResult = await this.githubCallback(code, state, ip, userAgent);
                    break;
                case OAUTH2_PROVIDERS.POCKETID:
                    callbackResult = await this.pocketIdCallback(code, state, ip, userAgent);
                    break;
                case OAUTH2_PROVIDERS.YANDEX:
                    callbackResult = await this.yandexCallback(code, state, ip, userAgent);
                    break;
                case OAUTH2_PROVIDERS.KEYCLOAK:
                    callbackResult = await this.keycloakCallback(code, state, ip, userAgent);
                    break;
                case OAUTH2_PROVIDERS.GENERIC:
                    callbackResult = await this.genericOAuth2Callback(code, state, ip, userAgent);
                    break;
                default:
                    return fail(ERRORS.FORBIDDEN);
            }

            if (!callbackResult.isAllowed || !callbackResult.email) {
                return fail(ERRORS.FORBIDDEN);
            }

            const jwtToken = this.jwtService.sign(
                {
                    username: firstAdmin.response.username,
                    uuid: firstAdmin.response.uuid,
                    role: ROLE.ADMIN,
                },
                { expiresIn: `${this.jwtLifetime}h` },
            );

            await this.emitLoginSuccess(
                callbackResult.email!,
                ip,
                userAgent,
                `Logged via ${provider} OAuth2.`,
            );

            return ok(
                new OAuth2CallbackResponseModel({
                    accessToken: jwtToken,
                }),
            );
        } catch (error) {
            this.logger.error('GitHub callback error:', error);
            return fail(ERRORS.LOGIN_ERROR);
        }
    }

    private async githubCallback(
        code: string,
        state: string,
        ip: string,
        userAgent: string,
    ): Promise<{
        isAllowed: boolean;
        email: string | null;
    }> {
        try {
            const stateFromCache = await this.cacheManager.get<string>(
                `oauth2:${OAUTH2_PROVIDERS.GITHUB}`,
            );

            await this.cacheManager.del(`oauth2:${OAUTH2_PROVIDERS.GITHUB}`);

            if (stateFromCache !== state) {
                this.logger.error('OAuth2 state mismatch');
                await this.emitFailedLoginAttempt(
                    'Unknown',
                    `State: ${state}`,
                    ip,
                    userAgent,
                    'GitHub OAuth2 state mismatch.',
                );
                return {
                    isAllowed: false,
                    email: null,
                };
            }

            const remnawaveSettings = await this.queryBus.execute(
                new GetCachedRemnawaveSettingsQuery(),
            );

            const githubClient = new arctic.GitHub(
                remnawaveSettings.oauth2Settings.github.clientId!,
                remnawaveSettings.oauth2Settings.github.clientSecret!,
                null,
            );

            const tokens = await githubClient.validateAuthorizationCode(code);
            const accessToken = tokens.accessToken();

            const { data } = await firstValueFrom(
                this.httpService
                    .get<
                        {
                            email: string;
                            primary: boolean;
                            verified: boolean;
                            visibility: string | null;
                        }[]
                    >('https://api.github.com/user/emails', {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'User-Agent': 'Remnawave',
                        },
                    })
                    .pipe(
                        catchError((error: AxiosError) => {
                            throw error.response?.data;
                        }),
                    ),
            );

            if (!data) {
                this.logger.error('Failed to fetch GitHub user emails');
                return {
                    isAllowed: false,
                    email: null,
                };
            }

            const primaryEmail = data.find((email) => email.primary)?.email;

            if (!primaryEmail) {
                await this.emitFailedLoginAttempt(
                    'Unknown',
                    '–',
                    ip,
                    userAgent,
                    'No primary email found for GitHub user.',
                );
                this.logger.error('No primary email found for GitHub user');
                return {
                    isAllowed: false,
                    email: null,
                };
            }

            if (!remnawaveSettings.oauth2Settings.github.allowedEmails.includes(primaryEmail)) {
                await this.emitFailedLoginAttempt(
                    primaryEmail,
                    '–',
                    ip,
                    userAgent,
                    'GitHub email is not in the allowed list.',
                );
                return {
                    isAllowed: false,
                    email: null,
                };
            }

            return {
                isAllowed: true,
                email: primaryEmail,
            };
        } catch (error) {
            this.logger.error(`GitHub callback error: ${error}`);

            return {
                isAllowed: false,
                email: null,
            };
        }
    }

    private async pocketIdCallback(
        code: string,
        state: string,
        ip: string,
        userAgent: string,
    ): Promise<{
        isAllowed: boolean;
        email: string | null;
    }> {
        try {
            const stateFromCache = await this.cacheManager.get<string | undefined>(
                `oauth2:${OAUTH2_PROVIDERS.POCKETID}`,
            );

            await this.cacheManager.del(`oauth2:${OAUTH2_PROVIDERS.POCKETID}`);

            if (stateFromCache !== state) {
                this.logger.error('OAuth2 state mismatch');
                await this.emitFailedLoginAttempt(
                    'Unknown',
                    `State: ${state}`,
                    ip,
                    userAgent,
                    'PocketID OAuth2 state mismatch.',
                );
                return { isAllowed: false, email: null };
            }

            const remnawaveSettings = await this.queryBus.execute(
                new GetCachedRemnawaveSettingsQuery(),
            );

            const pocketIdClient = new arctic.OAuth2Client(
                remnawaveSettings.oauth2Settings.pocketid.clientId!,
                remnawaveSettings.oauth2Settings.pocketid.clientSecret!,
                null,
            );

            const tokens = await pocketIdClient.validateAuthorizationCode(
                `https://${remnawaveSettings.oauth2Settings.pocketid.plainDomain}/api/oidc/token`,
                code,
                null,
            );

            const claims = arctic.decodeIdToken(tokens.idToken());

            const email = 'email' in claims ? claims.email : undefined;
            if (typeof email !== 'string' || !email) {
                await this.emitFailedLoginAttempt(
                    'Missing',
                    '–',
                    ip,
                    userAgent,
                    'Invalid or missing email claim in PocketID ID token.',
                );
                return { isAllowed: false, email: null };
            }

            if (
                REMNAWAVE_CUSTOM_CLAIM_KEY in claims &&
                claims[REMNAWAVE_CUSTOM_CLAIM_KEY] === true
            ) {
                return { isAllowed: true, email };
            }

            if (remnawaveSettings.oauth2Settings.pocketid.allowedEmails.includes(email)) {
                return { isAllowed: true, email };
            }

            await this.emitFailedLoginAttempt(
                email,
                '–',
                ip,
                userAgent,
                'PocketID email is not in the allowed list and remnawaveAccess claim is not present.',
            );

            return { isAllowed: false, email: null };
        } catch (error) {
            this.logger.error(`PocketID callback error: ${error}`);
            return { isAllowed: false, email: null };
        }
    }

    private async yandexCallback(
        code: string,
        state: string,
        ip: string,
        userAgent: string,
    ): Promise<{
        isAllowed: boolean;
        email: string | null;
    }> {
        try {
            const stateFromCache = await this.cacheManager.get<string>(
                `oauth2:${OAUTH2_PROVIDERS.YANDEX}`,
            );

            await this.cacheManager.del(`oauth2:${OAUTH2_PROVIDERS.YANDEX}`);

            if (stateFromCache !== state) {
                this.logger.error('OAuth2 state mismatch');
                await this.emitFailedLoginAttempt(
                    'Unknown',
                    `State: ${state}`,
                    ip,
                    userAgent,
                    'Yandex OAuth2 state mismatch.',
                );
                return {
                    isAllowed: false,
                    email: null,
                };
            }

            const remnawaveSettings = await this.queryBus.execute(
                new GetCachedRemnawaveSettingsQuery(),
            );

            const yandexClient = new arctic.Yandex(
                remnawaveSettings.oauth2Settings.yandex.clientId!,
                remnawaveSettings.oauth2Settings.yandex.clientSecret!,
                '',
            );

            const tokens = await yandexClient.validateAuthorizationCode(code);
            const accessToken = tokens.accessToken();

            const { data } = await firstValueFrom(
                this.httpService
                    .get<{
                        default_email: string;
                    }>('https://login.yandex.ru/info?format=json', {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'User-Agent': 'Remnawave',
                        },
                    })
                    .pipe(
                        catchError((error: AxiosError) => {
                            throw error.response?.data;
                        }),
                    ),
            );

            if (!data) {
                this.logger.error('Failed to fetch Yandex user info');
                return {
                    isAllowed: false,
                    email: null,
                };
            }

            const primaryEmail = data.default_email;

            if (!primaryEmail) {
                await this.emitFailedLoginAttempt(
                    'Unknown',
                    '–',
                    ip,
                    userAgent,
                    'No primary email found for Yandex user.',
                );
                this.logger.error('No primary email found for Yandex user');
                return {
                    isAllowed: false,
                    email: null,
                };
            }

            if (!remnawaveSettings.oauth2Settings.yandex.allowedEmails.includes(primaryEmail)) {
                await this.emitFailedLoginAttempt(
                    primaryEmail,
                    '–',
                    ip,
                    userAgent,
                    'Yandex email is not in the allowed list.',
                );
                return {
                    isAllowed: false,
                    email: null,
                };
            }

            return {
                isAllowed: true,
                email: primaryEmail,
            };
        } catch (error) {
            this.logger.error(`Yandex callback error: ${error}`);

            return {
                isAllowed: false,
                email: null,
            };
        }
    }

    private async keycloakCallback(
        code: string,
        state: string,
        ip: string,
        userAgent: string,
    ): Promise<{
        isAllowed: boolean;
        email: string | null;
    }> {
        try {
            const stateFromCache = await this.cacheManager.get<string | undefined>(
                `oauth2:${OAUTH2_PROVIDERS.KEYCLOAK}`,
            );
            const codeVerifier = await this.cacheManager.get<string | undefined>(
                `oauth2:${OAUTH2_PROVIDERS.KEYCLOAK}:codeVerifier`,
            );

            await this.cacheManager.del(`oauth2:${OAUTH2_PROVIDERS.KEYCLOAK}`);
            await this.cacheManager.del(`oauth2:${OAUTH2_PROVIDERS.KEYCLOAK}:codeVerifier`);

            if (stateFromCache !== state || codeVerifier === undefined) {
                this.logger.error('OAuth2 state mismatch');
                await this.emitFailedLoginAttempt(
                    'Unknown',
                    `State: ${state}`,
                    ip,
                    userAgent,
                    'Keycloak OAuth2 state or code verifier mismatch.',
                );
                return { isAllowed: false, email: null };
            }

            const remnawaveSettings = await this.queryBus.execute(
                new GetCachedRemnawaveSettingsQuery(),
            );

            const keycloakClient = new arctic.KeyCloak(
                `https://${remnawaveSettings.oauth2Settings.keycloak.keycloakDomain!}/realms/${remnawaveSettings.oauth2Settings.keycloak.realm!}`,
                remnawaveSettings.oauth2Settings.keycloak.clientId!,
                remnawaveSettings.oauth2Settings.keycloak.clientSecret!,
                `https://${remnawaveSettings.oauth2Settings.keycloak.frontendDomain!}/${AUTH_ROUTES.OAUTH2.CALLBACK}/${OAUTH2_PROVIDERS.KEYCLOAK}`,
            );

            const tokens = await keycloakClient.validateAuthorizationCode(code, codeVerifier);

            const claims = arctic.decodeIdToken(tokens.idToken());

            const email = 'email' in claims ? claims.email : undefined;
            if (typeof email !== 'string' || !email) {
                await this.emitFailedLoginAttempt(
                    'Missing',
                    '–',
                    ip,
                    userAgent,
                    'Invalid or missing email claim in Keycloak ID token.',
                );
                return { isAllowed: false, email: null };
            }

            if (
                REMNAWAVE_CUSTOM_CLAIM_KEY in claims &&
                claims[REMNAWAVE_CUSTOM_CLAIM_KEY] === true
            ) {
                return { isAllowed: true, email };
            }

            if (remnawaveSettings.oauth2Settings.keycloak.allowedEmails.includes(email)) {
                return { isAllowed: true, email };
            }

            await this.emitFailedLoginAttempt(
                email,
                '–',
                ip,
                userAgent,
                'Keycloak email is not in the allowed list and remnawaveAccess claim is not present.',
            );

            return { isAllowed: false, email: null };
        } catch (error) {
            this.logger.error(`Keycloak callback error: ${error}`);
            return { isAllowed: false, email: null };
        }
    }

    private async genericOAuth2Callback(
        code: string,
        state: string,
        ip: string,
        userAgent: string,
    ): Promise<{
        isAllowed: boolean;
        email: string | null;
    }> {
        try {
            const stateFromCache = await this.cacheManager.get<string | undefined>(
                `oauth2:${OAUTH2_PROVIDERS.GENERIC}`,
            );
            const codeVerifier = await this.cacheManager.get<string | undefined>(
                `oauth2:${OAUTH2_PROVIDERS.GENERIC}:codeVerifier`,
            );

            await this.cacheManager.del(`oauth2:${OAUTH2_PROVIDERS.GENERIC}`);
            await this.cacheManager.del(`oauth2:${OAUTH2_PROVIDERS.GENERIC}:codeVerifier`);

            if (stateFromCache !== state) {
                this.logger.error('OAuth2 state mismatch');
                await this.emitFailedLoginAttempt(
                    'Unknown',
                    `State: ${state}`,
                    ip,
                    userAgent,
                    'Generic OAuth2 state mismatch.',
                );
                return { isAllowed: false, email: null };
            }

            const remnawaveSettings = await this.queryBus.execute(
                new GetCachedRemnawaveSettingsQuery(),
            );

            const genericOAuth2Client = new arctic.OAuth2Client(
                remnawaveSettings.oauth2Settings.generic.clientId!,
                remnawaveSettings.oauth2Settings.generic.clientSecret!,
                `http://${remnawaveSettings.oauth2Settings.generic.frontendDomain!}/${AUTH_ROUTES.OAUTH2.CALLBACK}/${OAUTH2_PROVIDERS.GENERIC}`,
            );

            if (remnawaveSettings.oauth2Settings.generic.withPkce && codeVerifier === undefined) {
                this.logger.error('Code verifier not found');
                await this.emitFailedLoginAttempt(
                    'Unknown',
                    '–',
                    ip,
                    userAgent,
                    'Generic OAuth2 code verifier not found.',
                );
                return { isAllowed: false, email: null };
            }

            const tokens = await genericOAuth2Client.validateAuthorizationCode(
                remnawaveSettings.oauth2Settings.generic.tokenUrl!,
                code,
                codeVerifier ?? null,
            );

            const claims = arctic.decodeIdToken(tokens.idToken());

            const email = 'email' in claims ? claims.email : undefined;
            if (typeof email !== 'string' || !email) {
                await this.emitFailedLoginAttempt(
                    'Missing',
                    '–',
                    ip,
                    userAgent,
                    'Invalid or missing email claim in Generic OAuth2 ID token.',
                );
                return { isAllowed: false, email: null };
            }

            if (
                REMNAWAVE_CUSTOM_CLAIM_KEY in claims &&
                claims[REMNAWAVE_CUSTOM_CLAIM_KEY] === true
            ) {
                return { isAllowed: true, email };
            }

            if (remnawaveSettings.oauth2Settings.generic.allowedEmails.includes(email)) {
                return { isAllowed: true, email };
            }

            await this.emitFailedLoginAttempt(
                email,
                '–',
                ip,
                userAgent,
                'Generic OAuth2 email is not in the allowed list and remnawaveAccess claim is not present.',
            );

            return { isAllowed: false, email: null };
        } catch (error) {
            this.logger.error(`Generic OAuth2 callback error: ${error}`);
            return { isAllowed: false, email: null };
        }
    }

    private async getAdminCount(): Promise<TResult<number>> {
        return this.queryBus.execute<CountAdminsByRoleQuery, TResult<number>>(
            new CountAdminsByRoleQuery(ROLE.ADMIN),
        );
    }

    private async getAdminByUsername(dto: GetAdminByUsernameQuery): Promise<TResult<AdminEntity>> {
        return this.queryBus.execute<GetAdminByUsernameQuery, TResult<AdminEntity>>(
            new GetAdminByUsernameQuery(dto.username, dto.role),
        );
    }

    private async getFirstAdmin(): Promise<TResult<AdminEntity>> {
        return this.queryBus.execute<GetFirstAdminQuery, TResult<AdminEntity>>(
            new GetFirstAdminQuery(ROLE.ADMIN),
        );
    }

    private applySecretHmac(password: string, secret: string): Buffer {
        const hmac = createHmac('sha256', secret);
        hmac.update(password);
        return hmac.digest();
    }

    private async hashPassword(plainPassword: string): Promise<string> {
        const hmacResult = this.applySecretHmac(plainPassword, this.jwtSecret);

        const salt = randomBytes(16).toString('hex');

        const derivedKey = (await scryptAsync(hmacResult.toString('hex'), salt, 64)) as Buffer;
        const hash = derivedKey.toString('hex');

        return `${salt}:${hash}`;
    }

    private async verifyPassword(plainPassword: string, storedHash: string): Promise<boolean> {
        const hmacResult = this.applySecretHmac(plainPassword, this.jwtSecret);

        const [salt, hash] = storedHash.split(':');

        const derivedKey = (await scryptAsync(hmacResult.toString('hex'), salt, 64)) as Buffer;
        const calculatedHash = derivedKey.toString('hex');

        return timingSafeEqual(Buffer.from(calculatedHash), Buffer.from(hash));
    }

    private async createAdmin(dto: CreateAdminCommand): Promise<TResult<AdminEntity>> {
        return this.commandBus.execute<CreateAdminCommand, TResult<AdminEntity>>(
            new CreateAdminCommand(dto.username, dto.password, dto.role),
        );
    }

    private async emitFailedLoginAttempt(
        username: string,
        password: string,
        ip: string,
        userAgent: string,
        description?: string,
    ): Promise<void> {
        this.eventEmitter.emit(
            EVENTS.SERVICE.LOGIN_ATTEMPT_FAILED,
            new ServiceEvent(EVENTS.SERVICE.LOGIN_ATTEMPT_FAILED, {
                loginAttempt: {
                    username,
                    password,
                    ip,
                    userAgent,
                    description: description ?? '–',
                },
            }),
        );
    }

    private async emitLoginSuccess(
        username: string,
        ip: string,
        userAgent: string,
        description?: string,
    ): Promise<void> {
        this.eventEmitter.emit(
            EVENTS.SERVICE.LOGIN_ATTEMPT_SUCCESS,
            new ServiceEvent(EVENTS.SERVICE.LOGIN_ATTEMPT_SUCCESS, {
                loginAttempt: {
                    username,
                    ip,
                    userAgent,
                    description: description ?? '–',
                },
            }),
        );
    }

    public async generatePasskeyAuthenticationOptions(
        remnawaveSettings: RemnawaveSettingsEntity,
    ): Promise<TResult<PublicKeyCredentialRequestOptionsJSON>> {
        try {
            if (!remnawaveSettings.passkeySettings.enabled) {
                return fail(ERRORS.FORBIDDEN);
            }

            if (
                !remnawaveSettings.passkeySettings.rpId ||
                !remnawaveSettings.passkeySettings.origin
            ) {
                return fail(ERRORS.FORBIDDEN);
            }

            const admin = await this.getFirstAdmin();

            if (!admin.isOk) {
                return fail(ERRORS.FORBIDDEN);
            }

            const userPasskeys = await this.queryBus.execute(
                new GetPasskeysByAdminUuidQuery(admin.response.uuid),
            );

            if (!userPasskeys.isOk) {
                return fail(ERRORS.FORBIDDEN);
            }

            if (userPasskeys.response.length === 0) {
                this.logger.warn('No passkeys registered for this user');
                return fail(ERRORS.FORBIDDEN);
            }

            const options = await generateAuthenticationOptions({
                rpID: remnawaveSettings.passkeySettings.rpId,
                allowCredentials: userPasskeys.response.map((passkey) => ({
                    id: passkey.id,
                    transports: passkey.getTransports(),
                })),
                userVerification: 'required',
            });

            await this.cacheManager.set(
                CACHE_KEYS.PASSKEY_AUTHENTICATION_OPTIONS(admin.response.uuid),
                options.challenge,
                60_000, // 1 minute
            );

            return ok(options);
        } catch (error) {
            this.logger.error(`Passkey authentication options error: ${error}`);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    public async verifyPasskeyAuthentication(
        dto: VerifyPasskeyAuthenticationRequestDto,
        remnawaveSettings: RemnawaveSettingsEntity,
        ip: string,
        userAgent: string,
    ): Promise<TResult<{ accessToken: string }>> {
        try {
            if (!remnawaveSettings.passkeySettings.enabled) {
                await this.emitFailedLoginAttempt(
                    'Unknown',
                    '–',
                    ip,
                    userAgent,
                    'Passkey authentication is not enabled.',
                );
                return fail(ERRORS.FORBIDDEN);
            }

            if (
                !remnawaveSettings.passkeySettings.rpId ||
                !remnawaveSettings.passkeySettings.origin
            ) {
                await this.emitFailedLoginAttempt(
                    'Unknown',
                    '–',
                    ip,
                    userAgent,
                    'Passkey authentication is not configured.',
                );
                return fail(ERRORS.FORBIDDEN);
            }

            const response = dto.response as unknown as AuthenticationResponseJSON;

            const admin = await this.getFirstAdmin();

            if (!admin.isOk) {
                await this.emitFailedLoginAttempt(
                    'Unknown',
                    '–',
                    ip,
                    userAgent,
                    'Admin is not found.',
                );
                return fail(ERRORS.FORBIDDEN);
            }

            const expectedChallenge = await this.cacheManager.get<string>(
                CACHE_KEYS.PASSKEY_AUTHENTICATION_OPTIONS(admin.response.uuid),
            );

            if (!expectedChallenge) {
                await this.emitFailedLoginAttempt(
                    'Unknown',
                    '–',
                    ip,
                    userAgent,
                    'Challenge not found.',
                );
                return fail(ERRORS.FORBIDDEN);
            }

            const passkey = await this.queryBus.execute(
                new FindPasskeyByIdAndAdminUuidQuery(response.id, admin.response.uuid),
            );

            if (!passkey.isOk) {
                await this.emitFailedLoginAttempt(
                    'Unknown',
                    '–',
                    ip,
                    userAgent,
                    'Passkey not found.',
                );
                return fail(ERRORS.FORBIDDEN);
            }

            const verification = await verifyAuthenticationResponse({
                response,
                expectedChallenge,
                expectedOrigin: remnawaveSettings.passkeySettings.origin,
                expectedRPID: remnawaveSettings.passkeySettings.rpId,
                credential: {
                    id: passkey.response.id,
                    publicKey: new Uint8Array(passkey.response.publicKey),
                    counter: Number(passkey.response.counter),
                    transports: passkey.response.getTransports(),
                },
                requireUserVerification: true,
            });

            await this.cacheManager.del(
                CACHE_KEYS.PASSKEY_AUTHENTICATION_OPTIONS(admin.response.uuid),
            );

            if (!verification.verified) {
                await this.emitFailedLoginAttempt(
                    'Unknown',
                    '–',
                    ip,
                    userAgent,
                    'Passkey authentication failed.',
                );
                return fail(ERRORS.FORBIDDEN);
            }

            await this.commandBus.execute(
                new UpdatePasskeyCommand(passkey.response.id, {
                    counter: BigInt(verification.authenticationInfo.newCounter),
                    updatedAt: new Date(),
                }),
            );

            const accessToken = this.jwtService.sign(
                {
                    username: admin.response.username,
                    uuid: admin.response.uuid,
                    role: ROLE.ADMIN,
                },
                { expiresIn: `${this.jwtLifetime}h` },
            );

            await this.emitLoginSuccess(
                admin.response.username,
                ip,
                userAgent,
                'Passkey authentication successful.',
            );

            return ok({ accessToken });
        } catch (error) {
            this.logger.error(`Passkey authentication verification error: ${error}`);
            return fail(ERRORS.FORBIDDEN);
        }
    }
}
