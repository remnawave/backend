import { Injectable, Logger } from '@nestjs/common';

import { StreamSettingsObject } from '@common/helpers/xray-config/interfaces/transport.config';

import { IFormattedHost } from './interfaces/formatted-hosts.interface';

interface XrayShadowsocksLink {
    address: string;
    method: string;
    password: string;
    port: number;
    remark: string;
}

const NETWORK_CONFIGS: Record<
    StreamSettingsObject['network'],
    (params: IFormattedHost) => Partial<Record<string, unknown>>
> = {
    ws: (params) => ({
        path: params.path,
        host: params.host,
    }),
    tcp: (params) => ({
        path: params.path,
        host: params.host,
    }),
    raw: (params) => ({
        path: params.path,
        host: params.host,
    }),
    xhttp: (params) => ({
        path: params.path,
        host: params.host,
    }),
    httpupgrade: (params) => ({
        path: params.path,
        host: params.host,
    }),
    grpc: (params) => ({
        authority: params.host,
        serviceName: params.path,
    }),
};

@Injectable()
export class XrayGeneratorService {
    private readonly logger = new Logger(XrayGeneratorService.name);

    constructor() {}

    public async generateConfig(
        hosts: IFormattedHost[],
        isBase64: boolean,
        isHapp: boolean,
    ): Promise<string> {
        try {
            const links = this.generateLinks(hosts, isHapp);

            const linksString = links.join('\n');
            if (isBase64) {
                return Buffer.from(linksString).toString('base64');
            } else {
                return linksString;
            }
        } catch (error) {
            this.logger.error('Error generating xray config:', error);
            return '';
        }
    }

    public generateLinks(hosts: IFormattedHost[], isHapp: boolean): string[] {
        const links: string[] = [];

        for (const host of hosts) {
            if (!host) {
                continue;
            }

            const link = this.generateLink(host);

            if (link) {
                if (isHapp && host.serverDescription) {
                    links.push(link + `?serverDescription=${host.serverDescription}`);
                } else {
                    links.push(link);
                }
            }
        }

        return links;
    }

    private generateLink(host: IFormattedHost): string | undefined {
        switch (host.protocol) {
            case 'trojan':
                return this.trojan(host);
            case 'vless':
                return this.vless(host);
            case 'shadowsocks':
                return this.shadowsocks({
                    remark: host.remark,
                    address: host.address,
                    port: host.port,
                    method: 'chacha20-ietf-poly1305',
                    password: host.password.ssPassword,
                });
            default:
                return undefined;
        }
    }

    private trojan(params: IFormattedHost): string {
        const payload: Record<string, unknown> = {
            security: params.tls,
            type: params.network,
            headerType: params.headerType || '',
        };

        const network = params.network || 'tcp';
        if (network in NETWORK_CONFIGS) {
            Object.assign(
                payload,
                NETWORK_CONFIGS[network as StreamSettingsObject['network']](params),
            );
        }

        if (params.network === 'xhttp') {
            Object.assign(payload, {
                path: params.path,
                host: params.host,
                mode: params.additionalParams?.mode || 'auto',
            });

            if (params.xHttpExtraParams !== null && params.xHttpExtraParams !== undefined) {
                Object.assign(payload, {
                    extra: JSON.stringify(params.xHttpExtraParams),
                });
            }
        }

        if (params.network === 'ws') {
            if (params.additionalParams?.heartbeatPeriod) {
                Object.assign(payload, {
                    heartbeatPeriod: params.additionalParams?.heartbeatPeriod,
                });
            }
        }

        if (params.network === 'grpc') {
            Object.assign(payload, {
                mode: params.additionalParams?.grpcMultiMode ? 'multi' : 'gun',
            });
        }

        const tlsParams: Record<string, unknown> = {};

        if (params.tls === 'tls') {
            Object.assign(tlsParams, {
                sni: params.sni,
                fp: params.fingerprint,
                ...(params.alpn && { alpn: params.alpn }),
            });
            if (params.allowInsecure) {
                tlsParams.allowInsecure = 1;
            }
        } else if (params.tls === 'reality') {
            Object.assign(tlsParams, {
                sni: params.sni,
                fp: params.fingerprint,
                pbk: params.publicKey,
                sid: params.shortId,
                pqv: params.mldsa65Verify,
                ...(params.spiderX && { spx: params.spiderX }),
            });
        }

        Object.assign(payload, tlsParams);

        const stringPayload = this.convertPayloadToString(payload);
        return `trojan://${encodeURIComponent(params.password.trojanPassword)}@${params.address}:${params.port}?${new URLSearchParams(stringPayload).toString()}#${encodeURIComponent(params.remark)}`;
    }

    private vless(params: IFormattedHost): string {
        const payload: Record<string, unknown> = {
            security: params.tls,
            type: params.network,
            headerType: params.headerType || '',
        };

        const network = params.network;
        if (network in NETWORK_CONFIGS) {
            Object.assign(
                payload,
                NETWORK_CONFIGS[network as StreamSettingsObject['network']](params),
            );
        }

        if (params.flow !== undefined) {
            Object.assign(payload, {
                flow: params.flow,
            });
        }

        if (params.network === 'xhttp') {
            Object.assign(payload, {
                path: params.path,
                host: params.host,
                mode: params.additionalParams?.mode || 'auto',
            });

            if (params.xHttpExtraParams !== null && params.xHttpExtraParams !== undefined) {
                Object.assign(payload, {
                    extra: JSON.stringify(params.xHttpExtraParams),
                });
            }
        }

        if (params.network === 'ws') {
            if (params.additionalParams?.heartbeatPeriod) {
                Object.assign(payload, {
                    heartbeatPeriod: params.additionalParams?.heartbeatPeriod,
                });
            }
        }

        if (params.network === 'grpc') {
            Object.assign(payload, {
                mode: params.additionalParams?.grpcMultiMode ? 'multi' : 'gun',
            });
        }

        const tlsParams: Record<string, unknown> = {};

        if (params.tls === 'tls') {
            Object.assign(tlsParams, {
                sni: params.sni,
                fp: params.fingerprint,
                ...(params.alpn && { alpn: params.alpn }),
            });
            if (params.allowInsecure) {
                tlsParams.allowInsecure = 1;
            }
        } else if (params.tls === 'reality') {
            Object.assign(tlsParams, {
                sni: params.sni,
                fp: params.fingerprint,
                pbk: params.publicKey,
                sid: params.shortId,
                pqv: params.mldsa65Verify,
                ...(params.spiderX && { spx: params.spiderX }),
            });
        }

        Object.assign(payload, tlsParams);

        if (params.encryption) {
            Object.assign(payload, {
                encryption: params.encryption,
            });
        }

        const stringPayload = this.convertPayloadToString(payload);
        return `vless://${params.password.vlessPassword}@${params.address}:${params.port}?${new URLSearchParams(stringPayload).toString()}#${encodeURIComponent(params.remark)}`;
    }

    private shadowsocks(params: XrayShadowsocksLink): string {
        const base64Credentials = Buffer.from(`${params.method}:${params.password}`).toString(
            'base64',
        );

        const encodedRemark = encodeURIComponent(params.remark);

        return `ss://${base64Credentials}@${params.address}:${params.port}#${encodedRemark}`;
    }

    private convertPayloadToString(payload: Record<string, unknown>): Record<string, string> {
        return Object.fromEntries(
            Object.entries(payload)
                /* eslint-disable @typescript-eslint/no-unused-vars */
                .filter(([_, v]) => v !== undefined)
                .map(([k, v]) => [k, String(v)]),
        );
    }
}
