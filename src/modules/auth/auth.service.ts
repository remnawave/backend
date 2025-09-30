import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { TelegramOAuth2 } from '@exact-team/telegram-oauth2';
import { catchError, firstValueFrom } from 'rxjs';
import { promisify } from 'node:util';
import { Cache } from 'cache-manager';
import { AxiosError } from 'axios';
import * as arctic from 'arctic';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';

import { ICommandResponse } from '@common/types/command-response.type';
import { EVENTS, OAUTH2_PROVIDERS, ROLE, TOAuth2ProvidersKeys } from '@libs/contracts/constants';
import { ERRORS } from '@libs/contracts/constants/errors';

import { ServiceEvent } from '@integration-modules/notifications/interfaces';

import { GetAdminByUsernameQuery } from '@modules/admin/queries/get-admin-by-username';
import { CountAdminsByRoleQuery } from '@modules/admin/queries/count-admins-by-role';
import { GetFirstAdminQuery } from '@modules/admin/queries/get-first-admin';
import { CreateAdminCommand } from '@modules/admin/commands/create-admin';
import { AdminEntity } from '@modules/admin/entities/admin.entity';

import { OAuth2AuthorizeResponseModel } from './model/oauth2-authorize.response.model';
import { OAuth2CallbackResponseModel } from './model/oauth2-callback.response.model';
import { GetStatusResponseModel } from './model/get-status.response.model';
import { TelegramCallbackRequestDto } from './dtos';
import { ILogin, IRegister } from './interfaces';

const scryptAsync = promisify(scrypt);

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly jwtSecret: string;
    private readonly jwtLifetime: number;
    private readonly github: {
        client: arctic.GitHub;
        allowedEmails: string[];
    };
    private readonly pocketId: {
        client: arctic.OAuth2Client;
        plainDomain: string;
        allowedEmails: string[];
    };
    private readonly tgAuth: {
        botId: number | null;
        botToken: string | null;
        adminIds: number[];
    };
    private readonly yandex: {
        client: arctic.Yandex;
        allowedEmails: string[];
    };
    private readonly branding: {
        title: string | null;
        logoUrl: string | null;
    };
    private readonly oauth2Providers: Record<TOAuth2ProvidersKeys, boolean>;

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

        const isGithubAuthEnabled =
            this.configService.get<string>('OAUTH2_GITHUB_ENABLED') === 'true';
        const isPocketIdAuthEnabled =
            this.configService.get<string>('OAUTH2_POCKETID_ENABLED') === 'true';
        const isYandexAuthEnabled =
            this.configService.get<string>('OAUTH2_YANDEX_ENABLED') === 'true';
        const isTgAuthEnabled = this.configService.get<string>('TELEGRAM_OAUTH_ENABLED') === 'true';

        this.branding = {
            title: this.configService.get<string>('BRANDING_TITLE') ?? null,
            logoUrl: this.configService.get<string>('BRANDING_LOGO_URL') ?? null,
        };

        this.oauth2Providers = {
            [OAUTH2_PROVIDERS.GITHUB]: isGithubAuthEnabled,
            [OAUTH2_PROVIDERS.POCKETID]: isPocketIdAuthEnabled,
            [OAUTH2_PROVIDERS.YANDEX]: isYandexAuthEnabled,
        };

        if (isGithubAuthEnabled) {
            this.github = {
                client: new arctic.GitHub(
                    this.configService.getOrThrow<string>('OAUTH2_GITHUB_CLIENT_ID'),
                    this.configService.getOrThrow<string>('OAUTH2_GITHUB_CLIENT_SECRET'),
                    null,
                ),
                allowedEmails: this.configService.getOrThrow<string[]>(
                    'OAUTH2_GITHUB_ALLOWED_EMAILS',
                ),
            };
        }

        if (isPocketIdAuthEnabled) {
            this.pocketId = {
                client: new arctic.OAuth2Client(
                    this.configService.getOrThrow<string>('OAUTH2_POCKETID_CLIENT_ID'),
                    this.configService.getOrThrow<string>('OAUTH2_POCKETID_CLIENT_SECRET'),
                    null,
                ),
                plainDomain: this.configService.getOrThrow<string>('OAUTH2_POCKETID_PLAIN_DOMAIN'),
                allowedEmails: this.configService.getOrThrow<string[]>(
                    'OAUTH2_POCKETID_ALLOWED_EMAILS',
                ),
            };
        }

        if (isYandexAuthEnabled) {
            this.yandex = {
                client: new arctic.Yandex(
                    this.configService.getOrThrow<string>('OAUTH2_YANDEX_CLIENT_ID'),
                    this.configService.getOrThrow<string>('OAUTH2_YANDEX_CLIENT_SECRET'),
                    '',
                ),
                allowedEmails: this.configService.getOrThrow<string[]>(
                    'OAUTH2_YANDEX_ALLOWED_EMAILS',
                ),
            };
        }

        if (isTgAuthEnabled) {
            const tgAuthInstance = new TelegramOAuth2({
                botToken: this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
            });
            this.tgAuth = {
                botId: tgAuthInstance.getBotId(),
                botToken: this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
                adminIds: this.configService.getOrThrow<number[]>('TELEGRAM_OAUTH_ADMIN_IDS'),
            };
        } else {
            this.tgAuth = {
                botId: null,
                botToken: null,
                adminIds: [],
            };
        }
    }

    public async login(
        dto: ILogin,
        ip: string,
        userAgent: string,
    ): Promise<
        ICommandResponse<{
            accessToken: string;
        }>
    > {
        try {
            const { username, password } = dto;

            const statusResponse = await this.getStatus();

            if (!statusResponse.isOk || !statusResponse.response) {
                return {
                    isOk: false,
                    ...ERRORS.GET_AUTH_STATUS_ERROR,
                };
            }

            if (!statusResponse.response.isLoginAllowed) {
                await this.emitFailedLoginAttempt(
                    username,
                    password,
                    ip,
                    userAgent,
                    'Login is not allowed.',
                );
                return {
                    isOk: false,
                    ...ERRORS.FORBIDDEN,
                };
            }

            if (statusResponse.response.tgAuth) {
                await this.emitFailedLoginAttempt(
                    username,
                    password,
                    ip,
                    userAgent,
                    'Telegram Oauth enabled, so username/password login is disabled.',
                );

                return {
                    isOk: false,
                    ...ERRORS.FORBIDDEN,
                };
            }
            if (
                Object.values(statusResponse.response.oauth2.providers).some((enabled) => enabled)
            ) {
                await this.emitFailedLoginAttempt(
                    username,
                    password,
                    ip,
                    userAgent,
                    'OAuth2 enabled, so username/password login is disabled.',
                );

                return {
                    isOk: false,
                    ...ERRORS.FORBIDDEN,
                };
            }

            const admin = await this.getAdminByUsername({
                username,
                role: ROLE.ADMIN,
            });

            if (!admin.isOk || !admin.response) {
                await this.emitFailedLoginAttempt(
                    username,
                    password,
                    ip,
                    userAgent,
                    'Admin is not found in database.',
                );
                return {
                    isOk: false,
                    ...ERRORS.FORBIDDEN,
                };
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
                return {
                    isOk: false,
                    ...ERRORS.FORBIDDEN,
                };
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

            return {
                isOk: true,
                response: { accessToken },
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.LOGIN_ERROR,
            };
        }
    }

    public async register(dto: IRegister): Promise<
        ICommandResponse<{
            accessToken: string;
        }>
    > {
        try {
            const { username, password } = dto;

            const statusResponse = await this.getStatus();

            if (!statusResponse.isOk || !statusResponse.response) {
                return {
                    isOk: false,
                    ...ERRORS.GET_AUTH_STATUS_ERROR,
                };
            }

            if (!statusResponse.response.isRegisterAllowed) {
                return {
                    isOk: false,
                    ...ERRORS.FORBIDDEN,
                };
            }

            const admin = await this.getAdminByUsername({
                username,
                role: ROLE.ADMIN,
            });

            if (admin.isOk && admin.response) {
                return {
                    isOk: false,
                    ...ERRORS.FORBIDDEN,
                };
            }

            const hashedPassword = await this.hashPassword(password);

            const createAdminResponse = await this.createAdmin({
                username,
                password: hashedPassword,
                role: ROLE.ADMIN,
            });

            if (!createAdminResponse.isOk || !createAdminResponse.response) {
                return {
                    isOk: false,
                    ...ERRORS.CREATE_ADMIN_ERROR,
                };
            }

            const accessToken = this.jwtService.sign(
                {
                    username,
                    uuid: createAdminResponse.response.uuid,
                    role: ROLE.ADMIN,
                },
                { expiresIn: `${this.jwtLifetime}h` },
            );

            return {
                isOk: true,
                response: { accessToken },
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.LOGIN_ERROR,
            };
        }
    }

    public async getStatus(): Promise<ICommandResponse<GetStatusResponseModel>> {
        try {
            const adminCount = await this.getAdminCount();

            if (!adminCount.isOk) {
                return {
                    isOk: false,
                    ...ERRORS.GET_AUTH_STATUS_ERROR,
                };
            }

            if (adminCount.response === undefined) {
                return {
                    isOk: false,
                    ...ERRORS.GET_AUTH_STATUS_ERROR,
                };
            }

            if (adminCount.response === 0) {
                return {
                    isOk: true,
                    response: new GetStatusResponseModel({
                        isLoginAllowed: false,
                        isRegisterAllowed: true,
                        tgAuth: null,
                        oauth2: {
                            providers: Object.fromEntries(
                                Object.values(OAUTH2_PROVIDERS).map((provider) => [
                                    provider,
                                    false,
                                ]),
                            ) as Record<TOAuth2ProvidersKeys, boolean>,
                        },
                        branding: this.branding,
                    }),
                };
            }

            return {
                isOk: true,
                response: new GetStatusResponseModel({
                    isLoginAllowed: true,
                    isRegisterAllowed: false,
                    tgAuth: this.tgAuth.botId ? { botId: this.tgAuth.botId } : null,
                    oauth2: {
                        providers: this.oauth2Providers,
                    },
                    branding: this.branding,
                }),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_AUTH_STATUS_ERROR,
            };
        }
    }

    public async telegramCallback(
        dto: TelegramCallbackRequestDto,
        ip: string,
        userAgent: string,
    ): Promise<
        ICommandResponse<{
            accessToken: string;
        }>
    > {
        try {
            const { id, username, first_name } = dto;

            const statusResponse = await this.getStatus();

            if (!statusResponse.isOk || !statusResponse.response) {
                return {
                    isOk: false,
                    ...ERRORS.GET_AUTH_STATUS_ERROR,
                };
            }

            if (!statusResponse.response.isLoginAllowed) {
                await this.emitFailedLoginAttempt(
                    username ? `@${username}` : first_name,
                    `Telegram ID: ${id}`,
                    ip,
                    userAgent,
                    'Login is not allowed.',
                );
                return {
                    isOk: false,
                    ...ERRORS.FORBIDDEN,
                };
            }

            if (!this.tgAuth.adminIds.includes(id)) {
                await this.emitFailedLoginAttempt(
                    username ? `@${username}` : first_name,
                    `Telegram ID: ${id}`,
                    ip,
                    userAgent,
                    'UserID is not in the allowed list.',
                );
                return {
                    isOk: false,
                    ...ERRORS.FORBIDDEN,
                };
            }

            const isHashValid = new TelegramOAuth2({
                botToken: this.tgAuth.botToken!,
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
                return {
                    isOk: false,
                    ...ERRORS.FORBIDDEN,
                };
            }

            const firstAdmin = await this.getFirstAdmin();

            if (!firstAdmin.isOk || !firstAdmin.response) {
                await this.emitFailedLoginAttempt(
                    username ? `@${username}` : first_name,
                    `Telegram ID: ${id}`,
                    ip,
                    userAgent,
                    'Superadmin is not found.',
                );
                return {
                    isOk: false,
                    ...ERRORS.FORBIDDEN,
                };
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

            return {
                isOk: true,
                response: { accessToken },
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.LOGIN_ERROR,
            };
        }
    }

    public async oauth2Authorize(
        provider: TOAuth2ProvidersKeys,
    ): Promise<ICommandResponse<OAuth2AuthorizeResponseModel>> {
        try {
            const statusResponse = await this.getStatus();
            if (!statusResponse.isOk || !statusResponse.response) {
                return {
                    isOk: false,
                    ...ERRORS.GET_AUTH_STATUS_ERROR,
                };
            }

            if (!statusResponse.response.isLoginAllowed) {
                return {
                    isOk: false,
                    ...ERRORS.FORBIDDEN,
                };
            }

            if (!statusResponse.response.oauth2.providers[provider]) {
                return {
                    isOk: false,
                    ...ERRORS.FORBIDDEN,
                };
            }

            let authorizationURL: URL;
            const state = arctic.generateState();
            let stateKey: string;

            switch (provider) {
                case OAUTH2_PROVIDERS.GITHUB:
                    authorizationURL = this.github.client.createAuthorizationURL(state, [
                        'user:email',
                    ]);
                    stateKey = `oauth2:${OAUTH2_PROVIDERS.GITHUB}`;
                    break;
                case OAUTH2_PROVIDERS.POCKETID:
                    authorizationURL = this.pocketId.client.createAuthorizationURL(
                        `https://${this.pocketId.plainDomain}/authorize`,
                        state,
                        ['email'],
                    );
                    stateKey = `oauth2:${OAUTH2_PROVIDERS.POCKETID}`;
                    break;
                case OAUTH2_PROVIDERS.YANDEX:
                    authorizationURL = this.yandex.client.createAuthorizationURL(state, [
                        'login:email',
                    ]);
                    stateKey = `oauth2:${OAUTH2_PROVIDERS.YANDEX}`;
                    break;
                default:
                    return {
                        isOk: false,
                        ...ERRORS.OAUTH2_PROVIDER_NOT_FOUND,
                    };
            }

            await this.cacheManager.set(stateKey, state, 600_000);

            return {
                isOk: true,
                response: new OAuth2AuthorizeResponseModel({
                    authorizationUrl: authorizationURL.toString(),
                }),
            };
        } catch (error) {
            this.logger.error('GitHub authorization error:', error);
            return {
                isOk: false,
                ...ERRORS.OAUTH2_AUTHORIZE_ERROR,
            };
        }
    }

    public async oauth2Callback(
        code: string,
        state: string,
        provider: TOAuth2ProvidersKeys,
        ip: string,
        userAgent: string,
    ): Promise<ICommandResponse<OAuth2CallbackResponseModel>> {
        try {
            const statusResponse = await this.getStatus();
            if (!statusResponse.isOk || !statusResponse.response) {
                return {
                    isOk: false,
                    ...ERRORS.GET_AUTH_STATUS_ERROR,
                };
            }

            if (!statusResponse.response.isLoginAllowed) {
                await this.emitFailedLoginAttempt(
                    'Unknown',
                    `OAuth2 code: ${code}`,
                    ip,
                    userAgent,
                    'Login is not allowed.',
                );

                return {
                    isOk: false,
                    ...ERRORS.FORBIDDEN,
                };
            }

            if (!statusResponse.response.oauth2.providers[provider]) {
                return {
                    isOk: false,
                    ...ERRORS.FORBIDDEN,
                };
            }

            const firstAdmin = await this.getFirstAdmin();
            if (!firstAdmin.isOk || !firstAdmin.response) {
                await this.emitFailedLoginAttempt(
                    'Unknown',
                    '–',
                    ip,
                    userAgent,
                    'Superadmin is not found.',
                );
                return {
                    isOk: false,
                    ...ERRORS.FORBIDDEN,
                };
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
                default:
                    return {
                        isOk: false,
                        ...ERRORS.FORBIDDEN,
                    };
            }

            if (!callbackResult.isAllowed || !callbackResult.email) {
                return {
                    isOk: false,
                    ...ERRORS.FORBIDDEN,
                };
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

            return {
                isOk: true,
                response: new OAuth2CallbackResponseModel({
                    accessToken: jwtToken,
                }),
            };
        } catch (error) {
            this.logger.error('GitHub callback error:', error);
            return {
                isOk: false,
                ...ERRORS.LOGIN_ERROR,
            };
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

            const tokens = await this.github.client.validateAuthorizationCode(code);
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

            if (!this.github.allowedEmails.includes(primaryEmail)) {
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
            this.logger.error('GitHub callback error:', error);

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
                return {
                    isAllowed: false,
                    email: null,
                };
            }

            const tokens = await this.pocketId.client.validateAuthorizationCode(
                `https://${this.pocketId.plainDomain}/api/oidc/token`,
                code,
                null,
            );

            const accessToken = tokens.accessToken();

            const { data } = await firstValueFrom(
                this.httpService
                    .get<{
                        email: string;
                        email_verified: boolean;
                        sub: string;
                    }>(`https://${this.pocketId.plainDomain}/api/oidc/userinfo`, {
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
                this.logger.error('Failed to fetch PocketID user info');
                return {
                    isAllowed: false,
                    email: null,
                };
            }

            if (!this.pocketId.allowedEmails.includes(data.email)) {
                await this.emitFailedLoginAttempt(
                    data.email,
                    '–',
                    ip,
                    userAgent,
                    'PocketID email is not in the allowed list.',
                );
                return {
                    isAllowed: false,
                    email: null,
                };
            }

            return {
                isAllowed: true,
                email: data.email,
            };
        } catch (error) {
            this.logger.error('PocketID callback error:', error);

            return {
                isAllowed: false,
                email: null,
            };
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

            const tokens = await this.yandex.client.validateAuthorizationCode(code);
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

            if (!this.yandex.allowedEmails.includes(primaryEmail)) {
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
            this.logger.error('Yandex callback error:', error);

            return {
                isAllowed: false,
                email: null,
            };
        }
    }

    private async getAdminCount(): Promise<ICommandResponse<number>> {
        return this.queryBus.execute<CountAdminsByRoleQuery, ICommandResponse<number>>(
            new CountAdminsByRoleQuery(ROLE.ADMIN),
        );
    }

    private async getAdminByUsername(
        dto: GetAdminByUsernameQuery,
    ): Promise<ICommandResponse<AdminEntity>> {
        return this.queryBus.execute<GetAdminByUsernameQuery, ICommandResponse<AdminEntity>>(
            new GetAdminByUsernameQuery(dto.username, dto.role),
        );
    }

    private async getFirstAdmin(): Promise<ICommandResponse<AdminEntity>> {
        return this.queryBus.execute<GetFirstAdminQuery, ICommandResponse<AdminEntity>>(
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

    private async createAdmin(dto: CreateAdminCommand): Promise<ICommandResponse<AdminEntity>> {
        return this.commandBus.execute<CreateAdminCommand, ICommandResponse<AdminEntity>>(
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
}
