import yaml from 'yaml';
import _ from 'lodash';

import { Injectable, Logger } from '@nestjs/common';

import { SubscriptionTemplateService } from '@modules/subscription-template/subscription-template.service';

import { IFormattedHost } from './interfaces/formatted-hosts.interface';

export interface NetworkConfig {
    'early-data-header-name'?: string;
    'grpc-service-name'?: string;
    headers?: Record<string, string>;
    Host?: string;
    host?: string[];
    'max-early-data'?: number;
    path?: string | string[];
    smux?: {
        [key: string]: any;
        enabled: boolean;
    };
    'v2ray-http-upgrade'?: boolean;
    'v2ray-http-upgrade-fast-open'?: boolean;
}

export interface ProxyNode {
    [key: string]: any;
    alpn?: string[];
    alterId?: number;
    cipher?: string;
    name: string;
    network: string;
    password?: string;
    port: number;
    server: string;
    servername?: string;
    'skip-cert-verify'?: boolean;
    sni?: string;
    tls?: boolean;
    type: string;
    udp: boolean;
    uuid?: string;
}

export interface ClashData {
    proxies: ProxyNode[];
    rules: string[];
}

@Injectable()
export class ClashGeneratorService {
    private readonly logger = new Logger(ClashGeneratorService.name);

    constructor(private readonly subscriptionTemplateService: SubscriptionTemplateService) {}

    public async generateConfig(
        hosts: IFormattedHost[],
        overrideTemplateName?: string,
    ): Promise<string> {
        try {
            const data: ClashData = {
                proxies: [],
                rules: [],
            };

            const proxyRemarks: string[] = [];

            for (const host of hosts) {
                if (!host) {
                    continue;
                }
                this.addProxy(host, data, proxyRemarks);
            }

            return await this.renderConfig(data, proxyRemarks, overrideTemplateName);
        } catch (error) {
            this.logger.error('Error generating clash config:', error);
            return '';
        }
    }

    private async renderConfig(
        data: ClashData,
        proxyRemarks: string[],
        overrideTemplateName?: string,
    ): Promise<string> {
        const yamlConfigDb = await this.subscriptionTemplateService.getCachedTemplateByType(
            'CLASH',
            overrideTemplateName,
        );

        const yamlConfig = yamlConfigDb as unknown as any;

        try {
            if (!Array.isArray(yamlConfig.proxies)) {
                yamlConfig.proxies = [];
            }

            if (!Array.isArray(yamlConfig['proxy-groups'])) {
                yamlConfig['proxy-groups'] = [];
            }

            for (const group of yamlConfig['proxy-groups']) {
                if (!Array.isArray(group.proxies)) {
                    group.proxies = [];
                }
            }

            for (const proxy of data.proxies) {
                yamlConfig.proxies.push(proxy);
            }

            for (const group of yamlConfig['proxy-groups']) {
                let remnawaveCustom = undefined;

                if (group?.remnawave) {
                    remnawaveCustom = group.remnawave;

                    delete group.remnawave;
                }

                if (remnawaveCustom && remnawaveCustom['include-proxies'] === false) {
                    continue;
                }

                if (remnawaveCustom && remnawaveCustom['select-random-proxy'] === true) {
                    const randomProxy =
                        proxyRemarks[Math.floor(Math.random() * proxyRemarks.length)];

                    if (randomProxy) {
                        group.proxies.push(randomProxy);
                    }

                    continue;
                }

                if (remnawaveCustom && remnawaveCustom['shuffle-proxies-order'] === true) {
                    const shuffledProxies = _.shuffle(proxyRemarks);

                    for (const proxyRemark of shuffledProxies) {
                        group.proxies.push(proxyRemark);
                    }

                    continue;
                }

                if (Array.isArray(group.proxies)) {
                    for (const proxyRemark of proxyRemarks) {
                        group.proxies.push(proxyRemark);
                    }
                }
            }

            return yaml.stringify(yamlConfig);
        } catch (error) {
            this.logger.error('Error rendering yaml config:', error);
            return '';
        }
    }

    private addProxy(host: IFormattedHost, data: ClashData, proxyRemarks: string[]): void {
        if (host.network === 'xhttp') {
            return;
        }

        const proxyRemark = host.remark;

        const node = this.makeNode({
            name: host.remark,
            remark: proxyRemark,
            type: host.protocol,
            server: host.address,
            port: Number(host.port),
            network: host.network || 'tcp',
            tls: host.tls === 'tls',
            sni: host.sni || '',
            host: host.host,
            path: host.path || '',
            headers: '',
            udp: true,
            alpn: host.alpn,
            clientFingerprint: host.fingerprint,
            allowInsecure: host.allowInsecure,
        });

        switch (host.protocol) {
            case 'trojan':
                node.password = host.password.trojanPassword;
                break;
            case 'shadowsocks':
                node.password = host.password.ssPassword;
                node.cipher = 'chacha20-ietf-poly1305';
                break;
            default:
                return;
        }

        data.proxies.push(node);
        proxyRemarks.push(proxyRemark);
    }

    private makeNode(params: {
        name: string;
        remark: string;
        type: string;
        server: string;
        port: number;
        network: string;
        tls: boolean;
        sni: string;
        host: string;
        path: string;
        headers: string;
        udp: boolean;
        alpn?: string;
        clientFingerprint?: string;
        allowInsecure?: boolean;
    }): ProxyNode {
        const {
            server,
            port,
            remark,
            tls,
            sni,
            alpn,
            udp,
            host,
            path,
            headers,
            clientFingerprint,
            allowInsecure,
        } = params;
        let { type, network } = params;

        if (type === 'shadowsocks') {
            type = 'ss';
        }
        if ((network === 'tcp' || network === 'raw') && headers === 'http') {
            network = 'http';
        }

        let isHttpupgrade = false;
        if (network === 'httpupgrade') {
            network = 'ws';
            isHttpupgrade = true;
        }

        const node: ProxyNode = {
            name: remark,
            type,
            server,
            port,
            network,
            udp,
        };

        let maxEarlyData: number | undefined;
        let earlyDataHeaderName = '';

        let pathValue = path;

        if (path.includes('?ed=')) {
            const [pathPart, edPart] = path.split('?ed=');
            pathValue = pathPart;
            const parsedEd = parseInt(edPart.split('/')[0]);
            maxEarlyData = isNaN(parsedEd) ? undefined : parsedEd;
            earlyDataHeaderName = 'Sec-WebSocket-Protocol';
        }

        if (tls) {
            node.tls = true;
            if (type === 'trojan') {
                node.sni = sni;
            } else {
                node.servername = sni;
            }
            if (alpn) {
                node.alpn = alpn.split(',');
            }
            if (allowInsecure) {
                node['skip-cert-verify'] = allowInsecure;
            }
        }

        let netOpts: NetworkConfig = {};

        switch (network) {
            case 'ws':
                netOpts = this.wsConfig(
                    pathValue,
                    host,
                    maxEarlyData,
                    earlyDataHeaderName,
                    isHttpupgrade,
                );
                break;
            case 'tcp':
            case 'raw':
                netOpts = this.tcpConfig(pathValue, host);
                break;
            case 'grpc':
                netOpts = this.grpcConfig(pathValue);
                break;
        }

        if (Object.keys(netOpts).length > 0) {
            node[`${network}-opts`] = netOpts;
        }

        node['client-fingerprint'] = clientFingerprint || 'chrome';

        return node;
    }

    private wsConfig(
        path = '',
        host = '',
        maxEarlyData?: number,
        earlyDataHeaderName = '',
        isHttpupgrade = false,
    ): NetworkConfig {
        const config: NetworkConfig = {};

        if (path) {
            config.path = path;
        }

        if (host) {
            config.headers = { Host: host };
        } else {
            config.headers = {};
        }

        if (maxEarlyData !== undefined) {
            config['max-early-data'] = maxEarlyData;
        }

        if (earlyDataHeaderName) {
            config['early-data-header-name'] = earlyDataHeaderName;
        }

        if (isHttpupgrade) {
            config['v2ray-http-upgrade'] = true;
            config['v2ray-http-upgrade-fast-open'] = true;
        }

        return config;
    }

    private tcpConfig(path = '', host = ''): NetworkConfig {
        const config: NetworkConfig = {};

        if (!path && !host) {
            return config;
        }

        return config;
    }

    private grpcConfig(path = ''): NetworkConfig {
        const config: NetworkConfig = {};

        config['grpc-service-name'] = path;

        return config;
    }
}
