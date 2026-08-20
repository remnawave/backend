import { SharedListEntity } from '../entities/shared-list.entity';

const EXT_PREFIX = 'ext:';
const SHARED_LISTS_KEY = 'sharedLists';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const collectReferences = (value: unknown, references: Set<string>): void => {
    if (typeof value === 'string') {
        if (value.startsWith(EXT_PREFIX)) {
            references.add(value.slice(EXT_PREFIX.length));
        }

        return;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            collectReferences(item, references);
        }

        return;
    }

    if (isRecord(value)) {
        for (const nested of Object.values(value)) {
            collectReferences(nested, references);
        }
    }
};

export function injectSharedLists(
    pluginConfig: unknown,
    sharedLists: SharedListEntity[],
): Record<string, unknown> {
    const config = isRecord(pluginConfig) ? { ...pluginConfig } : {};

    delete config[SHARED_LISTS_KEY];

    const references = new Set<string>();
    collectReferences(config, references);

    config[SHARED_LISTS_KEY] = sharedLists
        .filter((sharedList) => references.has(sharedList.name))
        .map((sharedList) => ({
            ...sharedList.config,
            name: `${EXT_PREFIX}${sharedList.name}`,
        }));

    return config;
}
