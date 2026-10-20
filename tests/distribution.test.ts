import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { stripVTControlCharacters } from 'node:util';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fixture } from './helpers.js';
import { mergeCatalogs } from '../scripts/lib/catalog.js';
import { sha256 } from '../cli/src/core/archive.js';
import { RemoteStore, resolveTemplate, recommended } from '../cli/src/core/distribution.js';
import { runCLI } from '../cli/src/commands/create.js';
import { ForgeError } from '../cli/src/core/errors.js';
import { validateCatalog } from '../cli/src/core/protocol/index.js';
import { packTemplate } from '../scripts/lib/template-pack.js';
const code = (expected: string) => (e: unknown) => e instanceof ForgeError && e.code === expected;

test('catalog merges all history, preserves immutable URLs, rejects replacement and supports recommended rollback', async () => {
  const f = await fixture();
  try {
    const artifact = {
      template: f.template,
      filename: 'fixture-plain-1.0.0.tgz',
      sha256: f.packed.digest,
      files: f.packed.files,
    };
    const a = mergeCatalogs([], '2026.10.19.1', [artifact], 'https://example.com/one/');
    const b = mergeCatalogs(
      [a],
      '2026.10.19.2',
      [{ ...artifact, template: { ...f.template, version: '1.1.0' } }],
      'https://example.com/two/',
    );
    const rolled = mergeCatalogs([a, b], '2026.10.19.3', [], undefined, {
      'fixture-plain': ['1.0.0'],
    });
    assert.equal(Object.keys(rolled.templates['fixture-plain']!.versions).length, 2);
    assert.equal(recommended(rolled, 'fixture-plain', '0.1.0')?.version, '1.0.0');
    const future = structuredClone(rolled);
    future.templates['fixture-plain']!.versions['2.0.0'] = {
      ...future.templates['fixture-plain']!.versions['1.0.0']!,
      version: '2.0.0',
      schemaVersion: 2,
      minCliVersion: '2.0.0',
    };
    future.templates['fixture-plain']!.recommendedVersions = ['2.0.0', '1.0.0'];
    assert.equal(recommended(validateCatalog(future), 'fixture-plain', '0.1.0')?.version, '1.0.0');
    assert.equal(resolveTemplate(rolled, 'fixture-plain', '0.1.0', '1.1.0').version, '1.1.0');
    assert.equal(
      mergeCatalogs([a], 'retry', [artifact], 'https://example.com/changed/').templates[
        'fixture-plain'
      ]!.versions['1.0.0']!.artifactUrl,
      'https://example.com/one/fixture-plain-1.0.0.tgz',
    );
    assert.throws(
      () =>
        mergeCatalogs(
          [a],
          'bad',
          [{ ...artifact, sha256: '0'.repeat(64) }],
          'https://example.com/new/',
        ),
      code('E_INTEGRITY'),
    );
    assert.throws(() => resolveTemplate(a, 'fixture-plain', '0.0.1'), code('E_COMPAT'));
    assert.throws(() => resolveTemplate(a, 'constructor', '0.1.0'), code('E_INPUT'));
  } finally {
    await f.cleanup();
  }
});

test('HTTP fixture exercises interactive/non-TTY creation, offline cache, corruption and no-SDK generation', async () => {
  const f = await fixture();
  f.template.install = { adapter: 'node', packageManagers: ['pnpm'] };
  await writeFile(join(f.directory, 'template.json'), JSON.stringify(f.template));
  f.archive = join(f.root, 'node.tgz');
  f.packed = await packTemplate(f.root, f.directory, f.archive);
  const routes = new Map<string, Buffer>();
  let mode = 'ok';
  let errors = 0;
  const server = createServer((req, res) => {
    if (mode === 'redirect') {
      res.writeHead(302, { Location: 'http://untrusted.invalid/data' });
      res.end();
      return;
    }
    if (mode === 'retry') {
      errors++;
      res.writeHead(503);
      res.end();
      return;
    }
    const bytes = routes.get(req.url ?? '');
    if (!bytes) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.end(bytes);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const base = `http://127.0.0.1:${address.port}`;
  // Catalog publishing requires HTTPS; fixture URLs are rewritten only in the injected test source.
  const catalog = mergeCatalogs(
    [],
    '2026.10.19.1',
    [
      {
        template: f.template,
        filename: 'fixture-plain-1.0.0.tgz',
        sha256: f.packed.digest,
        files: f.packed.files,
      },
    ],
    'https://example.com/',
  );
  catalog.templates['fixture-plain']!.versions['1.0.0']!.artifactUrl = `${base}/template.tgz`;
  const bytes = Buffer.from(JSON.stringify(catalog));
  const digest = sha256(bytes);
  routes.set('/catalog.json', bytes);
  routes.set('/template.tgz', await readFile(f.archive));
  routes.set(
    '/stable-v1.json',
    Buffer.from(
      JSON.stringify({
        schemaVersion: 1,
        catalogVersion: catalog.catalogVersion,
        catalogUrl: `${base}/catalog.json`,
        sha256: digest,
      }),
    ),
  );
  const config = { channelUrl: `${base}/stable-v1.json`, allowedHosts: ['127.0.0.1'] };
  const options = {
    cacheDir: join(f.root, 'cache'),
    allowHttpForTests: true,
    delay: async () => {},
  };
  try {
    assert.equal(
      await runCLI(
        [join(f.root, 'new-project'), '--template', 'fixture-plain', '--yes', '--no-install'],
        '0.1.0',
        config,
        options,
      ),
      0,
    );
    assert.equal(await readFile(join(f.root, 'new-project/README.md'), 'utf8'), '# new-project\n');
    assert.equal(
      await runCLI(
        [join(f.root, 'invalid-name'), '--template', 'fixture-plain', '--name', '2', '--yes'],
        '0.1.0',
        config,
        options,
      ),
      2,
    );
    assert.ok(!(await readdir(f.root)).includes('invalid-name'));
    assert.ok(!(await readdir(f.root)).some((name) => name.startsWith('.charon-forge-stage-')));

    // Exercise the real prompts in a child so invalid input must be corrected before creation.
    const target = join(f.root, '1');
    const child = spawn(process.execPath, [
      '--import',
      'tsx',
      '--input-type=module',
      '--eval',
      `
        process.stdin.isTTY = true;
        process.stdin.setRawMode = () => {};
        process.stdout.isTTY = true;
        process.stdout.columns = 120;
        const { runCLI } = await import(${JSON.stringify(new URL('../cli/src/commands/create.ts', import.meta.url).href)});
        process.exitCode = await runCLI(
          ${JSON.stringify([target, '--template', 'fixture-plain'])},
          '0.1.0', ${JSON.stringify(config)}, ${JSON.stringify(options)},
        );
        process.stdin.destroy();
      `,
    ]);
    let output = '';
    let step = 0;
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (data: string) => {
      output += data;
    });
    child.stdout.on('data', (data: string) => {
      output += stripVTControlCharacters(data);
      if (step === 0 && output.includes('项目名称')) {
        step++;
        child.stdin.write('\x152\r');
      } else if (step === 1 && output.includes('须以小写字母开头')) {
        step++;
        child.stdin.write('\x15app-2\r');
      } else if (step === 2 && output.includes('安装依赖？')) {
        step++;
        child.stdin.write('\r');
      } else if (step === 3 && output.includes('安装依赖：')) {
        step++;
        child.stdin.write('\r');
      }
    });
    const timeout = setTimeout(() => child.kill('SIGKILL'), 15_000);
    try {
      const [status] = await once(child, 'close');
      assert.equal(status, 0, output);
      assert.equal(step, 4, output);
      assert.ok(output.indexOf('须以小写字母开头') < output.indexOf('安装依赖？'));
      assert.ok(output.indexOf('安装依赖？') < output.indexOf('创建 '));
      assert.equal(await readFile(join(target, 'README.md'), 'utf8'), '# app-2\n');
      assert.equal(
        JSON.parse(await readFile(join(target, '.charon-forge.json'), 'utf8')).inputs.projectName,
        'app-2',
      );
    } finally {
      clearTimeout(timeout);
      child.kill();
    }
    assert.equal(
      await runCLI(['--template', 'fixture-plain', '--yes'], '0.1.0', config, options),
      2,
    );
    const store = new RemoteStore(config, options);
    const loaded = await store.loadCatalog();
    const meta = resolveTemplate(loaded.catalog, 'fixture-plain', '0.1.0');
    await writeFile(join(options.cacheDir, `${meta.sha256}.tgz`), 'corrupt');
    await store.download(meta); // A corrupted cache is replaced by verified bytes.
    mode = 'redirect';
    await assert.rejects(store.loadCatalog(), code('E_SCHEMA'));
    mode = 'retry';
    const offline = await store.loadCatalog();
    assert.ok(offline.offline);
    assert.equal(errors, 3);
    assert.ok(await store.download(meta, true));
    await writeFile(join(options.cacheDir, `${meta.sha256}.tgz`), 'corrupt-again');
    await assert.rejects(store.download(meta, true), code('E_OFFLINE_MISS'));
    assert.ok(!(await readdir(options.cacheDir)).some((name) => name.endsWith('.part')));
    assert.equal(await runCLI(['--install', '--no-install'], '0.1.0', config, options), 2);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await f.cleanup();
  }
});
