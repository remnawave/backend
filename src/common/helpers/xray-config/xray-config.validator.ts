import { createPublicKey, createPrivateKey, KeyObject } from 'node:crypto';
import { hasher } from 'node-object-hash';
import { readFileSync } from 'node:fs';

import { HashedSet } from '@remnawave/hashed-set';

import { getVlessFlow } from '@common/utils/flow/get-vless-flow';

import { UserForConfigEntity } from '@modules/users/entities/users-for-config';

import {
    CertificateObject as Certificate,
    InboundObject as Inbound,
    InboundSettings,
    IXrayConfig,
    ShadowsocksSettings,
    TCtrXRayConfig,
    TrojanSettings,
    VLessSettings,
} from './interfaces';

interface InboundsWithTagsAndType {
    tag: string;
    type: string;
    network: string | null;
    security: string | null;
    port: number | null;
    rawInbound: object | null;
}

export class XRayConfig {
    private config: IXrayConfig;
    private inbounds: Inbound[] = [];
    private inboundsByProtocol: Record<string, Inbound[]> = {};
    private inboundsByTag: Record<string, Inbound> = {};
    private readonly CONFIG_KEY_ORDER = [
        'log',
        'api',
        'dns',
        'inbounds',
        'outbounds',
        'routing',
        'policy',
        'transport',
        'stats',
        'reverse',
        'fakedns',
        'metrics',
        'observatory',
        'burstObservatory',
    ];

    constructor(configInput: TCtrXRayConfig) {
        this.config = this.prevValidateConfig(configInput);
        this.validate();
        this.resolveInbounds();
    }

    private prevValidateConfig(configInput: TCtrXRayConfig): IXrayConfig {
        let config: IXrayConfig | undefined;

        if (typeof configInput === 'string') {
            try {
                config = JSON.parse(configInput) as IXrayConfig;
            } catch (error) {
                throw new Error(`Invalid JSON input or file path: ${error}`);
            }
        } else if (typeof configInput === 'object') {
            config = configInput as IXrayConfig;
        } else {
            throw new Error('Invalid configuration format.');
        }

        return config;
    }

    private validate(): void {
        if (!this.config.inbounds || this.config.inbounds.length === 0) {
            throw new Error("Config doesn't have inbounds.");
        }

        const seenTags = new Set<string>();
        for (const inbound of this.config.inbounds) {
            const network = inbound.streamSettings?.network;

            if (
                network &&
                !['grpc', 'httpupgrade', 'raw', 'tcp', 'ws', 'xhttp'].includes(network)
            ) {
                throw new Error(
                    `Invalid network type "${network}" in inbound "${inbound.tag}". Allowed values are: raw (or tcp), ws, httpupgrade, xhttp and grpc`,
                );
            }

            if (
                ![
                    'dokodemo-door',
                    'http',
                    'mixed',
                    'shadowsocks',
                    'trojan',
                    'vless',
                    'wireguard',
                ].includes(inbound.protocol)
            ) {
                throw new Error(
                    `Invalid protocol in inbound "${inbound.tag}". Allowed values are: shadowsocks, trojan, vless, dokodemo-door, http, mixed, wireguard`,
                );
            }

            // console.log(`Inbound ${inbound.tag} network: ${network || 'not set'}`);

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
    }

    private resolveInbounds(): void {
        for (const inbound of this.config.inbounds) {
            const settings: Inbound = {
                ...inbound,
                tag: inbound.tag,
                protocol: inbound.protocol,
            };

            this.inbounds.push(settings);
            this.inboundsByTag[inbound.tag] = settings;
            if (!this.inboundsByProtocol[settings.protocol]) {
                this.inboundsByProtocol[settings.protocol] = [];
            }
            this.inboundsByProtocol[settings.protocol!].push(settings);
        }
    }

    public static getXrayConfigInstance(config: TCtrXRayConfig): XRayConfig {
        return new XRayConfig(config);
    }

    public getInbound(tag: string): Inbound | undefined {
        return this.config.inbounds.find((inbound) => inbound.tag === tag);
    }

    public excludeInbounds(tags: string[]): void {
        this.config.inbounds = this.config.inbounds.filter(
            (inbound) => !tags.includes(inbound.tag),
        );
    }

    public leaveInbounds(tags: Set<string>): void {
        this.config.inbounds = this.config.inbounds.filter(
            (inbound) => tags.has(inbound.tag) || !this.isInboundWithUsers(inbound.protocol),
        );
    }

    private getInbounds(): Inbound[] {
        return this.inbounds;
    }

    public getConfig(): IXrayConfig {
        return this.config;
    }

    private getInboundByProtocol(protocol: string): Inbound[] {
        return this.inboundsByProtocol[protocol] || [];
    }

    private toJSON(): string {
        return JSON.stringify(this.config, null, 2);
    }

    private sortObjectByKeys<T extends IXrayConfig>(obj: T): T {
        const sortedObj = {} as Record<string, unknown>;

        for (const key of this.CONFIG_KEY_ORDER) {
            if (key in obj) {
                sortedObj[key] = obj[key as keyof T];
            }
        }

        for (const key in obj) {
            if (!(key in sortedObj)) {
                sortedObj[key] = obj[key];
            }
        }

        return sortedObj as T;
    }

    public processCertificates(): IXrayConfig {
        const config = this.config;

        for (const inbound of config.inbounds) {
            const tlsSettings = inbound?.streamSettings?.tlsSettings;
            if (!tlsSettings?.certificates) continue;

            tlsSettings.certificates = tlsSettings.certificates.map((cert: Certificate) => {
                try {
                    const newCert = { ...cert };

                    if (newCert.certificateFile) {
                        const certContent = readFileSync(newCert.certificateFile, 'utf-8')
                            .replace(/\r\n/g, '\n')
                            .split('\n')
                            .filter((line) => line);
                        newCert.certificate = certContent;
                        delete newCert.certificateFile;
                    }

                    if (newCert.keyFile) {
                        const keyContent = readFileSync(newCert.keyFile, 'utf-8')
                            .replace(/\r\n/g, '\n')
                            .split('\n')
                            .filter((line) => line);
                        newCert.key = keyContent;
                        delete newCert.keyFile;
                    }

                    return newCert;
                } catch {
                    // console.error(
                    //     `Failed to read certificate files for inbound ${inbound.tag}:`,
                    //     error,
                    // );
                    return cert;
                }
            });
        }

        return config;
    }

    public getConfigHash(): string {
        const hash = hasher({
            trim: true,
            sort: false,
            // sort: {
            //     array: true,
            //     object: true,
            // },
        }).hash;

        return hash(this.getSortedConfig());
    }

    public getAllInbounds(): InboundsWithTagsAndType[] {
        return this.inbounds
            .filter((inbound) => this.isInboundWithUsers(inbound.protocol))
            .map((inbound) => ({
                tag: inbound.tag,
                rawInbound: inbound as unknown as object,
                type: inbound.protocol,
                network: inbound.streamSettings?.network ?? null,
                security: inbound.streamSettings?.security ?? null,
                port: this.getPort(inbound.port),
            }));
    }

    public cleanClients(): void {
        for (const inbound of this.config.inbounds) {
            switch (inbound.protocol) {
                case 'trojan':
                    (inbound.settings as TrojanSettings).clients = [];
                    break;
                case 'vless':
                    (inbound.settings as VLessSettings).clients = [];
                    break;
                case 'shadowsocks':
                    (inbound.settings as ShadowsocksSettings).clients = [];
                    break;
                default:
                    break;
            }
        }
    }

    public fixIncorrectServerNames(): void {
        for (const inbound of this.config.inbounds) {
            const realitySettings =
                inbound.protocol === 'vless' ? inbound.streamSettings?.realitySettings : null;

            if (!realitySettings?.serverNames?.length) {
                continue;
            }

            realitySettings.serverNames = [
                ...new Set(
                    realitySettings.serverNames.flatMap((name) =>
                        name.split(',').map((part) => part.trim()),
                    ),
                ),
            ];
        }
    }

    public getSortedConfig(): IXrayConfig {
        return this.sortObjectByKeys<IXrayConfig>(this.config);
    }

    private getPort(port: number | string | undefined): number | null {
        if (!port) {
            return null;
        }
        if (typeof port === 'string') {
            if (port.includes(',')) {
                return Number(port.split(',')[0]);
            }
            return Number(port);
        }

        return port;
    }

    public cleanInboundClients(): void {
        for (const inbound of this.config.inbounds) {
            switch (inbound.protocol) {
                case 'trojan':
                    (inbound.settings as TrojanSettings).clients = [];
                    break;
                case 'vless':
                    (inbound.settings as VLessSettings).clients = [];
                    break;
                case 'shadowsocks':
                    (inbound.settings as ShadowsocksSettings).clients = [];
                    break;
                default:
                    break;
            }
        }
    }

    private addUsersToInbound(inbound: Inbound, users: UserForConfigEntity[]): void {
        switch (inbound.protocol) {
            case 'trojan':
                (inbound.settings as TrojanSettings).clients ??= [];
                for (const user of users) {
                    (inbound.settings as TrojanSettings).clients.push({
                        password: user.trojanPassword,
                        email: user.tId.toString(),
                        id: user.vlessUuid,
                    });
                }
                break;
            case 'vless':
                (inbound.settings as VLessSettings).clients ??= [];
                for (const user of users) {
                    (inbound.settings as VLessSettings).clients.push({
                        id: user.vlessUuid,
                        email: user.tId.toString(),
                        flow: getVlessFlow(inbound),
                    });
                }
                break;
            case 'shadowsocks':
                (inbound.settings as ShadowsocksSettings).clients ??= [];
                for (const user of users) {
                    (inbound.settings as ShadowsocksSettings).clients.push({
                        password: user.ssPassword,
                        method: 'chacha20-ietf-poly1305',
                        email: user.tId.toString(),
                        id: user.vlessUuid,
                    });
                }
                break;
            default:
                throw new Error(`Protocol ${inbound.protocol} is not supported.`);
        }
    }

    public includeUserBatch(
        users: UserForConfigEntity[],
        inboundsUserSets: Map<string, HashedSet>,
    ): IXrayConfig {
        const usersByTag = new Map<string, UserForConfigEntity[]>();
        for (const user of users) {
            for (const tag of user.tags) {
                if (!usersByTag.has(tag)) {
                    usersByTag.set(tag, []);
                }
                usersByTag.get(tag)!.push(user);

                if (!inboundsUserSets.has(tag)) {
                    inboundsUserSets.set(tag, new HashedSet());
                }

                inboundsUserSets.get(tag)!.add(user.vlessUuid);
            }
        }

        const inboundMap = new Map(
            this.config.inbounds
                .filter((inbound) => this.isInboundWithUsers(inbound.protocol))
                .map((inbound) => [inbound.tag, inbound]),
        );

        for (const [tag, tagUsers] of usersByTag) {
            const inbound = inboundMap.get(tag);
            if (!inbound) continue;

            inbound.settings ??= {} as InboundSettings;

            this.addUsersToInbound(inbound, tagUsers);
        }

        usersByTag.clear();

        return this.config;
    }

    public async resolveInboundAndPublicKey(): Promise<Map<string, string>> {
        const publicKeyMap = new Map<string, string>();

        for (const inbound of this.config.inbounds) {
            if (['dokodemo-door', 'http', 'mixed', 'wireguard'].includes(inbound.protocol)) {
                continue;
            }

            if (inbound.streamSettings?.realitySettings) {
                if (inbound.streamSettings.realitySettings.privateKey) {
                    try {
                        const { publicKey: jwkPublicKey } =
                            await this.createX25519KeyPairFromBase64(
                                inbound.streamSettings.realitySettings.privateKey,
                            );

                        const publicKeyJwk = jwkPublicKey.export({ format: 'jwk' });

                        if (!publicKeyJwk) {
                            continue;
                        }

                        const pubKeyRaw = publicKeyJwk.x;

                        if (!pubKeyRaw) {
                            continue;
                        }

                        publicKeyMap.set(inbound.tag, pubKeyRaw);
                    } catch {
                        continue;
                    }
                }
            }
        }

        return publicKeyMap;
    }

    private async createX25519KeyPairFromBase64(base64PrivateKey: string): Promise<{
        publicKey: KeyObject;
        privateKey: KeyObject;
    }> {
        return new Promise((resolve, reject) => {
            try {
                const rawPrivateKey = Buffer.from(base64PrivateKey, 'base64');

                const jwkPrivateKey = {
                    kty: 'OKP',
                    crv: 'X25519',
                    d: Buffer.from(rawPrivateKey).toString('base64url'),
                    x: '',
                };

                const privateKey = createPrivateKey({
                    key: jwkPrivateKey,
                    format: 'jwk',
                });

                const publicKey = createPublicKey(privateKey);

                resolve({ publicKey, privateKey });
            } catch (error) {
                reject(error);
            }
        });
    }

    private isInboundWithUsers(protocol: string): boolean {
        return !['dokodemo-door', 'http', 'mixed', 'wireguard'].includes(protocol);
    }

    public replaceSnippets(snippets: Map<string, unknown>): void {
        if (this.config.outbounds) {
            this.replaceSnippetsInArray(this.config.outbounds as any[], snippets);
        }
        if (this.config.routing) {
            if (typeof this.config.routing === 'object' && 'rules' in this.config.routing) {
                this.replaceSnippetsInArray(this.config.routing.rules as any[], snippets);
            }
        }
    }

    private replaceSnippetsInArray = (array: any[], snippetsMap: Map<string, unknown>): void => {
        for (let i = array.length - 1; i >= 0; i--) {
            const item = array[i];

            if (item.snippet) {
                const snippet = snippetsMap.get(item.snippet);

                if (snippet) {
                    if (Array.isArray(snippet)) {
                        array.splice(i, 1, ...snippet);
                    } else {
                        array[i] = snippet;
                    }
                } else {
                    array.splice(i, 1);
                }
            }
        }
    };
}
