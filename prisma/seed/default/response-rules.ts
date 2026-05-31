// prev: 4761b7f5422b0e47df79e2208805f958472a680431f149ddfc1ad716d3f4d74d

export const PREV_SRR_CONFIG_HASH =
    '4761b7f5422b0e47df79e2208805f958472a680431f149ddfc1ad716d3f4d74d';

export const SRR_DEFAULT_CONFIG = {
    version: '1',
    rules: [
        {
            name: 'Browser Subscription',
            description: 'System critical: do not delete or disable this rule.',
            enabled: true,
            operator: 'AND',
            conditions: [
                {
                    headerName: 'accept',
                    operator: 'CONTAINS',
                    value: 'text/html',
                    caseSensitive: true,
                },
            ],
            responseType: 'BROWSER',
        },
        {
            name: 'Mihomo Clients',
            description: 'Response with generated YAML config (Mihomo Template)',
            enabled: true,
            operator: 'AND',
            conditions: [
                {
                    headerName: 'user-agent',
                    operator: 'REGEX',
                    value: '^(?:FlClash|FlClashX|Flowvy|[Cc]lash-[Vv]erge|[Kk]oala-[Cc]lash|[Cc]lash-?[Mm]eta|[Mm]urge|[Cc]lashX [Mm]eta|[Mm]ihomo|[Cc]lash-nyanpasu|clash.meta|prizrak-box)',
                    caseSensitive: false,
                },
            ],
            responseType: 'MIHOMO',
        },
        {
            name: 'Stash (iOS, macOS)',
            description: 'Response with generated YAML config (Stash Template)',
            enabled: true,
            operator: 'AND',
            conditions: [
                {
                    headerName: 'user-agent',
                    operator: 'REGEX',
                    value: '^stash',
                    caseSensitive: false,
                },
            ],
            responseType: 'STASH',
        },
        {
            name: 'Sing-box clients',
            description: 'Resonse with generated JSON config (Singbox template)',
            enabled: true,
            operator: 'AND',
            conditions: [
                {
                    headerName: 'user-agent',
                    operator: 'REGEX',
                    value: '^sfa|sfi|sfm|sft|karing|singbox',
                    caseSensitive: false,
                },
            ],
            responseType: 'SINGBOX',
        },
        {
            name: 'Clash Core Clients',
            description: 'Response with generated YAML config (Clash Template)',
            enabled: true,
            operator: 'AND',
            conditions: [
                {
                    headerName: 'user-agent',
                    operator: 'REGEX',
                    value: '^clash',
                    caseSensitive: false,
                },
            ],
            responseType: 'CLASH',
        },
        {
            name: 'Surge Clients',
            description: 'Response with generated Surge config (Surge Template)',
            enabled: true,
            operator: 'AND',
            conditions: [
                {
                    headerName: 'user-agent',
                    operator: 'REGEX',
                    value: '^Surge',
                    caseSensitive: false,
                },
            ],
            responseType: 'SURGE',
        },
        {
            name: 'Fallback Base64',
            description: 'System critical: do not delete or disable this rule.',
            enabled: true,
            operator: 'AND',
            conditions: [],
            responseType: 'XRAY_BASE64',
        },
    ],
};
