import axios, { AxiosError, AxiosInstance } from 'axios';
import https from 'node:https';

import { ERRORS } from '@contract/constants';

import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import {
    AddUserCommand,
    GetAllInboundsStatsCommand,
    GetAllOutboundsStatsCommand,
    GetInboundStatsCommand,
    GetInboundUsersCommand,
    GetInboundUsersCountCommand,
    GetNodeHealthCheckCommand,
    GetOutboundStatsCommand,
    GetSystemStatsCommand,
    GetUserOnlineStatusCommand,
    GetUsersStatsCommand,
    RemoveUserCommand,
    StartXrayCommand,
    StopXrayCommand,
    X_HASH_PAYLOAD,
    X_FORCE_RESTART,
} from '@remnawave/node-contract';

import { GetNodeJwtCommand, IGetNodeJwtResponse } from '@modules/keygen/commands/get-node-jwt';

import { ICommandResponse } from '../types/command-response.type';

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
            const response = await this.getNodeJwtCommand();
            const jwt = response.response;

            if (!jwt) {
                throw new Error(
                    'There are a problem with the JWT token. Please restart Remnawave.',
                );
            }

            this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${jwt.jwtToken}`;

            const httpsAgent = new https.Agent({
                cert: jwt.clientCert,
                key: jwt.clientKey,
                ca: jwt.caCert,
                checkServerIdentity: () => undefined,
                rejectUnauthorized: true,
            });

            this.axiosInstance.defaults.httpsAgent = httpsAgent;

            this.logger.log('Axios interceptor registered');
        } catch (error) {
            this.logger.error(`Error in onApplicationBootstrap: ${error}`);
            throw error;
        }
    }

    private async getNodeJwtCommand(): Promise<ICommandResponse<IGetNodeJwtResponse>> {
        return this.commandBus.execute<GetNodeJwtCommand, ICommandResponse<IGetNodeJwtResponse>>(
            new GetNodeJwtCommand(),
        );
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
        hashesPayload: string,
        url: string,
        port: null | number,
        force?: boolean,
    ): Promise<ICommandResponse<StartXrayCommand.Response>> {
        const nodeUrl = this.getNodeUrl(url, StartXrayCommand.url, port);
        try {
            const response = await this.axiosInstance.post<StartXrayCommand.Response>(
                nodeUrl,
                data,
                {
                    timeout: 60_000,
                    headers: {
                        [X_HASH_PAYLOAD]: hashesPayload,
                        [X_FORCE_RESTART]: force ? 'true' : 'false',
                    },
                },
            );

            return {
                isOk: true,
                response: response.data,
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                // this.logger.error(
                //     'Error in Axios StartXray Request:',
                //     JSON.stringify(error.message),
                // );

                return {
                    isOk: false,
                    ...ERRORS.NODE_ERROR_WITH_MSG.withMessage(JSON.stringify(error.message)),
                };
            } else {
                this.logger.error('Error in Axios StartXray Request:', error);

                return {
                    isOk: false,
                    ...ERRORS.NODE_ERROR_WITH_MSG.withMessage(
                        JSON.stringify(error) ?? 'Unknown error',
                    ),
                };
            }
        }
    }

    public async stopXray(
        url: string,
        port: null | number,
    ): Promise<ICommandResponse<StopXrayCommand.Response>> {
        const nodeUrl = this.getNodeUrl(url, StopXrayCommand.url, port);
        try {
            const response = await this.axiosInstance.get<StopXrayCommand.Response>(nodeUrl);

            return {
                isOk: true,
                response: response.data,
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                this.logger.error(
                    'Error in Axios StopXray Request:',
                    JSON.stringify(error.message),
                );

                return {
                    isOk: false,
                    ...ERRORS.NODE_ERROR_WITH_MSG.withMessage(JSON.stringify(error.message)),
                };
            } else {
                this.logger.error('Error in Axios StopXray Request:', error);

                return {
                    isOk: false,
                    ...ERRORS.NODE_ERROR_WITH_MSG.withMessage(
                        JSON.stringify(error) ?? 'Unknown error',
                    ),
                };
            }
        }
    }

    public async getNodeHealth(
        url: string,
        port: null | number,
    ): Promise<ICommandResponse<GetNodeHealthCheckCommand.Response['response']>> {
        try {
            const nodeUrl = this.getNodeUrl(url, GetNodeHealthCheckCommand.url, port);
            const { data } = await this.axiosInstance.get<GetNodeHealthCheckCommand.Response>(
                nodeUrl,
                {
                    timeout: 15_000,
                },
            );

            return {
                isOk: true,
                response: data.response,
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                return {
                    isOk: false,
                    ...ERRORS.NODE_ERROR_WITH_MSG.withMessage(JSON.stringify(error.message)),
                };
            } else {
                this.logger.error('Error in Axios getNodeHealth:', error);

                return {
                    isOk: false,
                    ...ERRORS.NODE_ERROR_WITH_MSG.withMessage(
                        JSON.stringify(error) ?? 'Unknown error',
                    ),
                };
            }
        }
    }

    /*
     * STATS MANAGEMENT
     */

    public async getUserOnlineStatus(
        data: GetUserOnlineStatusCommand.Request,
        url: string,
        port: null | number,
    ): Promise<ICommandResponse<GetUserOnlineStatusCommand.Response>> {
        const nodeUrl = this.getNodeUrl(url, GetUserOnlineStatusCommand.url, port);

        try {
            const response = await this.axiosInstance.post<GetUserOnlineStatusCommand.Response>(
                nodeUrl,
                data,
            );

            return {
                isOk: true,
                response: response.data,
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                this.logger.error('Error in getUserOnlineStatus:', error.response?.data);
            } else {
                this.logger.error('Error in getUserOnlineStatus:', error);
            }

            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }

    public async getUsersStats(
        data: GetUsersStatsCommand.Request,
        url: string,
        port: null | number,
    ): Promise<ICommandResponse<GetUsersStatsCommand.Response>> {
        const nodeUrl = this.getNodeUrl(url, GetUsersStatsCommand.url, port);

        try {
            const response = await this.axiosInstance.post<GetUsersStatsCommand.Response>(
                nodeUrl,
                data,
                {
                    timeout: 15_000,
                },
            );

            return {
                isOk: true,
                response: response.data,
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                this.logger.error(
                    `Error in Axios getUsersStats: ${error.message}, JSON: ${JSON.stringify(error.response?.data)}`,
                );

                return {
                    isOk: false,
                    ...ERRORS.NODE_ERROR_WITH_MSG.withMessage(JSON.stringify(error.message)),
                };
            } else {
                this.logger.error('Error in getUsersStats:', error);

                return {
                    isOk: false,
                    ...ERRORS.NODE_ERROR_WITH_MSG.withMessage(
                        JSON.stringify(error) ?? 'Unknown error',
                    ),
                };
            }
        }
    }

    public async getSystemStats(
        url: string,
        port: null | number,
    ): Promise<ICommandResponse<GetSystemStatsCommand.Response>> {
        const nodeUrl = this.getNodeUrl(url, GetSystemStatsCommand.url, port);

        try {
            const response = await this.axiosInstance.get<GetSystemStatsCommand.Response>(nodeUrl, {
                timeout: 15_000,
            });

            return {
                isOk: true,
                response: response.data,
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                // this.logger.error(`Error in axios request: ${JSON.stringify(error.message)}`);

                if (error.code === '500') {
                    return {
                        isOk: false,
                        ...ERRORS.NODE_ERROR_500_WITH_MSG.withMessage(
                            JSON.stringify(error.message),
                        ),
                    };
                }

                return {
                    isOk: false,
                    ...ERRORS.NODE_ERROR_WITH_MSG.withMessage(JSON.stringify(error.message)),
                };
            } else {
                this.logger.error('Error in getSystemStats:', error);

                return {
                    isOk: false,
                    ...ERRORS.NODE_ERROR_WITH_MSG.withMessage(
                        JSON.stringify(error) ?? 'Unknown error',
                    ),
                };
            }
        }
    }

    public async getInboundStats(
        data: GetInboundStatsCommand.Request,
        url: string,
        port: null | number,
    ): Promise<ICommandResponse<GetInboundStatsCommand.Response>> {
        const nodeUrl = this.getNodeUrl(url, GetInboundStatsCommand.url, port);

        try {
            const response = await this.axiosInstance.post<GetInboundStatsCommand.Response>(
                nodeUrl,
                data,
                {
                    timeout: 15_000,
                },
            );

            return {
                isOk: true,
                response: response.data,
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                this.logger.error('Error in getInboundStats:', error.response?.data);
            } else {
                this.logger.error('Error in getInboundStats:', error);
            }

            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }

    public async getAllInboundStats(
        data: GetAllInboundsStatsCommand.Request,
        url: string,
        port: null | number,
    ): Promise<ICommandResponse<GetAllInboundsStatsCommand.Response>> {
        const nodeUrl = this.getNodeUrl(url, GetAllInboundsStatsCommand.url, port);

        try {
            const response = await this.axiosInstance.post<GetAllInboundsStatsCommand.Response>(
                nodeUrl,
                data,
                {
                    timeout: 15_000,
                },
            );

            return {
                isOk: true,
                response: response.data,
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                // this.logger.error(`Error in axios request: ${JSON.stringify(error.message)}`);

                if (error.code === '500') {
                    return {
                        isOk: false,
                        ...ERRORS.NODE_ERROR_500_WITH_MSG.withMessage(
                            JSON.stringify(error.message),
                        ),
                    };
                }

                return {
                    isOk: false,
                    ...ERRORS.NODE_ERROR_WITH_MSG.withMessage(JSON.stringify(error.message)),
                };
            } else {
                this.logger.error('Error in getAllInboundStats:', error);

                return {
                    isOk: false,
                    ...ERRORS.NODE_ERROR_WITH_MSG.withMessage(
                        JSON.stringify(error) ?? 'Unknown error',
                    ),
                };
            }
        }
    }

    public async getAllOutboundStats(
        data: GetAllOutboundsStatsCommand.Request,
        url: string,
        port: null | number,
    ): Promise<ICommandResponse<GetAllOutboundsStatsCommand.Response>> {
        const nodeUrl = this.getNodeUrl(url, GetAllOutboundsStatsCommand.url, port);

        try {
            const response = await this.axiosInstance.post<GetAllOutboundsStatsCommand.Response>(
                nodeUrl,
                data,
                {
                    timeout: 15_000,
                },
            );

            return {
                isOk: true,
                response: response.data,
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                // this.logger.error(`Error in axios request: ${JSON.stringify(error.message)}`);

                if (error.code === '500') {
                    return {
                        isOk: false,
                        ...ERRORS.NODE_ERROR_500_WITH_MSG.withMessage(
                            JSON.stringify(error.message),
                        ),
                    };
                }

                return {
                    isOk: false,
                    ...ERRORS.NODE_ERROR_WITH_MSG.withMessage(JSON.stringify(error.message)),
                };
            } else {
                this.logger.error('Error in getAllOutboundStats:', error);

                return {
                    isOk: false,
                    ...ERRORS.NODE_ERROR_WITH_MSG.withMessage(
                        JSON.stringify(error) ?? 'Unknown error',
                    ),
                };
            }
        }
    }

    public async getOutboundStats(
        data: GetOutboundStatsCommand.Request,
        url: string,
        port: null | number,
    ): Promise<ICommandResponse<GetOutboundStatsCommand.Response>> {
        const nodeUrl = this.getNodeUrl(url, GetOutboundStatsCommand.url, port);

        try {
            const response = await this.axiosInstance.post<GetOutboundStatsCommand.Response>(
                nodeUrl,
                data,
                {
                    timeout: 15_000,
                },
            );

            return {
                isOk: true,
                response: response.data,
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                this.logger.error('Error in getOutboundStats:', error.response?.data);
            } else {
                this.logger.error('Error in getOutboundStats:', error);
            }

            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }

    /*
     * User management
     */

    public async addUser(
        data: AddUserCommand.Request,
        url: string,
        port: null | number,
    ): Promise<ICommandResponse<AddUserCommand.Response>> {
        const nodeUrl = this.getNodeUrl(url, AddUserCommand.url, port);

        try {
            const response = await this.axiosInstance.post<AddUserCommand.Response>(nodeUrl, data, {
                timeout: 20_000,
            });

            return {
                isOk: true,
                response: response.data,
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                this.logger.error(`Error in axios request: ${error.message}`);

                return {
                    isOk: false,
                    ...ERRORS.NODE_ERROR_WITH_MSG.withMessage(JSON.stringify(error.message)),
                };
            } else {
                this.logger.error('Error in addUser:', error);

                return {
                    isOk: false,
                    ...ERRORS.NODE_ERROR_WITH_MSG.withMessage(
                        JSON.stringify(error) ?? 'Unknown error',
                    ),
                };
            }
        }
    }

    public async deleteUser(
        data: RemoveUserCommand.Request,
        url: string,
        port: null | number,
    ): Promise<ICommandResponse<RemoveUserCommand.Response>> {
        const nodeUrl = this.getNodeUrl(url, RemoveUserCommand.url, port);

        try {
            const response = await this.axiosInstance.post<RemoveUserCommand.Response>(
                nodeUrl,
                data,
                {
                    timeout: 20_000,
                },
            );

            return {
                isOk: true,
                response: response.data,
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                this.logger.error('Error in deleteUser:', error.response?.data);
            } else {
                this.logger.error('Error in deleteUser:', error);
            }

            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }

    public async getInboundUsers(
        data: GetInboundUsersCommand.Request,
        url: string,
        port: null | number,
    ): Promise<ICommandResponse<GetInboundUsersCommand.Response>> {
        const nodeUrl = this.getNodeUrl(url, GetInboundUsersCommand.url, port);

        try {
            const response = await this.axiosInstance.post<GetInboundUsersCommand.Response>(
                nodeUrl,
                data,
            );

            return {
                isOk: true,
                response: response.data,
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                this.logger.error('Error in getInboundUsers:', error.response?.data);
            } else {
                this.logger.error('Error in getInboundUsers:', error);
            }

            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }

    public async getInboundUsersCount(
        data: GetInboundUsersCountCommand.Request,
        url: string,
        port: null | number,
    ): Promise<ICommandResponse<GetInboundUsersCountCommand.Response>> {
        const nodeUrl = this.getNodeUrl(url, GetInboundUsersCountCommand.url, port);

        try {
            const response = await this.axiosInstance.post<GetInboundUsersCountCommand.Response>(
                nodeUrl,
                data,
            );

            return {
                isOk: true,
                response: response.data,
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                this.logger.error('Error in getInboundUsersCount:', error.response?.data);
            } else {
                this.logger.error('Error in getInboundUsersCount:', error);
            }

            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        }
    }
}
