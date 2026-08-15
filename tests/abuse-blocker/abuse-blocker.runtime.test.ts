import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { AbuseBlockerReportModel } from '@remnawave/node-contract';

import { AbuseBlockerService } from '../../src/modules/node-plugins/abuse-blocker.service';
import { decideAbuseEscalation } from '../../src/modules/node-plugins/repositories/abuse-blocker.repository';

const report = {
    eventId: '00000000-0000-4000-8000-000000000001',
    userId: '42',
    sourceIp: '198.51.100.10',
    policy: { repeatBlockSeconds: 3600, repeatWindowSeconds: 604800 },
} as AbuseBlockerReportModel;

describe('Abuse Blocker escalation', () => {
    const now = new Date('2026-08-15T00:00:00.000Z');

    it('progresses from 10-minute Node block to one-hour refresh and disable', () => {
        const first = decideAbuseEscalation(null, now, 604800);
        const second = decideAbuseEscalation(
            {
                strikeLevel: first.strikeLevel,
                lastBlockingIncidentAt: now,
                manualReviewRequired: false,
            },
            new Date(now.getTime() + 1000),
            604800,
        );
        const third = decideAbuseEscalation(
            {
                strikeLevel: second.strikeLevel,
                lastBlockingIncidentAt: new Date(now.getTime() + 1000),
                manualReviewRequired: false,
            },
            new Date(now.getTime() + 2000),
            604800,
        );

        assert.deepEqual(first, { action: 'initial_block', notify: true, strikeLevel: 1 });
        assert.deepEqual(second, { action: 'repeat_block', notify: true, strikeLevel: 2 });
        assert.deepEqual(third, { action: 'disabled', notify: true, strikeLevel: 3 });
    });

    it('starts a fresh chain after seven days', () => {
        assert.deepEqual(
            decideAbuseEscalation(
                {
                    strikeLevel: 2,
                    lastBlockingIncidentAt: now,
                    manualReviewRequired: false,
                },
                new Date(now.getTime() + 604_800_001),
                604800,
            ),
            { action: 'initial_block', notify: true, strikeLevel: 1 },
        );
    });

    it('stores later incidents without repeating disable or notifications', () => {
        assert.deepEqual(
            decideAbuseEscalation(
                {
                    strikeLevel: 3,
                    lastBlockingIncidentAt: now,
                    manualReviewRequired: true,
                },
                new Date(now.getTime() + 604_800_001),
                604800,
            ),
            { action: 'none', notify: false, strikeLevel: 3 },
        );
    });
});

const createService = (processed: {
    action: 'none' | 'initial_block' | 'repeat_block' | 'disabled';
    created: boolean;
    notify: boolean;
    strikeLevel: number;
}) => {
    const calls = { disable: 0, emit: 0, mark: 0, refresh: 0 };
    const user = { id: 42n, status: 'ACTIVE' };
    const node = { id: 7n, uuid: '00000000-0000-4000-8000-000000000007' };
    const repository = {
        processReport: async () => processed,
        markDisabledByPlugin: async () => {
            calls.mark += 1;
        },
    };
    const service = new AbuseBlockerService(
        repository as never,
        {
            refreshAbuseBlock: async () => {
                calls.refresh += 1;
                return { isOk: true, response: { accepted: true } };
            },
        } as never,
        {
            disableUser: async () => {
                calls.disable += 1;
                return { isOk: true, response: user };
            },
        } as never,
        {
            execute: async (query: object) => ({
                isOk: true,
                response: query.constructor.name.includes('User') ? user : node,
            }),
        } as never,
        {
            emit: () => {
                calls.emit += 1;
            },
        } as never,
    );
    return { calls, service };
};

describe('AbuseBlockerService report idempotency and actions', () => {
    it('keeps suspicious reports database-only', async () => {
        const { calls, service } = createService({
            action: 'none',
            created: true,
            notify: false,
            strikeLevel: 0,
        });

        await service.processReport('00000000-0000-4000-8000-000000000007', {} as never, report);
        assert.deepEqual(calls, { disable: 0, emit: 0, mark: 0, refresh: 0 });
    });

    it('does not repeat escalation for an existing eventId', async () => {
        const { calls, service } = createService({
            action: 'repeat_block',
            created: false,
            notify: false,
            strikeLevel: 2,
        });

        await service.processReport('00000000-0000-4000-8000-000000000007', {} as never, report);
        assert.deepEqual(calls, { disable: 0, emit: 0, mark: 0, refresh: 0 });
    });

    it('refreshes the Node block once for a repeat offender', async () => {
        const { calls, service } = createService({
            action: 'repeat_block',
            created: true,
            notify: true,
            strikeLevel: 2,
        });

        await service.processReport('00000000-0000-4000-8000-000000000007', {} as never, report);
        assert.equal(calls.refresh, 1);
        assert.equal(calls.emit, 1);
        assert.equal(calls.disable, 0);
    });

    it('uses the standard user service and marks plugin disablement on strike three', async () => {
        const { calls, service } = createService({
            action: 'disabled',
            created: true,
            notify: true,
            strikeLevel: 3,
        });

        await service.processReport('00000000-0000-4000-8000-000000000007', {} as never, report);
        assert.equal(calls.disable, 1);
        assert.equal(calls.mark, 1);
        assert.equal(calls.emit, 1);
    });
});

describe('Abuse Blocker manual review', () => {
    const createReviewService = (status: 'ACTIVE' | 'DISABLED') => {
        const calls = { disable: 0, enable: 0 };
        const state = {
            userId: 42n,
            strikeLevel: 0,
            lastBlockingIncidentAt: null,
            manualReviewRequired: false,
            disabledByPlugin: false,
            reviewRequestedAt: null,
            reviewedAt: new Date(),
            reviewAction: null,
            updatedAt: new Date(),
            user: {
                username: 'test',
                vlessUuid: '00000000-0000-4000-8000-000000000042',
                status,
            },
        };
        const service = new AbuseBlockerService(
            {
                findReviewStateByUserUuid: async () => state,
                resolveReview: async (_uuid: string, action: string) => ({
                    ...state,
                    reviewAction: action,
                }),
                findReviewState: async () => state,
            } as never,
            {} as never,
            {
                enableUser: async () => {
                    calls.enable += 1;
                    return { isOk: true };
                },
                disableUser: async () => {
                    calls.disable += 1;
                    return { isOk: true };
                },
            } as never,
            {} as never,
            {} as never,
        );
        return { calls, service };
    };

    it('enables a disabled user and keeps reports untouched', async () => {
        const { calls, service } = createReviewService('DISABLED');
        const result = await service.review('00000000-0000-4000-8000-000000000042', 'enable');
        assert.equal(result.isOk, true);
        assert.deepEqual(calls, { disable: 0, enable: 1 });
    });

    it('idempotently keeps an already disabled user disabled', async () => {
        const { calls, service } = createReviewService('DISABLED');
        const result = await service.review(
            '00000000-0000-4000-8000-000000000042',
            'keep_disabled',
        );
        assert.equal(result.isOk, true);
        assert.deepEqual(calls, { disable: 0, enable: 0 });
    });
});
