export const EXTENDED_CLIENTS_REGEXES = [
    /^FlClash ?X\//,
    /^Flowvy\//,
    /^prizrak-box\//,
    /^koala-clash\//,
    /^Happ\//,
    /^INCY\//,
] as const;

export function isExtendedClient(userAgent: string): boolean {
    return EXTENDED_CLIENTS_REGEXES.some((client) => client.test(userAgent));
}

export const JSON_SUBSCRIPTION_FALLBACK_CLIENTS = [
    /^[Ss]treisand/,
    /^Happ\//,
    /^INCY\//,
    /^ktor-client/,
    /^V2Box/,
    /^io\.github\.saeeddev94\.xray\//,
    /^v2rayNG\/(\d+\.\d+\.\d+)/,
    /^v2rayN\/(\d+\.\d+\.\d+)/,
] as const;

export function isJsonSubscriptionFallbackSupported(userAgent: string): boolean {
    return JSON_SUBSCRIPTION_FALLBACK_CLIENTS.some((client) => client.test(userAgent));
}
