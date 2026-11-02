const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { once } = require('node:events');
const { readFileSync } = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const ts = require('typescript');
const { test } = require('node:test');
require('reflect-metadata');
function load(relative) {
    const filename = path.resolve(__dirname, '../src/modules/mesh', relative);
    const output = ts.transpileModule(readFileSync(filename, 'utf8'), {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
        },
    }).outputText;
    const compiled = new Module(filename);
    compiled.filename = filename;
    compiled.paths = Module._nodeModulePaths(path.dirname(filename));
    compiled._compile(output, filename);
    return compiled.exports;
}
const { MeshService } = load('mesh.service.ts');
const { NodeSchema, FlagsSchema, MeshJobDto, MeshRelayDto, MeshTeardownDto } = load('mesh.dto.ts');
const credential = 'test-only-'.repeat(5);
function client(origin, token = credential) {
    return new MeshService({
        get: (name) => ({ MESH_CONTROLLER_URL: origin, MESH_CONTROLLER_TOKEN: token })[name],
    });
}
async function server(t, callback) {
    const http = createServer(callback).listen(0, '127.0.0.1');
    await once(http, 'listening');
    t.after(() => {
        http.closeAllConnections();
        http.close();
    });
    return `http://127.0.0.1:${http.address().port}`;
}
test('disabled integration does not contact a default destination', async () => {
    await assert.rejects(
        client(undefined).request('/status'),
        (error) => error.getStatus() === 503,
    );
});
test('configured integration requires a strong token and origin-only URL', async () => {
    for (const url of [
        'file:///tmp/secret',
        'https://user:pass@example.com',
        'https://example.com/path',
        'https://example.com?token=secret',
    ]) {
        await assert.rejects(client(url).request('/status'), (error) => error.getStatus() === 503);
    }
    await assert.rejects(
        client('http://localhost', '').request('/status'),
        (error) => error.getStatus() === 503,
    );
});
test('fixed controller destination receives token and status is returned', async (t) => {
    const origin = await server(t, (req, res) => {
        assert.equal(req.url, '/status');
        assert.equal(req.headers['x-mesh-token'], credential);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ cycles: 2 }));
    });
    assert.deepEqual(await client(origin).request('/status'), { cycles: 2 });
});
test('operations send a JSON body without credentials in the URL', async (t) => {
    const origin = await server(t, (req, res) => {
        assert.equal(req.method, 'POST');
        assert.equal(req.url, '/api/flags');
        let body = '';
        req.on('data', (data) => (body += data));
        req.on('end', () => {
            assert.deepEqual(JSON.parse(body), { auto_relay: false });
            res.end('{}');
        });
    });
    await client(origin).request('/api/flags', { auto_relay: false });
});
test('controller redirects cannot disclose its credential', async (t) => {
    let leaked = false;
    const destination = await server(t, (req, res) => {
        leaked = true;
        res.end('{}');
    });
    const origin = await server(t, (req, res) => {
        res.writeHead(302, { Location: destination });
        res.end();
    });
    await assert.rejects(client(origin).request('/status'), (error) => error.getStatus() === 502);
    assert.equal(leaked, false);
});
test('upstream error details are neither reflected nor logged', async (t) => {
    for (const status of [400, 403, 404, 409, 500]) {
        const origin = await server(t, (req, res) => {
            res.writeHead(status);
            res.end(JSON.stringify({ error: credential }));
        });
        await assert.rejects(
            client(origin).request('/status'),
            (error) =>
                !JSON.stringify(error).includes(credential) &&
                error.getStatus() === ([400, 404, 409].includes(status) ? status : 502),
        );
    }
});
test('malformed and oversized responses fail closed', async (t) => {
    for (const body of ['not json', JSON.stringify({ data: 'x'.repeat(1048576) })]) {
        const origin = await server(t, (req, res) => res.end(body));
        await assert.rejects(
            client(origin).request('/status'),
            (error) => error.getStatus() === 502,
        );
    }
});
test('arbitrary controller paths and job traversal are rejected', async () => {
    for (const endpoint of [
        'https://other.example',
        '//other.example',
        '/api/jobs/../../status',
        '/metrics',
    ]) {
        await assert.rejects(
            client('http://localhost').request(endpoint),
            (error) => error.getStatus() === 400,
        );
    }
    assert.equal(MeshJobDto.schema.safeParse({ id: '../status' }).success, false);
});
test('DTOs reject unknown automation flags, string booleans and command injection', () => {
    for (const flags of [
        { unsupported_flag: true },
        { auto_relay: 'false' },
        {},
        { auto_relay: true, unknown: true },
    ])
        assert.equal(FlagsSchema.safeParse(flags).success, false);
    for (const name of ['x;id', '../../etc/passwd', 'x$(id)'])
        assert.equal(
            NodeSchema.safeParse({ name, host: '192.0.2.1', role: 'exit' }).success,
            false,
        );
    assert.equal(MeshRelayDto.schema.safeParse({ exit: 'nl', mode: 'arbitrary' }).success, false);
    assert.equal(
        NodeSchema.safeParse({
            name: 'exit',
            host: '192.0.2.1',
            role: 'exit',
            password: 'one',
            private_key: 'two',
        }).success,
        false,
    );
    assert.equal(
        NodeSchema.safeParse({
            name: 'exit',
            host: '192.0.2.1',
            role: 'exit',
            password: 'test-only',
        }).success,
        true,
    );
});

test('balancer automation is rejected when the optional adapter is absent', async (t) => {
    let writes = 0;
    const origin = await server(t, (req, res) => {
        if (req.method === 'POST') writes++;
        res.end(JSON.stringify({ capabilities: { balancer: false } }));
    });
    await assert.rejects(
        client(origin).request('/api/flags', { auto_balancer: true }),
        (error) => error.getStatus() === 400,
    );
    assert.equal(writes, 0);
});

test('explicit balancer integration allows its automation flag', async (t) => {
    let writes = 0;
    const origin = await server(t, (req, res) => {
        if (req.url === '/status') res.end(JSON.stringify({ capabilities: { balancer: true } }));
        else {
            writes++;
            res.end('{}');
        }
    });
    await client(origin).request('/api/flags', { auto_balancer: false });
    assert.equal(writes, 1);
});

test('full teardown requires the exact explicit confirmation phrase', () => {
    for (const input of [
        {},
        { confirm: true },
        { confirm: 'remove' },
        { confirm: 'REMOVE_MESH', other: true },
    ]) {
        assert.equal(MeshTeardownDto.schema.safeParse(input).success, false);
    }
    assert.equal(MeshTeardownDto.schema.safeParse({ confirm: 'REMOVE_MESH' }).success, true);
});
