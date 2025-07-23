export const OAUTH2_PROVIDERS = {
    GITHUB: 'github',
    POCKETID: 'pocketid',
    YANDEX: 'yandex',
} as const;

export type TOAuth2Providers = [keyof typeof OAUTH2_PROVIDERS][number];
export type TOAuth2ProvidersKeys = (typeof OAUTH2_PROVIDERS)[keyof typeof OAUTH2_PROVIDERS];
export const OAUTH2_PROVIDERS_VALUES = Object.values(OAUTH2_PROVIDERS);
