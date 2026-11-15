import { cloneDeep, get, isEqual, sample, set, toPath, unset } from 'lodash';

import { THostMapperMatch, THostMapperOperation, THostMapperWhen } from '@libs/contracts/models';

import { ResolvedProxyConfig } from '../resolve-proxy/interfaces';

const HOST_SOURCE_PREFIX = '$host.';
const SELF_SOURCE_PREFIX = '$self.';

const HOST_ALLOWED_PATHS = [
    'address',
    'clientOverrides.serverDescription',
    'finalRemark',
    'metadata.inboundTag',
    'metadata.remark',
    'metadata.tags',
    'mux',
    'port',
    'protocol',
    'protocolOptions',
    'security',
    'securityOptions',
    'streamOverrides.finalMask',
    'streamOverrides.sockopt',
    'transport',
    'transportOptions',
].map((path) => toPath(path));

export interface IHostMapperContext {
    srrRuleName?: string;
}

interface ValueSource {
    path: string[];
    root: object;
}

function isBlockedByPrimitive(target: object, path: string): boolean {
    const segments = toPath(path);

    for (let index = 1; index < segments.length; index++) {
        const value = get(target, segments.slice(0, index));

        if (value !== undefined && value !== null && typeof value !== 'object') {
            return true;
        }
    }

    return false;
}

function isAllowedHostPath(segments: string[]): boolean {
    return HOST_ALLOWED_PATHS.some(
        (allowed) =>
            allowed.length <= segments.length &&
            allowed.every((segment, index) => segment === segments[index]),
    );
}

function resolveInputSource(from: string, host: ResolvedProxyConfig): ValueSource | null {
    if (!from.startsWith(HOST_SOURCE_PREFIX)) {
        const rawInbound = host.metadata.rawInbound;

        if (!rawInbound || typeof rawInbound !== 'object') return null;

        return { root: rawInbound, path: toPath(from) };
    }

    const segments = toPath(from.slice(HOST_SOURCE_PREFIX.length));

    if (!segments.length || !isAllowedHostPath(segments)) return null;

    return { root: host, path: segments };
}

function resolveSource(
    path: string,
    host: ResolvedProxyConfig,
    self: object,
    flatTargets: boolean,
): ValueSource | null {
    if (!path.startsWith(SELF_SOURCE_PREFIX)) return resolveInputSource(path, host);

    const selfPath = path.slice(SELF_SOURCE_PREFIX.length);

    if (!selfPath) return null;

    return { root: self, path: flatTargets ? [selfPath] : toPath(selfPath) };
}

function matchesField(
    match: THostMapperMatch,
    host: ResolvedProxyConfig,
    self: object,
    flatTargets: boolean,
): boolean {
    const source = resolveSource(match.path, host, self, flatTargets);

    if (!source) return false;

    const value: unknown = get(source.root, source.path);

    if ('exists' in match) {
        return (value !== undefined && value !== null) === match.exists;
    }

    if ('equals' in match) {
        return isEqual(value, match.equals);
    }

    if ('in' in match) {
        return match.in.some((candidate) => isEqual(value, candidate));
    }

    if (Array.isArray(value)) {
        return value.some((item) => isEqual(item, match.contains));
    }

    if (typeof value === 'string' && typeof match.contains === 'string') {
        return value.includes(match.contains);
    }

    return false;
}

function matchesWhen(
    when: THostMapperWhen | undefined,
    context: IHostMapperContext,
    host: ResolvedProxyConfig,
    self: object,
    flatTargets: boolean,
): boolean {
    if (!when) return true;

    if (when.srrRule) {
        if (!context.srrRuleName || !when.srrRule.includes(context.srrRuleName)) return false;
    }

    if (when.match) {
        return when.match.every((match) => matchesField(match, host, self, flatTargets));
    }

    return true;
}

export function applyHostMapper<T extends object>(
    target: T,
    operations: THostMapperOperation[] | undefined,
    host: ResolvedProxyConfig,
    context: IHostMapperContext,
    flatTargets = false,
): T {
    if (!operations || !operations.length) return target;

    const result = cloneDeep(target);

    for (const operation of operations) {
        try {
            if (!matchesWhen(operation.when, context, host, result, flatTargets)) continue;

            const to = flatTargets ? [operation.to] : operation.to;

            if (!flatTargets && isBlockedByPrimitive(result, operation.to)) {
                continue;
            }

            switch (operation.op) {
                case 'copy': {
                    const source = resolveSource(operation.from, host, result, flatTargets);

                    if (!source) continue;

                    const value = get(source.root, source.path);

                    if (value === undefined) continue;

                    set(result, to, cloneDeep(value));
                    break;
                }

                case 'set':
                    set(result, to, cloneDeep(operation.value));
                    break;

                case 'pick':
                    set(result, to, cloneDeep(sample(operation.values)));
                    break;

                case 'unset':
                    unset(result, to);
                    break;
            }
        } catch {
            // silence
        }
    }

    return result;
}
