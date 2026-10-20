import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixture, temporary } from './helpers.js';
import { stageProject } from '../cli/src/core/archive.js';
import { commitProject } from '../cli/src/core/commit.js';
import { ForgeError } from '../cli/src/core/errors.js';
const exec = promisify(execFile);
const tsx = fileURLToPath(new URL('../node_modules/tsx/dist/cli.mjs', import.meta.url));
const script = (name: string) => fileURLToPath(new URL(`../scripts/${name}`, import.meta.url));

test('import copies native sources, excludes local artifacts and does not stage Git or overwrite', async () => {
  const f = await fixture();
  try {
    const source = join(f.root, 'source');
    await mkdir(join(source, 'node_modules'), { recursive: true });
    await writeFile(join(source, 'README.md'), 'Native project\n');
    await writeFile(join(source, '.env'), 'fixture-only-not-a-secret');
    await writeFile(join(source, '.env.example'), 'PUBLIC=example\n');
    await writeFile(join(source, 'node_modules/cache'), 'ignored');
    const args = [
      tsx,
      script('import-template.ts'),
      '--',
      '--source',
      source,
      '--id',
      'fixture-import',
      '--category',
      'fixture',
      '--name',
      'Imported fixture',
    ];
    await exec(process.execPath, args, { cwd: f.root });
    const target = join(f.root, 'templates/fixture/fixture-import');
    assert.deepEqual((await readdir(join(target, 'files'))).sort(), ['.env.example', 'README.md']);
    assert.equal(await readFile(join(target, 'files/README.md'), 'utf8'), 'Native project\n');
    assert.equal(
      execFileSync('git', ['ls-files', 'templates/fixture/fixture-import'], {
        cwd: f.root,
        encoding: 'utf8',
      }),
      '',
    );
    await assert.rejects(exec(process.execPath, args, { cwd: f.root }));
    assert.equal(await readFile(join(source, '.env'), 'utf8'), 'fixture-only-not-a-secret');
  } finally {
    await f.cleanup();
  }
});

test('local dev refuses repository output and generates externally through the same core', async () => {
  const f = await fixture();
  const external = await temporary();
  try {
    execFileSync(
      'git',
      [
        '-c',
        'user.name=Fixture',
        '-c',
        'user.email=fixture@example.invalid',
        'commit',
        '--quiet',
        '-m',
        'fixture',
      ],
      { cwd: f.root },
    );
    const args = [
      tsx,
      script('prepare-template-dev.ts'),
      '--',
      '--template',
      'fixture-plain',
      '--output',
    ];
    await assert.rejects(
      exec(process.execPath, [...args, join(f.root, 'bad-project')], { cwd: f.root }),
    );
    await exec(process.execPath, [...args, join(external, 'good-project')], { cwd: f.root });
    const record = JSON.parse(await readFile(join(external, 'good-project/.charon-forge.json'), 'utf8'));
    assert.equal(record.source, 'local-dev');
    assert.equal(record.catalogVersion, null);
    assert.equal(
      await readFile(join(f.directory, 'files/README.md'), 'utf8'),
      '# __PROJECT_NAME__\n',
    );
    await assert.rejects(
      exec(process.execPath, [...args, join(external, 'good-project')], { cwd: f.root }),
    );
  } finally {
    await f.cleanup();
    await rm(external, { recursive: true, force: true });
  }
});

test('interrupted commit preserves incomplete marker and does not claim a completed project', async () => {
  const f = await fixture();
  try {
    const stage = await stageProject(
      f.archive,
      f.packed.digest,
      { projectName: 'sample-app' },
      f.root,
    );
    await rm(join(stage.path, 'asset.bin')); // Simulate a staging I/O failure after validation.
    const target = join(f.root, 'incomplete');
    await assert.rejects(
      commitProject(stage, target, {
        schemaVersion: 1,
        source: 'local-dev',
        cliVersion: '0.1.0',
        templateId: f.template.id,
        templateVersion: f.template.version,
        catalogVersion: null,
        catalogSha256: null,
        artifactSha256: f.packed.digest,
        inputs: stage.inputs,
        createdAt: new Date().toISOString(),
      }),
      (error: unknown) => error instanceof ForgeError && error.code === 'E_INCOMPLETE',
    );
    const names = await readdir(target);
    assert.ok(names.includes('.charon-forge.incomplete.json'));
    assert.ok(!names.includes('.charon-forge.json'));
    assert.equal(await readFile(join(target, 'README.md'), 'utf8'), '# sample-app\n');
  } finally {
    await f.cleanup();
  }
});

test('release prepare from a clean fixture emits previews only and refuses an existing output', async () => {
  const f = await fixture();
  try {
    const out = join(f.root, 'dist/templates');
    await mkdir(out, { recursive: true });
    const filename = 'fixture-plain-1.0.0.tgz';
    await writeFile(join(out, filename), await readFile(f.archive));
    await writeFile(
      join(out, 'manifest.json'),
      JSON.stringify([
        { template: f.template, filename, sha256: f.packed.digest, files: f.packed.files },
      ]),
    );
    await writeFile(join(f.root, '.gitignore'), '/dist/\n*.tgz\n');
    execFileSync('git', ['add', '.gitignore'], { cwd: f.root });
    execFileSync(
      'git',
      [
        '-c',
        'user.name=Fixture',
        '-c',
        'user.email=fixture@example.invalid',
        'commit',
        '--quiet',
        '-m',
        'fixture',
      ],
      { cwd: f.root },
    );
    const args = [
      tsx,
      script('prepare-release.ts'),
      '--catalog-version',
      '2026.10.19.1',
      '--base-url',
      'https://example.com/batch/',
      '--first-release',
    ];
    await exec(process.execPath, args, { cwd: f.root });
    assert.deepEqual((await readdir(join(f.root, 'dist/release'))).sort(), [
      'catalog.json',
      filename,
      'stable-v1.json',
    ]);
    const channel = JSON.parse(await readFile(join(f.root, 'dist/release/stable-v1.json'), 'utf8'));
    assert.equal(channel.catalogUrl, 'https://example.com/batch/catalog.json');
    assert.equal(
      execFileSync('git', ['status', '--porcelain'], { cwd: f.root, encoding: 'utf8' }),
      '',
    );
    await assert.rejects(exec(process.execPath, args, { cwd: f.root }));
  } finally {
    await f.cleanup();
  }
});
