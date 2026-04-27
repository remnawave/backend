// Pure diff + safety-cap logic for reconcile-users. Kept I/O-free so it
// can be unit-tested without spinning up nest, axios, or kysely.
//
// Username convention: xray identifies users by tId.toString(). The
// AddUserToNode handler (events/add-user-to-node/add-user-to-node.handler.ts)
// has done this since BDT-27. Reconcile MUST use the same key — comparing
// users.username (e.g. "katya") against xray usernames (e.g. "11") would
// flag every active user as drift and wipe the node on every cycle.

export interface ReconcileExpectedUser {
    tId: number;
    inboundTags: string[];
}

export interface ReconcileActualUser {
    username: string;
    inboundTags: string[];
}

export interface ReconcileDiffPerTag {
    tag: string;
    missing: string[]; // usernames (= tId.toString()) to add
    stale: string[]; // usernames currently on xray but no longer expected
}

export interface ReconcileDiff {
    perTag: ReconcileDiffPerTag[];
    expectedTotal: number; // distinct usernames across all tags
    actualTotal: number;
    staleTotal: number;
}

/**
 * Compute the per-tag set diff between expected (panel DB) and actual
 * (live xray on the node) user populations. Only `nodeTags` are considered
 * — tags the node doesn't serve cannot drift on it.
 */
export function computeReconcileDiff(args: {
    expected: ReconcileExpectedUser[];
    actual: ReconcileActualUser[];
    nodeTags: string[];
}): ReconcileDiff {
    const { expected, actual, nodeTags } = args;

    const expectedByTag = new Map<string, Set<string>>();
    const expectedAll = new Set<string>();
    for (const u of expected) {
        const username = String(u.tId);
        expectedAll.add(username);
        for (const tag of u.inboundTags) {
            if (!nodeTags.includes(tag)) continue;
            let set = expectedByTag.get(tag);
            if (!set) {
                set = new Set<string>();
                expectedByTag.set(tag, set);
            }
            set.add(username);
        }
    }

    const actualByTag = new Map<string, Set<string>>();
    const actualAll = new Set<string>();
    for (const u of actual) {
        actualAll.add(u.username);
        for (const tag of u.inboundTags) {
            if (!nodeTags.includes(tag)) continue;
            let set = actualByTag.get(tag);
            if (!set) {
                set = new Set<string>();
                actualByTag.set(tag, set);
            }
            set.add(u.username);
        }
    }

    const perTag: ReconcileDiffPerTag[] = [];
    let staleTotal = 0;
    for (const tag of nodeTags) {
        const exp = expectedByTag.get(tag) ?? new Set<string>();
        const act = actualByTag.get(tag) ?? new Set<string>();

        const missing: string[] = [];
        for (const u of exp) {
            if (!act.has(u)) missing.push(u);
        }
        const stale: string[] = [];
        for (const u of act) {
            if (!exp.has(u)) stale.push(u);
        }
        missing.sort();
        stale.sort();
        staleTotal += stale.length;
        perTag.push({ tag, missing, stale });
    }

    return {
        perTag,
        expectedTotal: expectedAll.size,
        actualTotal: actualAll.size,
        staleTotal,
    };
}

export interface SafetyCapResult {
    refused: boolean;
    reason: string | null;
}

/**
 * Refuse to act if the proposed removals look catastrophic. Tripping
 * this means we'd wipe an unreasonable share of a node's xray users in
 * one cycle — almost always a data-source bug (empty expected response,
 * misconfigured node, etc), not real drift. Both conditions must hold:
 *  - absolute removals exceed `maxStaleAbsolute` (default 10), AND
 *  - removals exceed `maxStaleRatio` of the actual population (default 0.5).
 */
export function evaluateSafetyCap(args: {
    actualTotal: number;
    staleTotal: number;
    maxStaleAbsolute?: number;
    maxStaleRatio?: number;
}): SafetyCapResult {
    const maxStaleAbsolute = args.maxStaleAbsolute ?? 10;
    const maxStaleRatio = args.maxStaleRatio ?? 0.5;
    const { actualTotal, staleTotal } = args;

    if (staleTotal <= maxStaleAbsolute) {
        return { refused: false, reason: null };
    }
    if (actualTotal === 0) {
        // Nothing on the node — nothing to remove. Cap can't trigger.
        return { refused: false, reason: null };
    }
    const ratio = staleTotal / actualTotal;
    if (ratio > maxStaleRatio) {
        return {
            refused: true,
            reason: `safety cap: ${staleTotal} stale users would be removed (${(ratio * 100).toFixed(1)}% of ${actualTotal} actual), exceeds maxStaleAbsolute=${maxStaleAbsolute} & maxStaleRatio=${maxStaleRatio}`,
        };
    }
    return { refused: false, reason: null };
}
