import { ERRORS } from '@contract/constants';
import axios, {
    AxiosError,
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    RawAxiosRequestHeaders,
} from 'axios';
import https from 'node:https';
import { promisify } from 'node:util';
import { constants as zlibConstants, zstdCompress, ZstdOptions } from 'node:zlib';

import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import {
    AddUserCommand,
    AddUsersCommand,
    BlockIpsCommand,
    CollectReportsCommand,
    DropIpsCommand,
    DropUsersConnectionsCommand,
    GetCombinedStatsCommand,
    GetNodeHealthCheckCommand,
    GetSystemStatsCommand,
    GetUserIpListCommand,
    GetUsersIpListCommand,
    GetUsersStatsCommand,
    RecreateTablesCommand,
    RemoveUserCommand,
    RemoveUsersCommand,
    StartXrayCommand,
    StopXrayCommand,
    SyncCommand,
    UnblockIpsCommand,
} from '@remnawave/node-contract';

import { prettyBytesUtil } from '@common/utils/bytes';
import { formatExecutionTime, getTime } from '@common/utils/get-elapsed-time';

import { GetNodeJwtCommand } from '@modules/keygen/commands/get-node-jwt';

import { fail, ok, TResult } from '../types';
import { INodeConnectionOpts, INodeRequestOpts, IMtlsOptions } from './axios.interfaces';
import { MtlsSocksProxyAgent } from './mtls-agent';

const EMPTY_BODY: Readonly<Record<string, never>> = {};
const ZSTD_HEADERS: RawAxiosRequestHeaders = { 'Content-Encoding': 'zstd' };

const zstdCompressAsync = promisify(zstdCompress);

const ZSTD_OPTIONS: ZstdOptions = {
    params: {
        [zlibConstants.ZSTD_c_compressionLevel]: 1,
        [zlibConstants.ZSTD_c_enableLongDistanceMatching]: 1,
        [zlibConstants.ZSTD_c_windowLog]: 25,
    },
    chunkSize: 1024 * 1024,
};

@Injectable()
export class AxiosService {
    private readonly logger = new Logger(AxiosService.name);

    public axiosInstance: AxiosInstance;
    private mtlsOptions: IMtlsOptions;
    private readonly socksAgentCache = new Map<string, MtlsSocksProxyAgent>();

    constructor(private readonly commandBus: CommandBus) {
        this.axiosInstance = axios.create({
            timeout: 45_000,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });
    }

    public async setJwt() {
        try {
            const result = await this.commandBus.execute(new GetNodeJwtCommand());

            if (!result.isOk) {
                throw new Error(
                    'There are a problem with the JWT token. Please restart Remnawave.',
                );
            }

            const jwt = result.response;

            this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${jwt.jwtToken}`;

            this.mtlsOptions = {
                cert: jwt.clientCert,
                key: jwt.clientKey,
                ca: jwt.caCert,
            };

            const httpsAgent = new https.Agent({
                ...this.mtlsOptions,
                checkServerIdentity: () => undefined,
                rejectUnauthorized: true,
                keepAlive: true,
                minVersion: 'TLSv1.3',
            });

            this.axiosInstance.defaults.httpsAgent = httpsAgent;

            this.logger.log('Axios interceptor registered');
        } catch (error) {
            this.logger.error(`Error in onApplicationBootstrap: ${error}`);
            throw error;
        }
    }

    private resolveAgent(proxyUrl: null | string): https.Agent {
        if (!proxyUrl) {
            return this.axiosInstance.defaults.httpsAgent as https.Agent;
        }

        const cached = this.socksAgentCache.get(proxyUrl);
        if (cached) return cached;

        const httpsAgent = new MtlsSocksProxyAgent(proxyUrl, this.mtlsOptions);
        this.socksAgentCache.set(proxyUrl, httpsAgent);

        return httpsAgent;
    }

    private getNodeUrl(url: string, path: string, port: null | number): string {
        return port ? `https://${url}:${port}${path}` : `https://${url}${path}`;
    }

    private async request<TResponse extends { response: unknown }>(
        params: INodeRequestOpts,
    ): Promise<TResult<TResponse['response']>> {
        const {
            label,
            opts,
            path,
            data,
            compress: useCompression = false,
            handle500 = false,
            internalError = false,
            logAxiosError = true,
            method = 'post',
            timeout,
        } = params;

        const url = this.getNodeUrl(opts.address, path, opts.port);
        const httpsAgent = this.resolveAgent(opts.proxyUrl);

        try {
            let body: unknown = EMPTY_BODY;
            let headers: RawAxiosRequestHeaders | undefined;

            if (method === 'post') {
                body = data ?? EMPTY_BODY;

                if (useCompression) {
                    const startTime = getTime();
                    const { buffer: compressedData, size } = await this.compressData(data);

                    this.logger.log(
                        `[ZSTD] [${label}] ${formatExecutionTime(startTime)} | ${prettyBytesUtil(size)} -> ${prettyBytesUtil(compressedData.length)}`,
                    );

                    body = compressedData;
                    headers = ZSTD_HEADERS;
                }
            }

            const config: AxiosRequestConfig = { headers, httpsAgent, timeout };

            const response: AxiosResponse<TResponse> =
                method === 'get'
                    ? await this.axiosInstance.get<TResponse>(url, config)
                    : await this.axiosInstance.post<TResponse>(url, body, config);

            return ok(response.data.response);
        } catch (error) {
            if (internalError) {
                return this.failWithInternalError(label, error);
            }

            if (error instanceof AxiosError) {
                if (logAxiosError) {
                    this.logger.error(`Error in Axios ${label} request: ${error.message}`);
                }

                if (handle500 && error.code === '500') {
                    return fail(
                        ERRORS.NODE_ERROR_500_WITH_MSG.withMessage(JSON.stringify(error.message)),
                    );
                }

                return fail(ERRORS.NODE_ERROR_WITH_MSG.withMessage(JSON.stringify(error.message)));
            }

            this.logger.error(`Error in ${label}: ${error}`);

            return fail(
                ERRORS.NODE_ERROR_WITH_MSG.withMessage(JSON.stringify(error) ?? 'Unknown error'),
            );
        }
    }

    /*
     * XRAY MANAGEMENT
     */

    public async startXray(
        data: StartXrayCommand.Request,
        opts: INodeConnectionOpts,
    ): Promise<TResult<StartXrayCommand.Response['response']>> {
        return this.request<StartXrayCommand.Response>({
            label: 'START XRAY',
            path: StartXrayCommand.url,
            opts,
            data,
            compress: true,
            logAxiosError: false,
            timeout: 60_000,
        });
    }

    public async stopXray(
        opts: INodeConnectionOpts,
    ): Promise<TResult<StopXrayCommand.Response['response']>> {
        return this.request<StopXrayCommand.Response>({
            label: 'STOP XRAY',
            path: StopXrayCommand.url,
            opts,
            method: 'get',
        });
    }

    public async getNodeHealth(
        opts: INodeConnectionOpts,
    ): Promise<TResult<GetNodeHealthCheckCommand.Response['response']>> {
        return this.request<GetNodeHealthCheckCommand.Response>({
            label: 'GET NODE HEALTH',
            path: GetNodeHealthCheckCommand.url,
            opts,
            method: 'get',
            logAxiosError: false,
            timeout: 15_000,
        });
    }

    /*
     * STATS MANAGEMENT
     */

    public async getUsersStats(
        data: GetUsersStatsCommand.Request,
        opts: INodeConnectionOpts,
    ): Promise<TResult<GetUsersStatsCommand.Response['response']>> {
        return this.request<GetUsersStatsCommand.Response>({
            label: 'GET USERS STATS',
            path: GetUsersStatsCommand.url,
            opts,
            data,
            timeout: 15_000,
        });
    }

    public async getIpsList(
        data: GetUserIpListCommand.Request,
        opts: INodeConnectionOpts,
    ): Promise<TResult<GetUserIpListCommand.Response['response']>> {
        return this.request<GetUserIpListCommand.Response>({
            label: 'GET IPS LIST',
            path: GetUserIpListCommand.url,
            opts,
            data,
            logAxiosError: false,
            timeout: 5_000,
        });
    }

    public async getUsersIpsList(
        opts: INodeConnectionOpts,
    ): Promise<TResult<GetUsersIpListCommand.Response['response']>> {
        return this.request<GetUsersIpListCommand.Response>({
            label: 'GET USERS IPS LIST',
            path: GetUsersIpListCommand.url,
            opts,
            method: 'get',
            logAxiosError: false,
            timeout: 10_000,
        });
    }

    public async getSystemStats(
        opts: INodeConnectionOpts,
    ): Promise<TResult<GetSystemStatsCommand.Response['response']>> {
        return this.request<GetSystemStatsCommand.Response>({
            label: 'GET SYSTEM STATS',
            path: GetSystemStatsCommand.url,
            opts,
            method: 'get',
            handle500: true,
            logAxiosError: false,
            timeout: 15_000,
        });
    }

    public async getCombinedStats(
        data: GetCombinedStatsCommand.Request,
        opts: INodeConnectionOpts,
    ): Promise<TResult<GetCombinedStatsCommand.Response['response']>> {
        return this.request<GetCombinedStatsCommand.Response>({
            label: 'GET COMBINED STATS',
            path: GetCombinedStatsCommand.url,
            opts,
            data,
            handle500: true,
            logAxiosError: false,
        });
    }

    /*
     * User management
     */

    public async addUser(
        data: AddUserCommand.Request,
        opts: INodeConnectionOpts,
    ): Promise<TResult<AddUserCommand.Response['response']>> {
        return this.request<AddUserCommand.Response>({
            label: 'ADD USER',
            path: AddUserCommand.url,
            opts,
            data,
            timeout: 20_000,
        });
    }

    public async deleteUser(
        data: RemoveUserCommand.Request,
        opts: INodeConnectionOpts,
    ): Promise<TResult<RemoveUserCommand.Response['response']>> {
        return this.request<RemoveUserCommand.Response>({
            label: 'DELETE USER',
            path: RemoveUserCommand.url,
            opts,
            data,
            internalError: true,
            timeout: 20_000,
        });
    }

    public async addUsers(
        data: AddUsersCommand.Request,
        opts: INodeConnectionOpts,
    ): Promise<TResult<AddUsersCommand.Response['response']>> {
        return this.request<AddUsersCommand.Response>({
            label: 'ADD USERS',
            path: AddUsersCommand.url,
            opts,
            data,
            compress: true,
            timeout: 20_000,
        });
    }

    public async deleteUsers(
        data: RemoveUsersCommand.Request,
        opts: INodeConnectionOpts,
    ): Promise<TResult<RemoveUsersCommand.Response['response']>> {
        return this.request<RemoveUsersCommand.Response>({
            label: 'DELETE USERS',
            path: RemoveUsersCommand.url,
            opts,
            data,
            compress: true,
            internalError: true,
            timeout: 20_000,
        });
    }

    public async dropUsersConnections(
        data: DropUsersConnectionsCommand.Request,
        opts: INodeConnectionOpts,
    ): Promise<TResult<DropUsersConnectionsCommand.Response['response']>> {
        return this.request<DropUsersConnectionsCommand.Response>({
            label: 'DROP USERS CONNECTIONS',
            path: DropUsersConnectionsCommand.url,
            opts,
            data,
            timeout: 10_000,
        });
    }

    public async dropIpsConnections(
        data: DropIpsCommand.Request,
        opts: INodeConnectionOpts,
    ): Promise<TResult<DropIpsCommand.Response['response']>> {
        return this.request<DropIpsCommand.Response>({
            label: 'DROP IPS CONNECTIONS',
            path: DropIpsCommand.url,
            opts,
            data,
            timeout: 10_000,
        });
    }

    public async syncNodePlugins(
        data: SyncCommand.Request,
        opts: INodeConnectionOpts,
    ): Promise<TResult<SyncCommand.Response['response']>> {
        return this.request<SyncCommand.Response>({
            label: 'SYNC-NODE-PLUGINS',
            path: SyncCommand.url,
            opts,
            data,
            compress: true,
            logAxiosError: false,
            timeout: 10_000,
        });
    }

    public async collectTorrentBlockerReports(
        opts: INodeConnectionOpts,
    ): Promise<TResult<CollectReportsCommand.Response['response']>> {
        return this.request<CollectReportsCommand.Response>({
            label: 'COLLECT TORRENT BLOCKER REPORTS',
            path: CollectReportsCommand.url,
            opts,
            logAxiosError: false,
            timeout: 20_000,
        });
    }

    public async blockIps(
        data: BlockIpsCommand.Request,
        opts: INodeConnectionOpts,
    ): Promise<TResult<BlockIpsCommand.Response['response']>> {
        return this.request<BlockIpsCommand.Response>({
            label: 'BLOCK IPS',
            path: BlockIpsCommand.url,
            opts,
            data,
            timeout: 10_000,
        });
    }

    public async unblockIps(
        data: UnblockIpsCommand.Request,
        opts: INodeConnectionOpts,
    ): Promise<TResult<UnblockIpsCommand.Response['response']>> {
        return this.request<UnblockIpsCommand.Response>({
            label: 'UNBLOCK IPS',
            path: UnblockIpsCommand.url,
            opts,
            data,
            timeout: 10_000,
        });
    }

    public async recreateTables(
        opts: INodeConnectionOpts,
    ): Promise<TResult<RecreateTablesCommand.Response['response']>> {
        return this.request<RecreateTablesCommand.Response>({
            label: 'RECREATE TABLES',
            path: RecreateTablesCommand.url,
            opts,
            timeout: 10_000,
        });
    }

    private failWithInternalError<T>(label: string, error: unknown): TResult<T> {
        if (error instanceof AxiosError) {
            this.logger.error(`Error in ${label}: ${error.response?.data}`);
        } else {
            this.logger.error(`Error in ${label}: ${error}`);
        }

        return fail(ERRORS.INTERNAL_SERVER_ERROR);
    }

    private async compressData(data: unknown): Promise<{
        buffer: Buffer;
        size: number;
    }> {
        const buffer = Buffer.from(JSON.stringify(data));

        return {
            buffer: await zstdCompressAsync(buffer, {
                ...ZSTD_OPTIONS,
                pledgedSrcSize: buffer.length,
            }),
            size: buffer.length,
        };
    }
}
