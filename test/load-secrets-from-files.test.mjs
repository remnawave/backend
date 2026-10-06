import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadSecretsFromFiles } from '../src/common/utils/load-secrets-from-files.ts';

function fixture(t, value) {
    const directory = mkdtempSync(path.join(tmpdir(), 'secret-file-test-'));
    t.after(() => rmSync(directory, { recursive: true, force: true }));
    const file = path.join(directory, 'secret');
    writeFileSync(file, value);
    return file;
}

test('loads a known file and strips only trailing CRLF', (t) => {
    const key = 'SECRET_FILE_TEST';
    const previous = process.env[key];
    t.after(() => previous === undefined ? delete process.env[key] : process.env[key] = previous);
    const file = fixture(t, '  value with spaces  \r\n\r\n');
    const result = loadSecretsFromFiles({ [`${key}_FILE`]: file }, [key]);
    assert.equal(result[key], '  value with spaces  ');
    assert.equal(process.env[key], result[key]);
});

test('rejects empty files including newline-only values', (t) => {
    for (const value of ['', '\n', '\r\n\r\n']) {
        const file = fixture(t, value);
        assert.throws(() => loadSecretsFromFiles({ TEST_FILE: file }, ['TEST']), /empty/);
    }
});

test('rejects conflicts without printing the direct secret', (t) => {
    const file = fixture(t, 'file-secret');
    assert.throws(() => loadSecretsFromFiles({ TEST: 'direct-secret', TEST_FILE: file }, ['TEST']),
        (error) => /both set/.test(error.message) && !error.message.includes('direct-secret'));
});

test('reports unreadable paths without accepting a fallback value', (t) => {
    const file = fixture(t, 'unused') + '-missing';
    assert.throws(() => loadSecretsFromFiles({ TEST_FILE: file }, ['TEST']), /can not be read/);
});

test('ignores unknown file variables', (t) => {
    const config = { UNKNOWN_FILE: fixture(t, 'unused') };
    assert.deepEqual(loadSecretsFromFiles(config, ['KNOWN']), config);
});

test('Prisma startup rejects newline-only secrets before URL fallback', (t) => {
    // Execute the actual standalone loader body without constructing any database client.
    const source = readFileSync(new URL('../prisma.config.ts', import.meta.url), 'utf8');
    const start = source.indexOf("for (const key of ['DATABASE_URL', 'DIRECT_URL'])");
    const end = source.indexOf('\nif (!process.env.DIRECT_URL)', start);
    assert.ok(start >= 0 && end > start);
    const execute = new Function('process', 'readFileSync', source.slice(start, end));
    for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
        const env = { [`${key}_FILE`]: fixture(t, '\r\n') };
        assert.throws(() => execute({ env }, readFileSync), /empty/);
        assert.equal(env[key], undefined);
    }
});
