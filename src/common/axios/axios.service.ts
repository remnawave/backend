import axios, { AxiosError, AxiosInstance } from 'axios';
import { compress } from '@mongodb-js/zstd';
import https from 'node:https';

import { ERRORS } from '@contract/constants';

import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import {
    AddUserCommand,
    GetCombinedStatsCommand,
    GetNodeHealthCheckCommand,
    GetSystemStatsCommand,
    GetUsersStatsCommand,
    RemoveUserCommand,
    StartXrayCommand,
    StopXrayCommand,
} from '@remnawave/node-contract';

import { formatExecutionTime, getTime } from '@common/utils/get-elapsed-time';
import { prettyBytesUtil } from '@common/utils/bytes';

import { GetNodeJwtCommand } from '@modules/keygen/commands/get-node-jwt';

import { fail, ok, TResult } from '../types';

@Injectable()
export class AxiosService {
    public axiosInstance: AxiosInstance;
    private readonly logger = new Logger(AxiosService.name);
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

            const httpsAgent = new https.Agent({
                cert: jwt.clientCert,
                key: jwt.clientKey,
                ca: jwt.caCert,
                checkServerIdentity: () => undefined,
                rejectUnauthorized: true,
                keepAlive: true,
            });

            this.axiosInstance.defaults.httpsAgent = httpsAgent;

            this.logger.log('Axios interceptor registered');
        } catch (error) {
            this.logger.error(`Error in onApplicationBootstrap: ${error}`);
            throw error;
        }
    }

    private getNodeUrl(url: string, path: string, port: null | number): string {
        const protocol = 'https';
        const portSuffix = port ? `:${port}` : '';

        return `${protocol}://${url}${portSuffix}${path}`;
    }

    /*
     * XRAY MANAGEMENT
     */

    public async startXray(
        data: StartXrayCommand.Request,
        url: string,
        port: null | number,
    ): Promise<TResult<StartXrayCommand.Response>> {
        const nodeUrl = this.getNodeUrl(url, StartXrayCommand.url, port);

        try {
            const ct = getTime();

            const compressedData = await this.compressData(data);

            this.logger.log(
                `Compressed data in: ${formatExecutionTime(ct)}, size: ${prettyBytesUtil(compressedData.length, false, 0, true)}`,
            );

            const response = await this.axiosInstance.post<StartXrayCommand.Response>(
                nodeUrl,
                compressedData,
                {
                    timeout: 60_000,
                    headers: {
                        'Content-Encoding': 'zstd',
                    },
                },
            );

            return ok(response.data);
        } catch (error) {
            if (error instanceof AxiosError) {
                // this.logger.error(
                //     'Error in Axios StartXray Request:',
                //     JSON.stringify(error.message),
                // );

                return fail(ERRORS.NODE_ERROR_WITH_MSG.withMessage(JSON.stringify(error.message)));
            } else {
                this.logger.error('Error in Axios StartXray Request:', error);

                return fail(ERRORS.NODE_ERROR_WITH_MSG.withMessage(JSON.stringify(error)));
            }
        }
    }

    public async stopXray(
        url: string,
        port: null | number,
    ): Promise<TResult<StopXrayCommand.Response>> {
        const nodeUrl = this.getNodeUrl(url, StopXrayCommand.url, port);
        try {
            const response = await this.axiosInstance.get<StopXrayCommand.Response>(nodeUrl);

            return ok(response.data);
        } catch (error) {
            if (error instanceof AxiosError) {
                this.logger.error(
                    'Error in Axios StopXray Request:',
                    JSON.stringify(error.message),
                );

                return fail(ERRORS.NODE_ERROR_WITH_MSG.withMessage(JSON.stringify(error.message)));
            } else {
                this.logger.error('Error in Axios StopXray Request:', error);

                return fail(
                    ERRORS.NODE_ERROR_WITH_MSG.withMessage(
                        JSON.stringify(error) ?? 'Unknown error',
                    ),
                );
            }
        }
    }

    public async getNodeHealth(
        url: string,
        port: null | number,
    ): Promise<TResult<GetNodeHealthCheckCommand.Response['response']>> {
        try {
            const nodeUrl = this.getNodeUrl(url, GetNodeHealthCheckCommand.url, port);
            const { data } = await this.axiosInstance.get<GetNodeHealthCheckCommand.Response>(
                nodeUrl,
                {
                    timeout: 15_000,
                },
            );

            return ok(data.response);
        } catch (error) {
            if (error instanceof AxiosError) {
                return fail(ERRORS.NODE_ERROR_WITH_MSG.withMessage(JSON.stringify(error.message)));
            } else {
                this.logger.error('Error in Axios getNodeHealth:', error);

                return fail(
                    ERRORS.NODE_ERROR_WITH_MSG.withMessage(
                        JSON.stringify(error) ?? 'Unknown error',
                    ),
                );
            }
        }
    }

    /*
     * STATS MANAGEMENT
     */

    public async getUsersStats(
        data: GetUsersStatsCommand.Request,
        url: string,
        port: null | number,
    ): Promise<TResult<GetUsersStatsCommand.Response>> {
        const nodeUrl = this.getNodeUrl(url, GetUsersStatsCommand.url, port);

        try {
            const response = await this.axiosInstance.post<GetUsersStatsCommand.Response>(
                nodeUrl,
                data,
                {
                    timeout: 15_000,
                },
            );

            return ok(response.data);
        } catch (error) {
            if (error instanceof AxiosError) {
                this.logger.error(
                    `Error in Axios getUsersStats: ${error.message}, JSON: ${JSON.stringify(error.response?.data)}`,
                );

                return fail(ERRORS.NODE_ERROR_WITH_MSG.withMessage(JSON.stringify(error.message)));
            } else {
                this.logger.error('Error in getUsersStats:', error);

                return fail(
                    ERRORS.NODE_ERROR_WITH_MSG.withMessage(
                        JSON.stringify(error) ?? 'Unknown error',
                    ),
                );
            }
        }
    }

    public async getSystemStats(
        url: string,
        port: null | number,
    ): Promise<TResult<GetSystemStatsCommand.Response>> {
        const nodeUrl = this.getNodeUrl(url, GetSystemStatsCommand.url, port);

        try {
            const response = await this.axiosInstance.get<GetSystemStatsCommand.Response>(nodeUrl, {
                timeout: 15_000,
            });

            return ok(response.data);
        } catch (error) {
            if (error instanceof AxiosError) {
                // this.logger.error(`Error in axios request: ${JSON.stringify(error.message)}`);

                if (error.code === '500') {
                    return fail(
                        ERRORS.NODE_ERROR_500_WITH_MSG.withMessage(JSON.stringify(error.message)),
                    );
                }

                return fail(ERRORS.NODE_ERROR_WITH_MSG.withMessage(JSON.stringify(error.message)));
            } else {
                this.logger.error('Error in getSystemStats:', error);

                return fail(
                    ERRORS.NODE_ERROR_WITH_MSG.withMessage(
                        JSON.stringify(error) ?? 'Unknown error',
                    ),
                );
            }
        }
    }

    public async getCombinedStats(
        data: GetCombinedStatsCommand.Request,
        url: string,
        port: null | number,
    ): Promise<TResult<GetCombinedStatsCommand.Response['response']>> {
        const nodeUrl = this.getNodeUrl(url, GetCombinedStatsCommand.url, port);

        try {
            const nodeResult = await this.axiosInstance.post<GetCombinedStatsCommand.Response>(
                nodeUrl,
                data,
            );

            return ok(nodeResult.data.response);
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.code === '500') {
                    return fail(
                        ERRORS.NODE_ERROR_500_WITH_MSG.withMessage(JSON.stringify(error.message)),
                    );
                }

                return fail(ERRORS.NODE_ERROR_WITH_MSG.withMessage(JSON.stringify(error.message)));
            } else {
                this.logger.error('Error in getAllInboundStats:', error);

                return fail(
                    ERRORS.NODE_ERROR_WITH_MSG.withMessage(
                        JSON.stringify(error) ?? 'Unknown error',
                    ),
                );
            }
        }
    }

    /*
     * User management
     */

    public async addUser(
        data: AddUserCommand.Request,
        url: string,
        port: null | number,
    ): Promise<TResult<AddUserCommand.Response>> {
        const nodeUrl = this.getNodeUrl(url, AddUserCommand.url, port);

        try {
            const response = await this.axiosInstance.post<AddUserCommand.Response>(nodeUrl, data, {
                timeout: 20_000,
            });

            return ok(response.data);
        } catch (error) {
            if (error instanceof AxiosError) {
                this.logger.error(`Error in axios request: ${error.message}`);

                return fail(ERRORS.NODE_ERROR_WITH_MSG.withMessage(JSON.stringify(error.message)));
            } else {
                this.logger.error('Error in addUser:', error);

                return fail(
                    ERRORS.NODE_ERROR_WITH_MSG.withMessage(
                        JSON.stringify(error) ?? 'Unknown error',
                    ),
                );
            }
        }
    }

    public async deleteUser(
        data: RemoveUserCommand.Request,
        url: string,
        port: null | number,
    ): Promise<TResult<RemoveUserCommand.Response>> {
        const nodeUrl = this.getNodeUrl(url, RemoveUserCommand.url, port);

        try {
            const response = await this.axiosInstance.post<RemoveUserCommand.Response>(
                nodeUrl,
                data,
                {
                    timeout: 20_000,
                },
            );

            return ok(response.data);
        } catch (error) {
            if (error instanceof AxiosError) {
                this.logger.error('Error in deleteUser:', error.response?.data);
            } else {
                this.logger.error('Error in deleteUser:', error);
            }

            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    private async compressData(data: any): Promise<Buffer> {
        return await compress(Buffer.from(JSON.stringify(data)), 1);
    }
}
