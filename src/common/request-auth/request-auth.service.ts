import type { Request } from 'express';

import { ExtractJwt } from 'passport-jwt';

import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';

import { RawCacheService } from '@common/raw-cache';
import { TResult } from '@common/types';
import {
    REMNAWAVE_CLIENT_TYPE_BROWSER,
    REMNAWAVE_CLIENT_TYPE_HEADER,
    ROLE,
} from '@libs/contracts/constants';

import { AdminEntity } from '@modules/admin/entities/admin.entity';
import { GetAdminByUsernameQuery } from '@modules/admin/queries/get-admin-by-username';
import { ApiTokenEntity } from '@modules/api-tokens/entities/api-token.entity';
import { GetTokenByUuidQuery } from '@modules/api-tokens/queries/get-token-by-uuid';
import type { IJWTAuthPayload } from '@modules/auth/interfaces';

const UNAUTHORIZED = new UnauthorizedException();
const FORBIDDEN = new ForbiddenException('Forbidden resource');
const ADMIN_CLIENT_TYPE_REQUIRED = new ForbiddenException(
    'For API requests you must create own API-token in the admin dashboard.',
);

const extractBearerToken = ExtractJwt.fromAuthHeaderAsBearerToken();

@Injectable()
export class RequestAuthService {
    private readonly authenticatedRequests = new WeakSet<Request>();

    constructor(
        private readonly jwtService: JwtService,
        private readonly rawCacheService: RawCacheService,
        private readonly queryBus: QueryBus,
    ) {}

    public isAuthenticated(request: Request): boolean {
        return this.authenticatedRequests.has(request);
    }

    public async authenticate(request: Request): Promise<IJWTAuthPayload> {
        const user = await this.resolveUser(request);

        request.user = user;
        this.authenticatedRequests.add(request);

        return user;
    }

    private async resolveUser(request: Request): Promise<IJWTAuthPayload> {
        const token = extractBearerToken(request);
        if (!token) {
            throw UNAUTHORIZED;
        }

        const user = await this.verifyToken(token);

        if (!user || !user.role || !user.uuid) {
            throw FORBIDDEN;
        }

        switch (user.role) {
            case ROLE.API: {
                if (!(await this.verifyApiToken(user, user.uuid))) {
                    throw FORBIDDEN;
                }

                return user;
            }

            case ROLE.ADMIN: {
                await this.verifyAdmin(request, user);

                return user;
            }

            default:
                throw FORBIDDEN;
        }
    }

    private async verifyToken(token: string): Promise<IJWTAuthPayload> {
        try {
            return await this.jwtService.verifyAsync<IJWTAuthPayload>(token, {
                algorithms: ['HS256'],
            });
        } catch {
            throw UNAUTHORIZED;
        }
    }

    private async verifyAdmin(request: Request, user: IJWTAuthPayload): Promise<void> {
        const clientType = request.headers[REMNAWAVE_CLIENT_TYPE_HEADER.toLowerCase()];

        if (clientType !== REMNAWAVE_CLIENT_TYPE_BROWSER) {
            throw ADMIN_CLIENT_TYPE_REQUIRED;
        }

        if (!user.username) {
            throw FORBIDDEN;
        }

        const adminEntity = await this.getAdminByUsername({
            username: user.username,
            role: user.role,
        });

        if (!adminEntity.isOk || adminEntity.response.uuid !== user.uuid) {
            throw FORBIDDEN;
        }
    }

    private async getAdminByUsername(dto: GetAdminByUsernameQuery): Promise<TResult<AdminEntity>> {
        return this.queryBus.execute<GetAdminByUsernameQuery, TResult<AdminEntity>>(
            new GetAdminByUsernameQuery(dto.username, dto.role),
        );
    }

    private async getTokenByUuid(dto: GetTokenByUuidQuery): Promise<TResult<ApiTokenEntity>> {
        return this.queryBus.execute<GetTokenByUuidQuery, TResult<ApiTokenEntity>>(
            new GetTokenByUuidQuery(dto.uuid),
        );
    }

    private async verifyApiToken(user: IJWTAuthPayload, apiTokenUuid: string): Promise<boolean> {
        const cached = await this.rawCacheService.get<string[]>(`api:${apiTokenUuid}`, true);
        if (cached) {
            user.scopes = cached;
            return true;
        }

        const token = await this.getTokenByUuid({ uuid: apiTokenUuid });
        if (!token.isOk) {
            return false;
        }

        const scopes = token.response.scopes ?? [];

        await this.rawCacheService.set(`api:${apiTokenUuid}`, scopes, 3600);
        user.scopes = scopes;
        return true;
    }
}
