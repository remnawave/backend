import { getClientIp } from '@kastov/request-ip';
import { verify } from 'jsonwebtoken';
import { IncomingMessage } from 'node:http';
import { Duplex } from 'node:stream';
import { WebSocket, WebSocketServer } from 'ws';

import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { QueryBus } from '@nestjs/cqrs';

import { TypedConfigService } from '@common/config/app-config';
import { TResult } from '@common/types';
import { isDevelopment } from '@common/utils/startup-app';
import { ROLE } from '@libs/contracts/constants';
import { REMNAWAVE_REAL_IP_HEADER } from '@libs/contracts/constants';
import { SSH_TERMINAL_WS_PATH, SSH_TERMINAL_WS_PROTOCOL } from '@libs/contracts/models';

import { AdminEntity } from '@modules/admin/entities/admin.entity';
import { GetAdminByUsernameQuery } from '@modules/admin/queries/get-admin-by-username';
import type { IJWTAuthPayload } from '@modules/auth/interfaces';
import { NodesEntity } from '@modules/nodes/entities/nodes.entity';
import { GetNodeByUuidQuery } from '@modules/nodes/queries/get-node-by-uuid/get-node-by-uuid.query';

import { IAdminIdentity, ISshCredentials } from '../interfaces';
import { NodeSshService } from '../node-ssh.service';
import { SshSession } from './ssh-session';

const MAX_CONCURRENT_SESSIONS = 20;
const MAX_MESSAGE_BYTES = 1 << 20;

@Injectable()
export class SshTerminalGateway implements OnApplicationBootstrap, OnModuleDestroy {
    private readonly logger = new Logger(SshTerminalGateway.name);
    private readonly sessions = new Set<SshSession>();

    private onUpgrade: ((request: IncomingMessage, socket: Duplex, head: Buffer) => void) | null =
        null;
    private server: WebSocketServer | null = null;

    constructor(
        private readonly configService: TypedConfigService,
        private readonly httpAdapterHost: HttpAdapterHost,
        private readonly nodeSshService: NodeSshService,
        private readonly queryBus: QueryBus,
    ) {}

    onApplicationBootstrap(): void {
        const httpServer = this.httpAdapterHost.httpAdapter?.getHttpServer();
        if (!httpServer) {
            return;
        }

        this.server = new WebSocketServer({
            autoPong: false,
            handleProtocols: (protocols) =>
                protocols.has(SSH_TERMINAL_WS_PROTOCOL) ? SSH_TERMINAL_WS_PROTOCOL : false,
            maxPayload: MAX_MESSAGE_BYTES,
            noServer: true,
        });

        this.onUpgrade = (request, socket, head) => {
            socket.on('error', (error) =>
                this.logger.debug(`Upgrade socket error: ${error.message}`),
            );

            void this.handleUpgrade(request, socket, head).catch((error: unknown) => {
                this.logger.error(`Upgrade failed: ${String(error)}`);
                reject(socket, 500, 'Internal Server Error');
            });
        };

        httpServer.on('upgrade', this.onUpgrade);

        this.logger.log(`ws mounted on ${SSH_TERMINAL_WS_PATH}`);
    }

    onModuleDestroy(): void {
        const httpServer = this.httpAdapterHost.httpAdapter?.getHttpServer();
        if (httpServer && this.onUpgrade) {
            httpServer.off('upgrade', this.onUpgrade);
        }
        this.onUpgrade = null;

        for (const session of this.sessions) {
            session.terminate('panel is shutting down');
        }
        this.sessions.clear();

        this.server?.close();
        this.server = null;
    }

    private async handleUpgrade(
        request: IncomingMessage,
        socket: Duplex,
        head: Buffer,
    ): Promise<void> {
        const server = this.server;
        if (!server) {
            return;
        }

        const url = new URL(request.url ?? '', 'http://localhost');
        if (url.pathname !== SSH_TERMINAL_WS_PATH) {
            return reject(socket, 404, 'Not Found');
        }

        if (!isDevelopment() && !isBehindTrustedProxy(request)) {
            this.logger.error('Reverse proxy and HTTPS are required.');
            return reject(socket, 400, 'Bad Request');
        }

        const credentials = parseCredentials(request.headers['sec-websocket-protocol']);
        if (!credentials) {
            return reject(socket, 401, 'Unauthorized');
        }

        const clientIp = getClientIp(request, [REMNAWAVE_REAL_IP_HEADER]) ?? '0.0.0.0';

        const admin = await this.verifyAdminToken(credentials.token);
        if (!admin) {
            return reject(socket, 401, 'Unauthorized');
        }

        const payload = await this.nodeSshService.consumeTicket(credentials.ticket, clientIp);
        if (!payload) {
            return reject(socket, 401, 'Unauthorized');
        }

        if (payload.adminUuid !== admin.uuid) {
            this.logger.warn("SSH ticket presented with another admin's token.");
            return reject(socket, 401, 'Unauthorized');
        }

        const node = await this.queryBus.execute(new GetNodeByUuidQuery(payload.nodeUuid));

        if (!node.isOk) {
            return reject(socket, 404, 'Not Found');
        }

        if (this.sessions.size >= MAX_CONCURRENT_SESSIONS) {
            this.logger.warn(`Refusing SSH session: ${MAX_CONCURRENT_SESSIONS} already open.`);
            return reject(socket, 503, 'Service Unavailable');
        }

        server.handleUpgrade(request, socket, head, (ws: WebSocket) => {
            try {
                this.startSession(ws, node.response, admin);
            } catch (error) {
                this.logger.error(error);
                ws.terminate();
            }
        });
    }

    private async verifyAdminToken(token: string): Promise<IAdminIdentity | null> {
        let payload: IJWTAuthPayload;

        try {
            payload = verify(token, this.configService.getOrThrow('APP_SECRET')) as IJWTAuthPayload;
        } catch {
            return null;
        }

        if (payload.role !== ROLE.ADMIN || !payload.username || !payload.uuid) {
            return null;
        }

        const admin = await this.queryBus.execute<GetAdminByUsernameQuery, TResult<AdminEntity>>(
            new GetAdminByUsernameQuery(payload.username, payload.role),
        );

        if (!admin.isOk || admin.response.uuid !== payload.uuid) {
            return null;
        }

        return { username: payload.username, uuid: payload.uuid };
    }

    private startSession(ws: WebSocket, node: NodesEntity, admin: IAdminIdentity): void {
        const session: SshSession = new SshSession(ws, {
            allowedHosts: [node.address, ...node.ips.map((entry) => entry.ip)],
            nodeAddress: node.address,
            onClosed: () => {
                this.sessions.delete(session);
            },
            onOpened: (target, username) => {
                this.logger.log(
                    `SSH session opened by ${admin.username} to ${username}@${target} (node ${node.name})`,
                );
            },
        });

        this.sessions.add(session);
    }
}

function parseCredentials(header: string | string[] | undefined): ISshCredentials | null {
    const parts = (Array.isArray(header) ? header.join(',') : (header ?? ''))
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);

    if (parts.length !== 3 || parts[0] !== SSH_TERMINAL_WS_PROTOCOL) {
        return null;
    }

    return { ticket: parts[1], token: parts[2] };
}

function isBehindTrustedProxy(request: IncomingMessage): boolean {
    return (
        Boolean(request.headers['x-forwarded-for']) &&
        request.headers['x-forwarded-proto'] === 'https'
    );
}

function reject(socket: Duplex, code: number, message: string): void {
    socket.write(`HTTP/1.1 ${code} ${message}\r\nConnection: close\r\n\r\n`);
    socket.destroy();
}
