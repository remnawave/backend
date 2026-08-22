const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
    AbuseBlockerPluginSchema,
    NodePluginSchema,
} = require('../build/backend/models/node-plugins.schema.js');

describe('AbuseBlockerPluginSchema', () => {
    it('applies the documented defaults', () => {
        const config = AbuseBlockerPluginSchema.parse({ enabled: true });

        assert.deepEqual(config.excludedPorts, [80, 443]);
        assert.deepEqual(config.ignoreLists, {
            userId: [],
            sourceIp: [],
            destinationIp: [],
        });
        assert.equal(config.scoreWindowSeconds, 3600);
        assert.equal(config.incidentCooldownSeconds, 300);
        assert.equal(config.suspiciousScore, 50);
        assert.equal(config.alertScore, 100);
        assert.equal(config.blockScore, 150);
        assert.equal(config.initialBlockSeconds, 600);
        assert.equal(config.repeatBlockSeconds, 3600);
        assert.equal(config.repeatWindowSeconds, 604800);
        assert.equal(config.evidenceLimit, 10);
        assert.equal(config.enhancedEvidenceLimit, 50);
        assert.equal(config.maxTrackedUsers, 50000);
        assert.equal(config.maxKeysPerUser, 256);
        assert.equal(config.reportBufferSize, 10000);
        assert.deepEqual(config.horizontalScan, {
            enabled: true,
            windowSeconds: 60,
            uniqueDestinations: 20,
            ipv4Prefix: 24,
            ipv6Prefix: 64,
            score: 100,
        });
        assert.deepEqual(config.destinationSweep, {
            enabled: true,
            windowSeconds: 60,
            uniqueDestinations: 50,
            score: 50,
        });
    });

    it('accepts shared lists and custom rule settings', () => {
        const result = AbuseBlockerPluginSchema.safeParse({
            enabled: true,
            excludedPorts: [80, 443, 8443],
            ignoreLists: {
                userId: [42],
                sourceIp: ['192.0.2.0/24', 'ext:trusted_sources'],
                destinationIp: ['2001:db8::/32'],
            },
            horizontalScan: {
                uniqueDestinations: 25,
                ipv4Prefix: 20,
                ipv6Prefix: 56,
                score: 120,
            },
            destinationSweep: {
                uniqueDestinations: 75,
                score: 60,
            },
        });

        assert.equal(result.success, true);
    });

    it('rejects unordered score thresholds', () => {
        const result = AbuseBlockerPluginSchema.safeParse({
            enabled: true,
            suspiciousScore: 100,
            alertScore: 100,
            blockScore: 150,
        });

        assert.equal(result.success, false);
        assert.deepEqual(result.error.issues[0].path, ['alertScore']);
    });

    it('rejects duplicate excluded ports and invalid prefixes', () => {
        const result = AbuseBlockerPluginSchema.safeParse({
            enabled: true,
            excludedPorts: [443, 443],
            horizontalScan: { ipv4Prefix: 33 },
        });

        assert.equal(result.success, false);
        assert.equal(result.error.issues.length, 2);
    });

    it('keeps configurations without abuseBlocker backward compatible', () => {
        const result = NodePluginSchema.safeParse({
            torrentBlocker: {
                enabled: false,
                blockDuration: 600,
                ignoreLists: {},
            },
        });

        assert.equal(result.success, true);
        assert.equal(result.data.abuseBlocker, undefined);
    });
});
