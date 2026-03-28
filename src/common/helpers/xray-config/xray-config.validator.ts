import {
    BalancingRule,
    InboundConfig,
    RoutingRule,
    ShadowsocksInboundConfig,
    sortXrayConfig,
    TLSCertConfig,
    TrojanInboundConfig,
    VLessInboundConfig,
    XrayConfig,
} from 'xray-typed';
import { hasher } from 'node-object-hash';
import { readFileSync } from 'node:fs';

import { HashedSet } from '@remnawave/hashed-set';

import { getVlessFlow } from '@common/utils/flow/get-vless-flow';

import { UserForConfigEntity } from '@modules/users/entities/users-for-config';

import { getSsPassword, isSS2022MethodFromMethod, SHADOWSOCKS_METHODS } from './ss-cipher';

const MANAGED_CLIENT_PROTOCOLS = new Set(['hysteria', 'shadowsocks', 'trojan', 'vless']);
type ManagedInboundSettings = VLessInboundConfig | TrojanInboundConfig | ShadowsocksInboundConfig;

const ALLOWED_PROTOCOLS = new Set([
    'dokodemo-door',
    'http',
    'hysteria',
    'mixed',
    'shadowsocks',
    'trojan',
    'tunnel',
    'vless',
    'wireguard',
]);

const ALLOWED_NETWORKS = new Set([
    'grpc',
    'httpupgrade',
    'hysteria',
    'kcp',
    'raw',
    'tcp',
    'ws',
    'xhttp',
]);

interface InboundsWithTagsAndType {
    tag: string;
    type: string;
    network: string | null;
    security: string | null;
    port: number | null;
    rawInbound: object | null;
}

type TCtrXRayConfig = object | Record<string, unknown> | string;

export class XRayConfig {
    private config: XrayConfig;
    private inbounds: InboundConfig[] = [];
    private inboundsByTag: Record<string, InboundConfig> = {};

    constructor(configInput: TCtrXRayConfig) {
        this.config = this.parseConfig(configInput);
        this.validate();
        this.indexInbounds();
    }

    public getConfig(): XrayConfig {
        return this.config;
    }

    public getSortedConfig(): XrayConfig {
        return sortXrayConfig(this.config);
    }

    public getConfigHash(): string {
        const hash = hasher({ trim: true, sort: false }).hash;
        return hash(this.getSortedConfig());
    }

    public getInbound(tag: string): InboundConfig | undefined {
        return this.inboundsByTag[tag];
    }

    public getAllInbounds(): InboundsWithTagsAndType[] {
        return this.inbounds
            .filter((inbound) => this.hasManagedClients(inbound))
            .map((inbound) => ({
                tag: inbound.tag!,
                rawInbound: inbound as unknown as object,
                type: inbound.protocol,
                network: inbound.streamSettings?.network ?? null,
                security: inbound.streamSettings?.security ?? null,
                port: this.parsePort(inbound.port),
            }));
    }

    public excludeInbounds(tags: string[]): void {
        const tagSet = new Set(tags);
        this.config.inbounds = this.config.inbounds!.filter((inbound) => !tagSet.has(inbound.tag!));
    }

    public leaveInbounds(tags: Set<string>): void {
        this.config.inbounds = this.config.inbounds!.filter(
            (inbound) => tags.has(inbound.tag!) || !this.hasManagedClients(inbound),
        );
    }

    public processCertificates(): XrayConfig {
        if (!this.config.inbounds) return this.config;

        for (const inbound of this.config.inbounds) {
            const certs = inbound.streamSettings?.tlsSettings?.certificates;
            if (!certs) continue;

            inbound.streamSettings!.tlsSettings!.certificates = certs.map((cert) =>
                this.resolveCertificate(cert),
            );
        }

        return this.config;
    }

    private resolveCertificate(cert: TLSCertConfig): TLSCertConfig {
        try {
            const resolved = { ...cert };

            if (resolved.certificateFile) {
                resolved.certificate = this.readPemLines(resolved.certificateFile);
                delete resolved.certificateFile;
            }

            if (resolved.keyFile) {
                resolved.key = this.readPemLines(resolved.keyFile);
                delete resolved.keyFile;
            }

            return resolved;
        } catch {
            return cert;
        }
    }

    private readPemLines(filePath: string): string[] {
        return readFileSync(filePath, 'utf-8')
            .replace(/\r\n/g, '\n')
            .split('\n')
            .filter((line) => line);
    }

    private hasManagedClients(inbound: InboundConfig): inbound is {
        settings: ManagedInboundSettings;
    } & InboundConfig {
        return MANAGED_CLIENT_PROTOCOLS.has(inbound.protocol);
    }

    public cleanInboundClients(injectFlow: boolean): void {
        if (!this.config.inbounds) return;

        for (const inbound of this.config.inbounds) {
            if (!this.hasManagedClients(inbound)) continue;

            this.ensureSettings(inbound);
            inbound.settings!.clients = [];

            if (injectFlow && inbound.protocol === 'vless') {
                inbound.settings!.flow = getVlessFlow(inbound);
            }
        }
    }

    public includeUserBatch(
        users: UserForConfigEntity[],
        inboundsUserSets: Map<string, HashedSet>,
    ): XrayConfig {
        if (!this.config.inbounds) return this.config;

        const usersByTag = this.groupUsersByTag(users, inboundsUserSets);

        const inboundMap = new Map(
            this.config.inbounds
                .filter((inbound) => this.hasManagedClients(inbound))
                .map((inbound) => [inbound.tag, inbound]),
        );

        for (const [tag, tagUsers] of usersByTag) {
            const inbound = inboundMap.get(tag);
            if (!inbound) continue;

            this.ensureSettings(inbound);
            this.addUsersToInbound(inbound, tagUsers);
        }

        return this.config;
    }

    private groupUsersByTag(
        users: UserForConfigEntity[],
        inboundsUserSets: Map<string, HashedSet>,
    ): Map<string, UserForConfigEntity[]> {
        const usersByTag = new Map<string, UserForConfigEntity[]>();

        for (const user of users) {
            for (const tag of user.tags) {
                let tagUsers = usersByTag.get(tag);
                if (!tagUsers) {
                    tagUsers = [];
                    usersByTag.set(tag, tagUsers);
                }
                tagUsers.push(user);

                if (!inboundsUserSets.has(tag)) {
                    inboundsUserSets.set(tag, new HashedSet());
                }
                inboundsUserSets.get(tag)!.add(user.vlessUuid);
            }
        }

        return usersByTag;
    }

    private addUsersToInbound(inbound: InboundConfig, users: UserForConfigEntity[]): void {
        switch (inbound.protocol) {
            case 'trojan':
                if (!inbound.settings) {
                    inbound.settings = {};
                }
                inbound.settings.clients ??= [];
                for (const user of users) {
                    inbound.settings.clients.push({
                        password: user.trojanPassword,
                        email: user.tId.toString(),
                        id: user.vlessUuid,
                    });
                }
                break;

            case 'vless':
                if (!inbound.settings) {
                    inbound.settings = {};
                }
                inbound.settings.clients ??= [];

                for (const user of users) {
                    inbound.settings.clients.push({
                        id: user.vlessUuid,
                        email: user.tId.toString(),
                    });
                }
                break;

            case 'hysteria':
                if (!inbound.settings) {
                    inbound.settings = {};
                }
                inbound.settings.clients ??= [];

                for (const user of users) {
                    inbound.settings.clients.push({
                        id: user.vlessUuid,
                        auth: user.vlessUuid,
                        email: user.tId.toString(),
                    });
                }
                break;

            case 'shadowsocks': {
                if (!inbound.settings) {
                    inbound.settings = {};
                }
                inbound.settings.clients ??= [];

                const method = inbound.settings.method;
                const isSS2022 = isSS2022MethodFromMethod(method);

                for (const user of users) {
                    inbound.settings.clients.push({
                        password: getSsPassword(user.ssPassword, isSS2022),
                        ...(!isSS2022 && { method: method || 'chacha20-ietf-poly1305' }),
                        email: user.tId.toString(),
                        id: user.vlessUuid,
                    });
                }
                break;
            }

            default:
                throw new Error(`Protocol ${inbound.protocol} is not supported.`);
        }
    }

    private ensureSettings(inbound: InboundConfig): void {
        inbound.settings ??= {};
    }

    public fixIncorrectServerNames(): void {
        if (!this.config.inbounds) return;

        for (const inbound of this.config.inbounds) {
            if (inbound.protocol !== 'vless') continue;

            const serverNames = inbound.streamSettings?.realitySettings?.serverNames;
            if (!serverNames || serverNames.length === 0) continue;

            inbound.streamSettings!.realitySettings!.serverNames = [
                ...new Set(
                    serverNames.flatMap((name) => name.split(',').map((part) => part.trim())),
                ),
            ];
        }
    }

    public replaceSnippets(snippets: Map<string, unknown>): void {
        if (this.config.outbounds) {
            this.replaceSnippetsInArray(this.config.outbounds, snippets);
        }

        if (!this.config.routing) return;

        if (this.config.routing.rules) {
            if (this.config.routing.rules) {
                this.replaceSnippetsInArray(this.config.routing.rules, snippets);
            }
            if (this.config.routing.balancers) {
                this.replaceSnippetsInArray(this.config.routing.balancers, snippets);
            }
        }
    }

    private replaceSnippetsInArray(
        array: RoutingRule[] | BalancingRule[] | undefined,
        snippetsMap: Map<string, unknown>,
    ): void {
        if (!array) return;

        for (let i = array.length - 1; i >= 0; i--) {
            const item = array[i];
            if (!item.snippet) continue;

            const snippet = snippetsMap.get(item.snippet as string);

            if (snippet) {
                if (Array.isArray(snippet)) {
                    array.splice(i, 1, ...snippet);
                } else {
                    array[i] = snippet as Record<string, unknown>;
                }
            } else {
                array.splice(i, 1);
            }
        }
    }

    private parseConfig(configInput: TCtrXRayConfig): XrayConfig {
        if (typeof configInput === 'string') {
            try {
                return JSON.parse(configInput) as XrayConfig;
            } catch (error) {
                throw new Error(`Invalid JSON input: ${error}`);
            }
        }

        if (typeof configInput === 'object') {
            return configInput as XrayConfig;
        }

        throw new Error('Invalid configuration format.');
    }

    private validate(): void {
        if (!this.config.inbounds || this.config.inbounds.length === 0) {
            throw new Error("Config doesn't have inbounds.");
        }

        const seenTags = new Set<string>();

        for (const inbound of this.config.inbounds) {
            this.validateNetwork(inbound);
            this.validateProtocol(inbound);
            this.validateTag(inbound, seenTags);
            this.validateShadowsocks(inbound);
        }
    }

    private validateNetwork(inbound: InboundConfig): void {
        const network = inbound.streamSettings?.network;
        if (network && !ALLOWED_NETWORKS.has(network)) {
            throw new Error(
                `Invalid network type "${network}" in inbound "${inbound.tag}". ` +
                    `Allowed values are: ${[...ALLOWED_NETWORKS].join(', ')}.`,
            );
        }
    }

    private validateProtocol(inbound: InboundConfig): void {
        if (inbound.protocol && !ALLOWED_PROTOCOLS.has(inbound.protocol)) {
            throw new Error(
                `Invalid protocol in inbound "${inbound.tag}". ` +
                    `Allowed values are: ${[...ALLOWED_PROTOCOLS].join(', ')}.`,
            );
        }
    }

    private validateTag(inbound: InboundConfig, seenTags: Set<string>): void {
        if (!inbound.tag) {
            throw new Error('All inbounds must have a unique tag.');
        }
        if (inbound.tag.includes(',')) {
            throw new Error("Character ',' is not allowed in inbound tag.");
        }
        if (seenTags.has(inbound.tag)) {
            throw new Error(
                `Duplicate inbound tag "${inbound.tag}" found. All inbound tags must be unique.`,
            );
        }
        seenTags.add(inbound.tag);
    }

    private validateShadowsocks(inbound: InboundConfig): void {
        if (inbound.protocol !== 'shadowsocks') return;

        const settings = inbound.settings;

        if (!settings) {
            throw new Error('Shadowsocks settings are required.');
        }

        const method = settings.method;
        if (!method) return;

        if (!SHADOWSOCKS_METHODS.some((m) => m === method)) {
            throw new Error(
                `Unsupported Shadowsocks method "${method}". ` +
                    `Allowed methods are: ${SHADOWSOCKS_METHODS.join(', ')}.`,
            );
        }

        if (isSS2022MethodFromMethod(method)) {
            if (!settings.password) {
                throw new Error(
                    'Shadowsocks password is required for 2022-blake3-* methods. ' +
                        '(inbound → settings → password – generate with: openssl rand -base64 32)',
                );
            }
            if (settings.password.length < 32) {
                throw new Error(
                    'Shadowsocks password must be at least 32 characters long for 2022-blake3-* methods. ' +
                        '(inbound → settings → password – generate with: openssl rand -base64 32)',
                );
            }
        }
    }

    private indexInbounds(): void {
        for (const inbound of this.config.inbounds!) {
            this.inbounds.push(inbound);
            this.inboundsByTag[inbound.tag!] = inbound;
        }
    }

    private parsePort(port: number | string | undefined): number | null {
        if (!port) return null;

        if (typeof port === 'string') {
            const first = port.includes(',') ? port.split(',')[0] : port;
            return Number(first);
        }

        return port;
    }
}
