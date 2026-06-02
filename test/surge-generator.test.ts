import { SurgeGeneratorService } from '@modules/subscription-template/generators/surge.generator.service';
import { ResolvedProxyConfig } from '@modules/subscription-template/resolve-proxy/interfaces';

function assertIncludes(actual: string, expected: string): void {
    if (!actual.includes(expected)) {
        throw new Error(`Expected output to include: ${expected}\nActual:\n${actual}`);
    }
}

function assertNotIncludes(actual: string, expected: string): void {
    if (actual.includes(expected)) {
        throw new Error(`Expected output not to include: ${expected}\nActual:\n${actual}`);
    }
}

function baseHost(overrides: Partial<ResolvedProxyConfig>): ResolvedProxyConfig {
    return {
        finalRemark: 'trojan-node',
        address: 'example.com',
        port: 443,
        protocol: 'trojan',
        protocolOptions: {
            password: 'secret',
        },
        transport: 'ws',
        transportOptions: {
            path: '/ws',
            host: 'edge.example.com',
            headers: null,
            heartbeatPeriod: null,
        },
        security: 'tls',
        securityOptions: {
            allowInsecure: true,
            alpn: null,
            echConfigList: null,
            echForceQuery: null,
            enableSessionResumption: false,
            fingerprint: null,
            serverName: 'sni.example.com',
        },
        streamOverrides: {
            finalMask: null,
            sockopt: null,
        },
        mux: null,
        clientOverrides: {
            shuffleHost: false,
            mihomoX25519: false,
            serverDescription: null,
            xrayJsonTemplate: null,
        },
        metadata: {
            uuid: 'host-uuid',
            tag: null,
            excludeFromSubscriptionTypes: [],
            inboundTag: 'inbound',
            configProfileUuid: null,
            configProfileInboundUuid: null,
            isDisabled: false,
            isHidden: false,
            viewPosition: 0,
            remark: 'trojan-node',
            vlessRouteId: null,
            rawInbound: null,
        },
        ...overrides,
    } as ResolvedProxyConfig;
}

void (async () => {
    const templateService = {
        getCachedTemplateByType: async (type: string) => {
            if (type !== 'SURGE') {
                throw new Error(`Expected SURGE template lookup, got ${type}`);
            }

            return `[Proxy]
#!remnawave-proxies

[Proxy Group]
Remnawave = select, #!remnawave-proxy-names

[Rule]
FINAL,Remnawave
`;
        },
    };

    const generator = new SurgeGeneratorService(templateService as never);
    const subscription = await generator.generateConfig([
        baseHost({}),
        baseHost({
            finalRemark: 'ss-node',
            protocol: 'shadowsocks',
            protocolOptions: {
                method: 'chacha20-ietf-poly1305',
                password: 'ss-secret',
                uot: false,
                uotVersion: 1,
            },
            transport: 'tcp',
            transportOptions: {
                header: null,
            },
            security: 'none',
        }),
        baseHost({
            finalRemark: 'vless-node',
            protocol: 'vless',
            protocolOptions: {
                encryption: 'none',
                flow: '' as never,
                id: '00000000-0000-0000-0000-000000000000',
            },
        }),
        baseHost({
            finalRemark: 'httpupgrade-node',
            transport: 'httpupgrade',
            transportOptions: {
                path: '/upgrade',
                host: 'upgrade.example.com',
                headers: null,
            },
        }),
    ]);

    assertIncludes(subscription, 'trojan-node = trojan, example.com, 443');
    assertIncludes(subscription, 'password=secret');
    assertIncludes(subscription, 'ws=true');
    assertIncludes(subscription, 'ws-path=/ws');
    assertIncludes(subscription, 'ws-headers=Host:edge.example.com');
    assertIncludes(subscription, 'skip-cert-verify=true');
    assertIncludes(subscription, 'sni=sni.example.com');
    assertIncludes(subscription, 'always-real-ip = example.com');
    assertIncludes(
        subscription,
        'ss-node = ss, example.com, 443, encrypt-method=chacha20-ietf-poly1305, password=ss-secret, udp-relay=true',
    );
    assertIncludes(subscription, 'Remnawave = select, trojan-node, ss-node, DIRECT');
    assertNotIncludes(subscription, 'vless-node');
    assertNotIncludes(subscription, 'httpupgrade-node');
})();
