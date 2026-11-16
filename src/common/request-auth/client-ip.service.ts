import type { IncomingMessage } from 'node:http';

import proxyaddr from 'proxy-addr';

import { Injectable, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { TypedConfigService } from '@common/config/app-config';
import { isUsableIp, verifyRealIpProof } from '@common/utils/client-ip';
import { ROOT, SUBSCRIPTION_CONTROLLER } from '@libs/contracts/api';
import {
    REMNAWAVE_REAL_IP_HEADER,
    REMNAWAVE_REAL_IP_PROOF_HEADER,
} from '@libs/contracts/constants';

import { RequestAuthService } from './request-auth.service';

type TTrustProxyFn = (address: string, hop: number) => boolean;

const SUBSCRIPTION_PATH = `${ROOT}/${SUBSCRIPTION_CONTROLLER}`;

@Injectable()
export class ClientIpService {
    private readonly logger = new Logger(ClientIpService.name);
    private readonly appSecret: string;
    private readonly requireRealIpProof: boolean;

    constructor(
        configService: TypedConfigService,
        private readonly httpAdapterHost: HttpAdapterHost,
        private readonly requestAuthService: RequestAuthService,
    ) {
        this.appSecret = configService.getOrThrow('APP_SECRET');
        this.requireRealIpProof = configService.getOrThrow('REQUIRE_REAL_IP_PROOF');
    }

    public async resolve(request: IncomingMessage): Promise<string> {
        const forwardedIp = this.resolveForwardedIp(request);

        const realIp = request.headers[REMNAWAVE_REAL_IP_HEADER];

        if (typeof realIp !== 'string' || !isSubscriptionPath(request.url)) {
            return forwardedIp;
        }

        const ip = normalizeIp(realIp.trim());

        if (!this.requireRealIpProof) {
            return isUsableIp(ip) ? ip : forwardedIp;
        }

        const proof = request.headers[REMNAWAVE_REAL_IP_PROOF_HEADER];
        if (typeof proof !== 'string') return forwardedIp;

        const apiTokenUuid = verifyRealIpProof(ip, proof, this.appSecret);
        if (!apiTokenUuid) return forwardedIp;

        try {
            return (await this.requestAuthService.isApiTokenActive(apiTokenUuid))
                ? ip
                : forwardedIp;
        } catch (error) {
            this.logger.error(error);
            return forwardedIp;
        }
    }

    private resolveForwardedIp(request: IncomingMessage): string {
        const socketIp = normalizeIp(request.socket?.remoteAddress ?? '');

        if (!isUsableIp(socketIp)) return '0.0.0.0';

        const trustProxy: TTrustProxyFn = this.httpAdapterHost.httpAdapter
            .getInstance()
            .get('trust proxy fn');

        const ip = normalizeIp(proxyaddr(request, trustProxy).trim());

        return isUsableIp(ip) ? ip : socketIp;
    }
}

function isSubscriptionPath(url: string | undefined): boolean {
    const path = (url ?? '').split('?', 1)[0].toLowerCase();

    return path === SUBSCRIPTION_PATH || path.startsWith(`${SUBSCRIPTION_PATH}/`);
}

function normalizeIp(ip: string): string {
    return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}
