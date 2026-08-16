import { PrismaClient } from '@prisma/client';
import consola from 'consola';

const EXT_PREFIX = 'ext:';
const SHARED_LISTS_KEY = 'sharedLists';
const SHARED_LIST_TYPES = new Set(['ipList', 'asList']);
const MAX_NAME_LENGTH = 255;

interface IInlineSharedList {
    items: unknown;
    name: string;
    type: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isInlineSharedList = (value: unknown): value is IInlineSharedList =>
    isRecord(value) &&
    typeof value.name === 'string' &&
    typeof value.type === 'string' &&
    SHARED_LIST_TYPES.has(value.type) &&
    Array.isArray(value.items);

const sanitizeName = (value: string): string => value.replace(/[^A-Za-z0-9_-]/g, '_');

const stripExtPrefix = (value: string): string =>
    value.startsWith(EXT_PREFIX) ? value.slice(EXT_PREFIX.length) : value;

const buildName = (listName: string, pluginName: string): string => {
    const bare = sanitizeName(stripExtPrefix(listName));
    const postfix = sanitizeName(pluginName);

    return `${bare}_${postfix}`.slice(0, MAX_NAME_LENGTH);
};

const withSuffix = (name: string, attempt: number): string => {
    const suffix = `_${attempt}`;

    return `${name.slice(0, MAX_NAME_LENGTH - suffix.length)}${suffix}`;
};

const resolveFreeName = async (prisma: PrismaClient, name: string): Promise<string> => {
    let candidate = name;
    let attempt = 1;

    while (true) {
        const existing = await prisma.sharedLists.findUnique({ where: { name: candidate } });

        if (!existing) {
            return candidate;
        }

        attempt += 1;
        candidate = withSuffix(name, attempt);
    }
};

const rewriteReferences = (value: unknown, renames: Map<string, string>): unknown => {
    if (typeof value === 'string') {
        return renames.get(value) ?? value;
    }

    if (Array.isArray(value)) {
        return value.map((item) => rewriteReferences(item, renames));
    }

    if (isRecord(value)) {
        const result: Record<string, unknown> = {};

        for (const [key, nested] of Object.entries(value)) {
            result[key] = rewriteReferences(nested, renames);
        }

        return result;
    }

    return value;
};

export async function migrateSharedLists(prisma: PrismaClient) {
    const plugins = await prisma.nodePlugin.findMany();

    let migratedLists = 0;
    let touchedPlugins = 0;

    for (const plugin of plugins) {
        const pluginConfig = plugin.pluginConfig;

        if (!isRecord(pluginConfig)) {
            continue;
        }

        const inlineLists = pluginConfig[SHARED_LISTS_KEY];

        if (!Array.isArray(inlineLists) || inlineLists.length === 0) {
            continue;
        }

        const renames = new Map<string, string>();
        const keptInline: unknown[] = [];

        for (const inlineList of inlineLists) {
            if (!isInlineSharedList(inlineList)) {
                consola.warn(
                    `Plugin "${plugin.name}": shared list entry is malformed, leaving it inline`,
                );
                keptInline.push(inlineList);
                continue;
            }

            const name = await resolveFreeName(prisma, buildName(inlineList.name, plugin.name));

            await prisma.sharedLists.create({
                data: {
                    name,
                    config: {
                        type: inlineList.type,
                        items: inlineList.items,
                    },
                },
            });

            const reference = `${EXT_PREFIX}${name}`;

            for (const oldReference of [
                inlineList.name,
                `${EXT_PREFIX}${stripExtPrefix(inlineList.name)}`,
            ]) {
                if (oldReference !== reference) {
                    renames.set(oldReference, reference);
                }
            }

            migratedLists += 1;
        }

        const { [SHARED_LISTS_KEY]: _extracted, ...rest } = pluginConfig;

        const migratedConfig = rewriteReferences(rest, renames) as Record<string, unknown>;

        if (keptInline.length > 0) {
            migratedConfig[SHARED_LISTS_KEY] = keptInline;
        }

        await prisma.nodePlugin.update({
            where: { uuid: plugin.uuid },
            data: { pluginConfig: migratedConfig },
        });

        touchedPlugins += 1;
    }

    if (migratedLists === 0) {
        return;
    }

    consola.info(`Migrated ${migratedLists} shared list(s) from ${touchedPlugins} plugin(s)`);
}
