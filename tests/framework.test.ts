import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, readFile, mkdir, rm, readdir, lstat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { execFileSync } from 'node:child_process';
import tar from 'tar-stream';
import { fixture, descriptor, temporary } from './helpers.js';
import {
  validateTemplate,
  resolveInputs,
  type GenerationRecord,
} from '../cli/src/core/protocol/index.js';
import { stageProject, sha256 } from '../cli/src/core/archive.js';
import { packTemplate } from '../scripts/lib/template-pack.js';
import { commitProject } from '../cli/src/core/commit.js';
import { installProject } from '../cli/src/core/install.js';
import { ForgeError } from '../cli/src/core/errors.js';
import { parseInputs } from '../cli/src/commands/create.js';
const record = (digest: string): GenerationRecord => ({
  schemaVersion: 1,
  source: 'local-dev',
  cliVersion: '0.1.0',
  templateId: 'fixture-plain',
  templateVersion: '1.0.0',
  catalogVersion: null,
  catalogSha256: null,
  artifactSha256: digest,
  inputs: { projectName: 'sample-app' },
  createdAt: new Date().toISOString(),
});
const code = (expected: string) => (error: unknown) =>
  error instanceof ForgeError && error.code === expected;

test('protocol rejects unknown fields, invalid versions and missing/unsafe inputs', () => {
  assert.throws(() => validateTemplate({ ...descriptor(), hook: 'node bad.js' }), code('E_SCHEMA'));
  assert.throws(
    () => validateTemplate({ ...descriptor(), version: '1.0.0+mutable' }),
    code('E_SCHEMA'),
  );
  assert.throws(() => resolveInputs(descriptor(), {}), code('E_INPUT'));
  for (const name of ['', '2', '../escape', 'name"', 'UPPER', 'con', 'hello--world', 'my-project-'])
    assert.throws(() => resolveInputs(descriptor(), { projectName: name }));
  assert.deepEqual(resolveInputs(descriptor(), { projectName: 'my-project' }), {
    projectName: 'my-project',
  });
  assert.throws(() => parseInputs(['x=one', 'x=two']), code('E_INPUT'));
  assert.throws(() => parseInputs(['__proto__=bad']), code('E_INPUT'));
});

test('input errors explain identifier and template constraints', () => {
  const template = descriptor();
  assert.throws(
    () => resolveInputs(template, { projectName: '2' }),
    /projectName.*小写字母开头.*app-2/,
  );
  assert.deepEqual(resolveInputs(template, { projectName: 'app-2' }), { projectName: 'app-2' });
  assert.throws(
    () => resolveInputs(template, { projectName: 'a'.repeat(64) }),
    /不能超过 63 个字符/,
  );
  template.inputs.projectName = {
    type: 'string',
    required: true,
    minLength: 3,
    maxLength: 10,
    pattern: '^app-',
  };
  assert.throws(() => resolveInputs(template, { projectName: 'ab' }), /不能少于 3 个字符/);
  assert.throws(
    () => resolveInputs(template, { projectName: 'a'.repeat(11) }),
    /不能超过 10 个字符/,
  );
  assert.throws(() => resolveInputs(template, { projectName: 'other' }), /须匹配模板规则/);
  assert.deepEqual(resolveInputs(template, { projectName: 'app-2' }), { projectName: 'app-2' });
});

test('packing is deterministic, renders declared text and preserves binary/dotfiles', async () => {
  const f = await fixture();
  try {
    const second = await packTemplate(f.root, f.directory, join(f.root, 'second.tgz'));
    assert.equal(second.digest, f.packed.digest);
    const stage = await stageProject(
      f.archive,
      f.packed.digest,
      { projectName: 'sample-app' },
      f.root,
    );
    const target = await commitProject(stage, join(f.root, 'project'), record(f.packed.digest));
    assert.equal(await readFile(join(target, 'README.md'), 'utf8'), '# sample-app\n');
    assert.deepEqual(await readFile(join(target, 'asset.bin')), Buffer.from([0, 1, 2, 255]));
    assert.equal(await readFile(join(target, '.env.example'), 'utf8'), 'DEMO=1\n');
    assert.equal(
      JSON.parse(await readFile(join(target, '.charon-forge.json'), 'utf8')).templateId,
      'fixture-plain',
    );
    assert.ok(!(await readdir(target)).includes('.charon-forge.incomplete.json'));
    assert.equal(
      await readFile(join(f.directory, 'files/README.md'), 'utf8'),
      '# __PROJECT_NAME__\n',
    );
  } finally {
    await f.cleanup();
  }
});

test('ignored local artifacts do not overflow Git listing or enter the archive', async () => {
  const f = await fixture();
  try {
    await writeFile(join(f.directory, 'files/.gitignore'), 'node_modules/\n');
    execFileSync('git', ['add', 'templates'], { cwd: f.root });
    const dependencies = join(f.directory, 'files/node_modules', 'x'.repeat(200));
    await mkdir(dependencies, { recursive: true });
    for (let batch = 0; batch < 45; batch++) {
      await Promise.all(
        Array.from({ length: 100 }, (_, index) =>
          writeFile(join(dependencies, `${batch}-${index}.js`), ''),
        ),
      );
    }
    const packed = await packTemplate(f.root, f.directory, join(f.root, 'ignored.tgz'));
    assert.equal(packed.files.length, f.packed.files.length + 1);
    assert.ok(packed.files.includes('files/.gitignore'));
    assert.ok(packed.files.every((path) => !path.includes('node_modules')));
  } finally {
    await f.cleanup();
  }
});

test('tracked pollution is refused even when include would omit it; untracked included files fail', async () => {
  const f = await fixture();
  try {
    await writeFile(join(f.directory, 'files/new.txt'), 'new');
    await assert.rejects(
      packTemplate(f.root, f.directory, join(f.root, 'bad.tgz')),
      code('E_SCHEMA'),
    );
    await rm(join(f.directory, 'files/new.txt'));
    await writeFile(join(f.directory, 'files/.env'), 'not-real-secret');
    execFileSync('git', ['add', '--force', 'templates/fixture/plain/files/.env'], { cwd: f.root });
    await assert.rejects(
      packTemplate(f.root, f.directory, join(f.root, 'bad.tgz')),
      code('E_ARCHIVE'),
    );
  } finally {
    await f.cleanup();
  }
});

test('two generators claiming one directory never overwrite the winner; existing empty directory refused', async () => {
  const f = await fixture();
  try {
    const a = await stageProject(f.archive, f.packed.digest, { projectName: 'sample-app' }, f.root);
    const b = await stageProject(f.archive, f.packed.digest, { projectName: 'sample-app' }, f.root);
    const target = join(f.root, 'race');
    const results = await Promise.allSettled([
      commitProject(a, target, record(f.packed.digest)),
      commitProject(b, target, record(f.packed.digest)),
    ]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    const failure = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    assert.equal((failure.reason as ForgeError).code, 'E_TARGET_EXISTS');
    assert.equal(await readFile(join(target, 'README.md'), 'utf8'), '# sample-app\n');
    const existing = join(f.root, 'existing');
    await mkdir(existing);
    const c = await stageProject(f.archive, f.packed.digest, { projectName: 'sample-app' }, f.root);
    await assert.rejects(
      commitProject(c, existing, record(f.packed.digest)),
      code('E_TARGET_EXISTS'),
    );
    assert.deepEqual(await readdir(existing), []);
  } finally {
    await f.cleanup();
  }
});

async function hostile(
  path: string,
  headers: (Partial<tar.Header> & { name: string })[],
): Promise<string> {
  const pack = tar.pack();
  const written = pipeline(pack, createGzip(), createWriteStream(path));
  for (const header of headers) pack.entry({ ...header, size: 0 }, Buffer.alloc(0));
  pack.finalize();
  await written;
  return sha256(await readFile(path));
}
test('malicious paths, links and implicit case-colliding directories fail before a target exists', async () => {
  const root = await temporary();
  try {
    const samples: (Partial<tar.Header> & { name: string })[][] = [
      [{ name: 'files/../../escape' }],
      [{ name: 'files/link', type: 'symlink', linkname: '../../outside' }],
      [{ name: 'files/A/x' }, { name: 'files/a/y' }],
      [{ name: 'files/CON' }],
      [{ name: 'files/a\\b' }],
    ];
    for (const [index, headers] of samples.entries()) {
      const path = join(root, `bad-${index}.tgz`);
      const digest = await hostile(path, headers);
      await assert.rejects(
        stageProject(path, digest, { projectName: 'sample-app' }, root),
        code('E_ARCHIVE'),
      );
    }
    assert.ok(!(await readdir(root)).some((name) => name.startsWith('.charon-forge-stage-')));
    assert.ok(!(await readdir(root)).includes('escape'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('digest, unknown tokens and render cancellation refuse generation and clean private stages', async () => {
  const f = await fixture();
  try {
    await assert.rejects(
      stageProject(f.archive, '0'.repeat(64), { projectName: 'sample-app' }, f.root),
      code('E_INTEGRITY'),
    );
    await assert.rejects(
      stageProject(
        f.archive,
        f.packed.digest,
        async () => {
          throw new ForgeError('E_CANCELLED', 'prompt', 'cancel');
        },
        f.root,
      ),
      code('E_CANCELLED'),
    );
    await writeFile(join(f.directory, 'files/README.md'), '__UNDECLARED__\n');
    const packed = await packTemplate(f.root, f.directory, join(f.root, 'token.tgz'));
    await assert.rejects(
      stageProject(join(f.root, 'token.tgz'), packed.digest, { projectName: 'sample-app' }, f.root),
      code('E_RENDER'),
    );
    assert.ok(!(await readdir(f.root)).some((name) => name.startsWith('.charon-forge-stage-')));
  } finally {
    await f.cleanup();
  }
});

test('installation is fixed argv and failures preserve already-generated files', async () => {
  const f = await fixture();
  try {
    const stage = await stageProject(
      f.archive,
      f.packed.digest,
      { projectName: 'sample-app' },
      f.root,
    );
    const target = await commitProject(
      stage,
      join(f.root, 'space & 中文 (project)'),
      record(f.packed.digest),
    );
    const t = {
      ...descriptor(),
      install: { adapter: 'node' as const, packageManagers: ['pnpm' as const] },
    };
    const calls: { args: string[]; cwd: string }[] = [];
    await assert.rejects(
      installProject(t, target, undefined, async (_cmd, args, cwd) => {
        calls.push({ args, cwd });
        return { code: 9, output: '' };
      }),
      code('E_INSTALL'),
    );
    assert.deepEqual(calls[0]?.args, ['install', '--frozen-lockfile']);
    assert.equal(calls[0]?.cwd, target);
    assert.equal(await readFile(join(target, 'README.md'), 'utf8'), '# sample-app\n');
  } finally {
    await f.cleanup();
  }
});
