// Run: node --test test/stash-xhttp.test.cjs
// Load the real generator/mapper and their small utilities without bootstrapping Nest/DB.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { test } = require('node:test');
const ts = require('typescript');
const yaml = require('js-yaml');
const root = path.resolve(__dirname, '..');
const originalRequire = Module.prototype.require;
const originalTs = require.extensions['.ts'];
require.extensions['.ts'] = (module, file) => {
    const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
            experimentalDecorators: true,
            emitDecoratorMetadata: false,
            esModuleInterop: true,
        },
    });
    module._compile(result.outputText, file);
};
Module.prototype.require = function (name) {
    if (name === '@common/utils')
        return {
            ...require(path.join(root, 'src/common/utils/convert-type.ts')),
            ...require(path.join(root, 'src/common/utils/parse-int-range.util.ts')),
        };
    if (name === '@libs/contracts/constants')
        return require(path.join(root, 'libs/contract/constants/hosts/fingerprints.ts'));
    return originalRequire.call(this, name);
};
const {
    MihomoGeneratorService,
} = require('../src/modules/subscription-template/generators/mihomo.generator.service.ts');
Module.prototype.require = originalRequire;
if (originalTs) require.extensions['.ts'] = originalTs;
else delete require.extensions['.ts'];

function host(overrides = {}) {
    return {
        address: 'proxy.example.org',
        port: 443,
        finalRemark: 'XHTTP',
        protocol: 'vless',
        protocolOptions: {
            id: '00000000-0000-4000-8000-000000000001',
            flow: '',
            encryption: 'none',
        },
        transport: 'xhttp',
        transportOptions: {
            path: '/transport',
            host: 'proxy.example.org',
            mode: 'stream-up',
            extra: null,
        },
        security: 'tls',
        securityOptions: {
            serverName: 'tls.example.org',
            alpn: 'h2',
            fingerprint: 'firefox',
            pinnedPeerCertSha256: null,
        },
        clientOverrides: { mapper: { mihomo: [] } },
        streamOverrides: {},
        mux: null,
        metadata: { isHidden: false, excludeFromSubscriptionTypes: [] },
        ...overrides,
    };
}
async function render(remnawave, hosts = [host()], stash = true) {
    const template = {
        remnawave,
        rules: ['MATCH,DIRECT'],
        'proxy-groups': [{ name: 'Proxy', type: 'select' }],
    };
    const service = new MihomoGeneratorService({
        getCachedTemplateByType: async () => structuredClone(template),
    });
    return yaml.load(await service.generateConfig(hosts, stash));
}

test('legacy and malformed opt-ins keep Stash XHTTP excluded', async () => {
    for (const value of [undefined, false, 'true', 1, null]) {
        const result = await render({ allowStashXhttp: value });
        assert.deepEqual(result.proxies, []);
        assert.deepEqual(result['proxy-groups'][0].proxies, []);
        assert.equal(result.remnawave, undefined);
    }
});
test('explicit opt-in produces personalized TLS XHTTP and strips template controls', async () => {
    const result = await render({ allowStashXhttp: true });
    const node = result.proxies[0];
    assert.equal(node.uuid, host().protocolOptions.id);
    assert.equal(node.network, 'xhttp');
    assert.equal(node.tls, true);
    assert.equal(node.sni, 'tls.example.org');
    assert.equal(node.servername, undefined);
    assert.deepEqual(node.alpn, ['h2']);
    assert.equal(node['client-fingerprint'], 'firefox');
    assert.deepEqual(node['xhttp-opts'], {
        path: '/transport',
        host: 'proxy.example.org',
        mode: 'stream-up',
    });
    assert.equal(node.flow, undefined);
    assert.deepEqual(result['proxy-groups'][0].proxies, ['XHTTP']);
    assert.equal(result.remnawave, undefined);
});
test('hidden and excluded hosts remain excluded after opt-in', async () => {
    const hidden = host({ metadata: { isHidden: true, excludeFromSubscriptionTypes: [] } });
    assert.equal((await render({ allowStashXhttp: true }, [hidden])).proxies.length, 0);
    assert.equal(
        (await render({ allowStashXhttp: true, includeHiddenHosts: true }, [hidden])).proxies
            .length,
        1,
    );
    const excluded = host({
        metadata: { isHidden: false, excludeFromSubscriptionTypes: ['STASH'] },
    });
    assert.equal(
        (await render({ allowStashXhttp: true, includeHiddenHosts: true }, [excluded])).proxies
            .length,
        0,
    );
    assert.equal((await render({ allowStashXhttp: true }, [])).proxies.length, 0);
});
test('Mihomo output does not depend on the Stash flag', async () => {
    const before = await render({}, [host()], false);
    assert.deepEqual(await render({ allowStashXhttp: true }, [host()], false), before);
    assert.equal(before.proxies[0].servername, 'tls.example.org');
    assert.equal(before.proxies[0].sni, undefined);
});
test('RAW remains identical and per-user identifiers are not shared', async () => {
    const raw = host({ transport: 'tcp', finalRemark: 'RAW', transportOptions: { header: null } });
    assert.deepEqual(await render({}, [raw]), await render({ allowStashXhttp: true }, [raw]));
    const other = host({
        protocolOptions: { ...host().protocolOptions, id: '00000000-0000-4000-8000-000000000002' },
    });
    assert.notEqual(
        (await render({ allowStashXhttp: true })).proxies[0].uuid,
        (await render({ allowStashXhttp: true }, [other])).proxies[0].uuid,
    );
});
test('Host Mapper runs before SNI normalization and explicit Stash SNI wins', async () => {
    const mapped = host({
        clientOverrides: {
            mapper: {
                mihomo: [
                    { op: 'set', to: 'sni', value: 'mapped.example.org' },
                    { op: 'set', to: 'xhttp-opts.mode', value: 'packet-up' },
                    {
                        op: 'set',
                        to: 'xhttp-opts.download-settings',
                        value: { servername: 'download.example.org', port: 443 },
                    },
                ],
            },
        },
    });
    const result = (await render({ allowStashXhttp: true }, [mapped])).proxies[0];
    assert.equal(result.sni, 'mapped.example.org');
    assert.equal(result['xhttp-opts'].mode, 'packet-up');
    assert.deepEqual(result['xhttp-opts']['download-settings'], {
        sni: 'download.example.org',
        port: 443,
    });
});
