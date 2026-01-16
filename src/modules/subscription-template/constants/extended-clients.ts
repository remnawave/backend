export const MIHOMO_EXTENDED_CLIENTS = [/^FlClash X\//, /^Flowvy\//, /^prizrak-box\//] as const;
export const XRAY_EXTENDED_CLIENTS = [/^Happ\//] as const;

export function isMihomoExtendedClient(userAgent: string): boolean {
    return MIHOMO_EXTENDED_CLIENTS.some((client) => client.test(userAgent));
}

export function isXrayExtendedClient(userAgent: string): boolean {
    return XRAY_EXTENDED_CLIENTS.some((client) => client.test(userAgent));
}

export const JSON_SUBSCRIPTION_FALLBACK_CLIENTS = [
    /^[Ss]treisand/,
    /^Happ\//,
    /^ktor-client/,
    /^V2Box/,
    /^io\.github\.saeeddev94\.xray\//,
    /^v2rayNG\/(\d+\.\d+\.\d+)/,
    /^v2rayN\/(\d+\.\d+\.\d+)/,
] as const;

export function isJsonSubscriptionFallbackSupported(userAgent: string): boolean {
    return JSON_SUBSCRIPTION_FALLBACK_CLIENTS.some((client) => client.test(userAgent));
}
