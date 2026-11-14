import { toNonEmptyRecord } from './to-non-empty-record.util';

/**
 * Finalmask types that only work on the server side of a connection.
 * "filter" restricts the source IPs an inbound accepts, so it must not end up in client outbounds:
 * older cores refuse to load such a config, and the allow/block lists would be sent to every user.
 */
const SERVER_ONLY_MASK_TYPES = new Set(['filter']);

export function stripServerOnlyMasks(
    finalMask: Record<string, unknown> | null,
): Record<string, unknown> | null {
    if (!finalMask) return null;

    const result: Record<string, unknown> = { ...finalMask };

    for (const layer of ['tcp', 'udp']) {
        const masks = result[layer];
        if (!Array.isArray(masks)) continue;

        const kept = masks.filter(
            (mask) =>
                !SERVER_ONLY_MASK_TYPES.has((mask as { type?: unknown } | null)?.type as string),
        );

        if (kept.length > 0) {
            result[layer] = kept;
        } else {
            delete result[layer];
        }
    }

    return toNonEmptyRecord(result);
}
