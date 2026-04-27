// Unit tests for the pure diff + safety-cap logic. Run via:
//   npx ts-node --transpile-only -P tsconfig.json src/modules/nodes/utils/reconcile-diff.test.ts
// Uses node:test (ships with node ≥ 18) — no jest install required.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { computeReconcileDiff, evaluateSafetyCap } from './reconcile-diff';

describe('computeReconcileDiff', () => {
    it('empty actual + non-empty expected: every expected user is missing on the node', () => {
        const diff = computeReconcileDiff({
            expected: [
                { tId: 1, inboundTags: ['vless-reality-xhttp'] },
                { tId: 2, inboundTags: ['vless-reality-xhttp'] },
            ],
            actual: [],
            nodeTags: ['vless-reality-xhttp'],
        });
        assert.deepEqual(diff.perTag, [
            { tag: 'vless-reality-xhttp', missing: ['1', '2'], stale: [] },
        ]);
        assert.equal(diff.expectedTotal, 2);
        assert.equal(diff.actualTotal, 0);
        assert.equal(diff.staleTotal, 0);
    });

    it('empty expected + empty actual: no-op', () => {
        const diff = computeReconcileDiff({
            expected: [],
            actual: [],
            nodeTags: ['vless-reality-xhttp'],
        });
        assert.deepEqual(diff.perTag, [{ tag: 'vless-reality-xhttp', missing: [], stale: [] }]);
    });

    it('empty expected + small actual (≤10): all are stale, cap allows', () => {
        const diff = computeReconcileDiff({
            expected: [],
            actual: [
                { username: '1', inboundTags: ['t'] },
                { username: '2', inboundTags: ['t'] },
                { username: '3', inboundTags: ['t'] },
            ],
            nodeTags: ['t'],
        });
        assert.deepEqual(diff.perTag[0].stale, ['1', '2', '3']);
        const cap = evaluateSafetyCap({
            actualTotal: diff.actualTotal,
            staleTotal: diff.staleTotal,
        });
        assert.equal(cap.refused, false);
    });

    it('expected matches actual exactly: no missing, no stale', () => {
        const diff = computeReconcileDiff({
            expected: [
                { tId: 1, inboundTags: ['t'] },
                { tId: 2, inboundTags: ['t'] },
            ],
            actual: [
                { username: '1', inboundTags: ['t'] },
                { username: '2', inboundTags: ['t'] },
            ],
            nodeTags: ['t'],
        });
        assert.deepEqual(diff.perTag, [{ tag: 't', missing: [], stale: [] }]);
    });

    it('partial drift: 3 missing + 2 stale on one tag', () => {
        const diff = computeReconcileDiff({
            expected: [
                { tId: 1, inboundTags: ['t'] },
                { tId: 2, inboundTags: ['t'] },
                { tId: 3, inboundTags: ['t'] },
                { tId: 4, inboundTags: ['t'] },
                { tId: 5, inboundTags: ['t'] },
            ],
            actual: [
                { username: '1', inboundTags: ['t'] },
                { username: '2', inboundTags: ['t'] },
                { username: '99', inboundTags: ['t'] },
                { username: '100', inboundTags: ['t'] },
            ],
            nodeTags: ['t'],
        });
        assert.deepEqual(diff.perTag[0].missing, ['3', '4', '5']);
        assert.deepEqual(diff.perTag[0].stale, ['100', '99']);
    });

    it('multiple tags on the same node: each diffed independently', () => {
        const diff = computeReconcileDiff({
            expected: [
                { tId: 1, inboundTags: ['vless'] },
                { tId: 2, inboundTags: ['trojan'] },
            ],
            actual: [
                { username: '1', inboundTags: ['vless'] },
                { username: '99', inboundTags: ['trojan'] },
            ],
            nodeTags: ['vless', 'trojan'],
        });
        const vless = diff.perTag.find((p) => p.tag === 'vless')!;
        const trojan = diff.perTag.find((p) => p.tag === 'trojan')!;
        assert.deepEqual(vless.missing, []);
        assert.deepEqual(vless.stale, []);
        assert.deepEqual(trojan.missing, ['2']);
        assert.deepEqual(trojan.stale, ['99']);
    });

    it('inbound tags outside the node are filtered out (no spurious drift)', () => {
        const diff = computeReconcileDiff({
            expected: [{ tId: 1, inboundTags: ['vless', 'shadowsocks'] }],
            actual: [{ username: '1', inboundTags: ['vless'] }],
            nodeTags: ['vless'], // node doesn't serve shadowsocks
        });
        assert.deepEqual(diff.perTag, [{ tag: 'vless', missing: [], stale: [] }]);
    });

    it('uses tId.toString() — must NOT diff against users.username column', () => {
        // The bug this catches: if you compare expected.username (e.g. "katya")
        // to actual.username (xray returns "11"), every user looks like drift
        // and the cap will keep firing forever. xray ids users by tId only.
        const diff = computeReconcileDiff({
            expected: [{ tId: 11, inboundTags: ['t'] }],
            actual: [{ username: '11', inboundTags: ['t'] }],
            nodeTags: ['t'],
        });
        assert.deepEqual(diff.perTag[0].missing, []);
        assert.deepEqual(diff.perTag[0].stale, []);
    });
});

describe('evaluateSafetyCap', () => {
    it('absolute ≤ 10: no cap regardless of ratio', () => {
        const cap = evaluateSafetyCap({ actualTotal: 10, staleTotal: 10 });
        assert.equal(cap.refused, false);
    });

    it('absolute > 10 but ratio ≤ 0.5: allowed', () => {
        // 11 stale of 30 actual = 36.6%. Below 50% ratio, allowed.
        const cap = evaluateSafetyCap({ actualTotal: 30, staleTotal: 11 });
        assert.equal(cap.refused, false);
    });

    it('absolute > 10 AND ratio > 0.5: refused', () => {
        // 11 stale of 20 actual = 55%. Above both thresholds.
        const cap = evaluateSafetyCap({ actualTotal: 20, staleTotal: 11 });
        assert.equal(cap.refused, true);
        assert.match(cap.reason ?? '', /safety cap/);
    });

    it('respects custom maxStaleRatio', () => {
        // 6 stale of 20 actual = 30%. Below default 50% but above 25%.
        const cap = evaluateSafetyCap({
            actualTotal: 20,
            staleTotal: 11,
            maxStaleRatio: 0.25,
        });
        assert.equal(cap.refused, true);
    });

    it('actualTotal=0 cannot trigger cap (nothing to remove)', () => {
        const cap = evaluateSafetyCap({ actualTotal: 0, staleTotal: 0 });
        assert.equal(cap.refused, false);
    });
});
