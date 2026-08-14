import { CamelCasePlugin, CamelCasePluginOptions, UnknownRow } from 'kysely';

export const JSON_COLUMNS = [
    'branding_settings',
    'config',
    'custom_remarks',
    'custom_response_headers',
    'final_mask',
    'host_overrides',
    'hwid_settings',
    'ips',
    'mapper',
    'metadata',
    'mux_params',
    'oauth2_settings',
    'passkey_settings',
    'password_settings',
    'plugin_config',
    'raw_inbound',
    'report',
    'response_headers_add',
    'response_rules',
    'snippet',
    'sockopt_params',
    'subscription_settings',
    'template_json',
    'xhttp_extra_params',
];

export interface CustomCamelCasePluginOptions extends CamelCasePluginOptions {
    excludeColumns?: string[];
}

export class CustomCamelCasePlugin extends CamelCasePlugin {
    private readonly excludedColumns: ReadonlySet<string>;

    constructor({ excludeColumns = [], ...opt }: CustomCamelCasePluginOptions = {}) {
        super(opt);
        this.excludedColumns = new Set(excludeColumns);
    }

    protected override mapRow(row: UnknownRow): UnknownRow {
        return Object.keys(row).reduce<UnknownRow>((obj, key) => {
            obj[this.camelCase(key)] = this.excludedColumns.has(key)
                ? row[key]
                : this.mapValue(row[key]);

            return obj;
        }, {});
    }

    private mapValue(value: unknown): unknown {
        if (Array.isArray(value)) {
            return value.map((item) => this.mapValue(item));
        }

        return this.canMap(value) ? this.mapRow(value as UnknownRow) : value;
    }

    private canMap(value: unknown): boolean {
        if (this.opt.maintainNestedObjectKeys) {
            return false;
        }

        if (typeof value !== 'object' || value === null) {
            return false;
        }

        const proto = Object.getPrototypeOf(value);

        return proto === null || proto === Object.prototype;
    }
}
