import { cloneDeep, get, set, toPath, unset } from 'lodash';

import { THostMapperOperation } from '@libs/contracts/models';

import { ResolvedProxyConfig } from '../resolve-proxy/interfaces';

const HOST_SOURCE_PREFIX = '$host.';

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

interface CopySource {
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

function resolveCopySource(from: string, host: ResolvedProxyConfig): CopySource | null {
    if (!from.startsWith(HOST_SOURCE_PREFIX)) {
        const rawInbound = host.metadata.rawInbound;

        if (!rawInbound || typeof rawInbound !== 'object') return null;

        return { root: rawInbound, path: toPath(from) };
    }

    const segments = toPath(from.slice(HOST_SOURCE_PREFIX.length));

    if (!segments.length || !isAllowedHostPath(segments)) return null;

    return { root: host, path: segments };
}

export function applyHostMapper<T extends object>(
    target: T,
    operations: THostMapperOperation[] | undefined,
    host: ResolvedProxyConfig,
    flatTargets = false,
): T {
    if (!operations || !operations.length) return target;

    const result = cloneDeep(target);

    for (const operation of operations) {
        try {
            const to = flatTargets ? [operation.to] : operation.to;

            if (!flatTargets && isBlockedByPrimitive(result, operation.to)) {
                continue;
            }

            switch (operation.op) {
                case 'copy': {
                    const source = resolveCopySource(operation.from, host);

                    if (!source) continue;

                    const value = get(source.root, source.path);

                    if (value === undefined) continue;

                    set(result, to, cloneDeep(value));
                    break;
                }

                case 'set':
                    set(result, to, cloneDeep(operation.value));
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
