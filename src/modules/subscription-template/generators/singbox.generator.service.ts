import { Injectable } from '@nestjs/common';

import { SubscriptionTemplateService } from '@modules/subscription-template/subscription-template.service';

import { IFormattedHost } from './interfaces';

interface OutboundConfig {
    flow?: string;
    method?: string;
    multiplex?: any;
    network?: string;
    outbounds?: string[];
    password?: string;
    server: string;
    server_port: number;
    tag: string;
    tls?: any;
    transport?: any;
    type: string;
    uuid?: string;
    headers?: Record<string, unknown>;
    path?: string;
    max_early_data?: number;
    early_data_header_name?: string;
}

interface TlsConfig {
    alpn?: string[];
    enabled?: boolean;
    insecure?: boolean;
    reality?: {
        enabled: boolean;
        public_key?: string;
        short_id?: string;
    };
    server_name?: string;
    utls?: {
        enabled: boolean;
        fingerprint: string;
    };
}

interface TransportConfig {
    early_data_header_name?: string;
    headers?: Record<string, any>;
    host?: string | string[];
    max_early_data?: number;
    path?: string;
    service_name?: string;
    type: string;
}

@Injectable()
export class SingBoxGeneratorService {
    constructor(private readonly subscriptionTemplateService: SubscriptionTemplateService) {}

    public async generateConfig(
        hosts: IFormattedHost[],
        overrideTemplateName?: string,
    ): Promise<string> {
        try {
            const config = await this.subscriptionTemplateService.getCachedTemplateByType(
                'SINGBOX',
                overrideTemplateName,
            );

            const proxy_remarks: string[] = [];

            for (const host of hosts) {
                if (!host) {
                    continue;
                }

                this.addHost(host, config, proxy_remarks);
            }

            return this.renderConfig(config);
        } catch {
            return '';
        }
    }

    private addOutbound(config: Record<string, any>, outbound_data: OutboundConfig): void {
        config.outbounds.push(outbound_data);
    }

    private renderConfig(config: Record<string, any>): string {
        const urltest_types = ['vless', 'trojan', 'shadowsocks'];
        const urltest_tags = config.outbounds
            .filter((outbound: OutboundConfig) => urltest_types.includes(outbound.type))
            .map((outbound: OutboundConfig) => outbound.tag);

        const selector_types = [...urltest_types, 'urltest'];
        const selector_tags = config.outbounds
            .filter((outbound: OutboundConfig) => selector_types.includes(outbound.type))
            .map((outbound: OutboundConfig) => outbound.tag);

        config.outbounds.forEach((outbound: OutboundConfig) => {
            if (outbound.type === 'urltest') {
                outbound.outbounds = urltest_tags;
            }
            if (outbound.type === 'selector') {
                outbound.outbounds = selector_tags;
            }
        });

        return JSON.stringify(config, null, 4);
    }

    private tlsConfig(
        sni?: string,
        fp?: string,
        tls?: string,
        pbk?: string,
        sid?: string,
        alpn?: string | string[],
        allowInsecure?: boolean,
    ): TlsConfig {
        const config: TlsConfig = {};

        if (tls === 'tls' || tls === 'reality') {
            config.enabled = true;
        }

        if (sni) {
            config.server_name = sni;
        }

        if (tls === 'reality') {
            config.reality = { enabled: true };
            if (pbk) {
                config.reality.public_key = pbk;
            }
            if (sid) {
                config.reality.short_id = sid;
            }
        }

        if (fp) {
            config.utls = {
                enabled: Boolean(fp),
                fingerprint: fp,
            };
        }

        if (allowInsecure) {
            config.insecure = allowInsecure;
        }

        if (!fp && tls === 'reality') {
            config.utls = {
                enabled: true,
                fingerprint: 'chrome',
            };
        }

        if (alpn) {
            if (typeof alpn === 'string' && alpn.includes(',')) {
                config.alpn = alpn.split(',').map((a) => a.trim());
            } else {
                config.alpn = Array.isArray(alpn) ? alpn : [alpn];
            }
        }

        return config;
    }

    private wsConfig(
        settings: Record<string, any> | undefined,
        host: string = '',
        path: string = '',
        max_early_data?: number,
        early_data_header_name?: string,
    ): TransportConfig {
        const config = structuredClone(settings?.wsSettings || { headers: {} });

        if (!config.headers) {
            config.headers = {};
        }

        if (path) {
            config.path = path;
        }
        if (host) {
            config.headers.Host = host;
        }

        if (max_early_data !== undefined) {
            config.max_early_data = max_early_data;
        }
        if (early_data_header_name) {
            config.early_data_header_name = early_data_header_name;
        }

        return config;
    }

    private httpUpgradeConfig(
        settings: Record<string, any> | undefined,
        host: string = '',
        path: string = '',
    ): TransportConfig {
        const config = structuredClone(settings?.httpupgradeSettings || { headers: {} });

        if (!config.headers) {
            config.headers = {};
        }

        if (path) {
            config.path = path;
        }
        if (host) {
            config.headers.Host = host;
        }

        return config;
    }

    private transportConfig(
        settings: Record<string, any> | undefined,
        transport_type: string = '',
        host: string = '',
        path: string = '',
        max_early_data?: number,
        early_data_header_name?: string,
    ): TransportConfig {
        let transport_config: TransportConfig = { type: transport_type };

        if (transport_type) {
            switch (transport_type) {
                case 'ws':
                    transport_config = this.wsConfig(
                        settings,
                        host,
                        path,
                        max_early_data,
                        early_data_header_name,
                    );
                    break;
                case 'httpupgrade':
                    transport_config = this.httpUpgradeConfig(settings, host, path);
                    break;
            }
        }

        transport_config.type = transport_type;
        return transport_config;
    }

    private makeOutbound(params: IFormattedHost, settings?: Record<string, any>): OutboundConfig {
        const config: OutboundConfig = {
            type: params.protocol,
            tag: params.remark,
            server: params.address,
            server_port: params.port,
        };

        if (
            ['raw', 'tcp'].includes(params.network) &&
            params.headerType !== 'http' &&
            ['reality', 'tls'].includes(params.tls) &&
            params.protocol === 'vless'
        ) {
            config.flow = 'xtls-rprx-vision';
        }

        if (params.protocol === 'shadowsocks') {
            config.network = 'tcp';
        }

        if (['httpupgrade', 'ws'].includes(params.network)) {
            let max_early_data: number | undefined;
            let early_data_header_name: string | undefined;

            if (params.path.includes('?ed=')) {
                const [pathPart, edPart] = params.path.split('?ed=');
                params.path = pathPart;
                [max_early_data] = edPart.split('/').map(Number);
                early_data_header_name = 'Sec-WebSocket-Protocol';
            }

            config.transport = this.transportConfig(
                settings,
                params.network,
                params.host,
                params.path,
                max_early_data,
                early_data_header_name,
            );
        }

        if (['reality', 'tls'].includes(params.tls)) {
            config.tls = this.tlsConfig(
                params.sni,
                params.fingerprint,
                params.tls,
                params.publicKey,
                params.shortId,
                params.alpn,
                params.allowInsecure,
            );
        }
        return config;
    }

    private addHost(
        host: IFormattedHost,
        config: Record<string, any>,
        proxy_remarks: string[],
    ): void {
        try {
            if (host.network === 'xhttp') {
                return;
            }

            const remark = host.remark;
            proxy_remarks.push(remark);

            const outbound = this.makeOutbound(host);

            switch (host.protocol) {
                case 'vless':
                    outbound.uuid = host.password.vlessPassword;
                    break;
                case 'trojan':
                    outbound.password = host.password.trojanPassword;
                    break;
                case 'shadowsocks':
                    outbound.password = host.password.ssPassword;
                    outbound.method = 'chacha20-ietf-poly1305';
                    break;
            }

            this.addOutbound(config, outbound);
        } catch {
            // silence error
        }
    }
}
