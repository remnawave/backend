import { RESET_PERIODS_VALUES, USERS_STATUS_VALUES } from '@libs/contracts/constants';
import { TEMPLATE_KEYS, TemplateKeys } from '@libs/contracts/constants/templates/template-keys';

interface TemplateVariableSpec {
    readonly args: readonly string[];
}

export const TEMPLATE_VARIABLES = {
    DAYS_LEFT: { args: [] },
    TRAFFIC_USED: { args: [] },
    TRAFFIC_LEFT: { args: [] },
    STATUS: { args: USERS_STATUS_VALUES },
    TOTAL_TRAFFIC: { args: [] },
    USERNAME: { args: [] },
    EMAIL: { args: [] },
    TELEGRAM_ID: { args: [] },
    SUBSCRIPTION_URL: { args: [] },
    TAG: { args: [] },
    EXPIRE_UNIX: { args: [] },
    SHORT_UUID: { args: [] },
    ID: { args: [] },
    TRAFFIC_USED_BYTES: { args: [] },
    TRAFFIC_LEFT_BYTES: { args: [] },
    TOTAL_TRAFFIC_BYTES: { args: [] },
    RESET_STRATEGY: { args: RESET_PERIODS_VALUES },
    LIFETIME_USED_BYTES: { args: [] },
    CREATED_AT_UNIX: { args: [] },
    LAST_TRAFFIC_RESET_AT_UNIX: { args: [] },
    SS_HWID_LIMIT: { args: [] },
    DESCRIPTION: { args: [] },
} satisfies Record<TemplateKeys, TemplateVariableSpec>;

const TEMPLATE_KEY_SET: ReadonlySet<string> = new Set(TEMPLATE_KEYS);

export function isTemplateKey(key: string): key is TemplateKeys {
    return TEMPLATE_KEY_SET.has(key);
}

export type TemplateArgsOf<K extends TemplateKeys> = Partial<
    Record<(typeof TEMPLATE_VARIABLES)[K]['args'][number], string>
>;

export type TemplateResolver<K extends TemplateKeys> = (args: TemplateArgsOf<K>) => string | number;

export type TemplateResolvers = {
    [K in TemplateKeys]: TemplateResolver<K>;
};
