import { cloneDeep, get, set, toPath, unset } from 'lodash';

import { THostMapperOperation } from '@libs/contracts/models';

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

export function applyHostMapper<T extends object>(
    target: T,
    operations: THostMapperOperation[] | undefined,
    rawInbound: unknown,
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
                    if (!rawInbound || typeof rawInbound !== 'object') continue;

                    const value = get(rawInbound, operation.from);

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
