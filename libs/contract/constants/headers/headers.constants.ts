export const REMNAWAVE_CLIENT_TYPE_HEADER = 'X-Remnawave-Client-Type';

export const REMNAWAVE_CLIENT_TYPE_BROWSER = 'browser';

export const REMNAWAVE_REAL_IP_HEADER = 'x-remnawave-real-ip';

export const REMNAWAVE_REAL_IP_EMPTY = '0.0.0.0';

export const REMNAWAVE_BYPASS_HTTPS_RESTRCTIONS = {
    'x-forwarded-proto': 'https',
    'x-forwarded-for': '127.0.0.1',
} as const;
