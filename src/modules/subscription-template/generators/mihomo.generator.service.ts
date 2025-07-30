import yaml from 'yaml';

import { Injectable, Logger } from '@nestjs/common';

import { SubscriptionTemplateService } from '@modules/subscription-template/subscription-template.service';

import { IFormattedHost } from './interfaces/formatted-hosts.interface';

export interface ClashData {
    proxies: ProxyNode[];
    rules: string[];
}

interface NetworkConfig {
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
    'public-key'?: string;
    'short-id'?: string;
}

interface ProxyNode {
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
    'packet-encoding'?: string;
    sni?: string;
    tls?: boolean;
    type: string;
    udp: boolean;
    uuid?: string;
}

@Injectable()
export class MihomoGeneratorService {
    private readonly logger = new Logger(MihomoGeneratorService.name);

    constructor(private readonly subscriptionTemplateService: SubscriptionTemplateService) {}

    async generateConfig(hosts: IFormattedHost[], isStash = false): Promise<string> {
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

            return await this.renderConfig(data, proxyRemarks, isStash);
        } catch (error) {
            this.logger.error('Error generating clash config:', error);
            return '';
        }
    }

    private async renderConfig(
        data: ClashData,
        proxyRemarks: string[],
        isStash: boolean,
    ): Promise<string> {
        const yamlConfigRaw = await this.subscriptionTemplateService.getYamlTemplateByType(
            isStash ? 'STASH' : 'MIHOMO',
        );

        try {
            const yamlConfig = yaml.parse(yamlConfigRaw);

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
            tls: ['reality', 'tls'].includes(host.tls),
            sni: host.sni || '',
            host: host.host,
            path: host.path || '',
            headers: '',
            udp: true,
            alpn: host.alpn,
            publicKey: host.publicKey,
            shortId: host.shortId,
            clientFingerprint: host.fingerprint,
        });

        switch (host.protocol) {
            case 'vless':
                node.uuid = host.password.vlessPassword;
                node['packet-encoding'] = 'xudp';

                if (
                    ['raw', 'tcp'].includes(host.network) &&
                    host.headerType !== 'http' &&
                    ['reality', 'tls'].includes(host.tls)
                ) {
                    node.flow = 'xtls-rprx-vision';
                }

                // if (
                //     ['tcp', 'raw', 'kcp'].includes(host.network) &&
                //     host.headerType !== 'http' &&
                //     inbound.tls !== 'none'
                // ) {
                //     node.flow = settings.flow || '';
                // }
                break;
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
        publicKey?: string;
        shortId?: string;
        clientFingerprint?: string;
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
            publicKey,
            shortId,
            clientFingerprint,
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
            maxEarlyData = parseInt(edPart.split('/')[0]);
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
        }

        if (Object.keys(netOpts).length > 0) {
            node[`${network}-opts`] = netOpts;
        }

        if (publicKey) {
            node['reality-opts'] = {
                'public-key': publicKey,
                'short-id': shortId,
            };
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
}
