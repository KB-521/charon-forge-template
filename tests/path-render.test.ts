import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, rm, lstat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { stageProject, writeArchive, type ArchiveFile } from '../cli/src/core/archive.js';
import { validateTemplate } from '../cli/src/core/protocol/index.js';
import { ForgeError } from '../cli/src/core/errors.js';
import { packTemplate } from '../scripts/lib/template-pack.js';
import { descriptor, temporary, fixture } from './helpers.js';

const template = (paths: string[], files: string[] = []) => ({
  ...descriptor(),
  minCliVersion: '0.1.2',
  render: { tokens: { __PROJECT_NAME__: 'projectName' }, paths, files },
});
const file = (path: string, text = '', mode = 0o644): ArchiveFile => ({
  path: `files/${path}`,
  data: Buffer.from(text),
  mode,
});
const isForgeError = (error: unknown) => error instanceof ForgeError;

async function withArchive(
  metadata: ReturnType<typeof template>,
  files: ArchiveFile[],
  check: (root: string, archive: string, digest: string) => Promise<void>,
) {
  const root = await temporary();
  try {
    const archive = join(root, 'paths.tgz');
    const digest = await writeArchive(archive, [
      { path: 'template.json', data: Buffer.from(JSON.stringify(metadata)), mode: 0o644 },
      ...files,
    ]);
    await check(root, archive, digest);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('declared module directories and filenames render for different project names', async () => {
  await withArchive(
    template(
      ['__PROJECT_NAME__-biz', 'docker/__PROJECT_NAME__-web.yaml'],
      ['__PROJECT_NAME__-biz/pom.xml'],
    ),
    [
      file('__PROJECT_NAME__-biz/pom.xml', '<name>__PROJECT_NAME__-biz</name>'),
      { ...file('__PROJECT_NAME__-biz/asset.bin'), data: Buffer.from([0, 255, 1]) },
      file('__PROJECT_NAME__-biz/run.sh', '#!/bin/sh\nexit 0\n', 0o755),
      file('docker/__PROJECT_NAME__-web.yaml', 'kind: Service\n'),
    ],
    async (root, archive, digest) => {
      for (const projectName of ['demo', 'order-service']) {
        const stage = await stageProject(archive, digest, { projectName }, root);
        assert.equal(
          await readFile(join(stage.path, `${projectName}-biz/pom.xml`), 'utf8'),
          `<name>${projectName}-biz</name>`,
        );
        assert.deepEqual(
          await readFile(join(stage.path, `${projectName}-biz/asset.bin`)),
          Buffer.from([0, 255, 1]),
        );
        assert.ok((await lstat(join(stage.path, `${projectName}-biz/run.sh`))).mode & 0o111);
        assert.ok(stage.files.some((file) => file.path === `docker/${projectName}-web.yaml`));
        assert.ok(!stage.files.some((file) => file.path.includes('__PROJECT_NAME__')));
        await rm(stage.path, { recursive: true });
      }
    },
  );
});

test('tokens used only in paths are valid without text rendering', async () => {
  await withArchive(
    template(['__PROJECT_NAME__-web']),
    [file('__PROJECT_NAME__-web/.gitignore', 'target/\n')],
    async (root, archive, digest) => {
      const stage = await stageProject(archive, digest, { projectName: 'demo' }, root);
      assert.equal(await readFile(join(stage.path, 'demo-web/.gitignore'), 'utf8'), 'target/\n');
    },
  );
});

test('rendered paths reject file, directory, case and Unicode collisions and remove staging', async () => {
  for (const [paths, entries] of [
    [['__PROJECT_NAME__-web'], [file('__PROJECT_NAME__-web/a'), file('demo-web/a')]],
    [['__PROJECT_NAME__-web'], [file('__PROJECT_NAME__-web/a'), file('DEMO-web/b')]],
    [['__PROJECT_NAME__-web'], [file('__PROJECT_NAME__-web/a'), file('demo-web')]],
    [['__PROJECT_NAME__-web'], [file('__PROJECT_NAME__-web'), file('demo-web/a')]],
    [['__PROJECT_NAME__-é'], [file('__PROJECT_NAME__-é/a'), file('demo-e\u0301/b')]],
  ] as [string[], ArchiveFile[]][]) {
    await withArchive(template(paths), entries, async (root, archive, digest) => {
      await assert.rejects(
        stageProject(archive, digest, { projectName: 'demo' }, root),
        /渲染路径冲突/,
      );
      assert.ok(!(await readdir(root)).some((name) => name.startsWith('.charon-forge-stage-')));
    });
  }
});

test('undeclared, unresolved and reserved rendered paths cannot bypass safety checks', async () => {
  for (const [paths, entries, projectName] of [
    [[], [file('__PROJECT_NAME__-web/a')], 'demo'],
    [['__PROJECT_NAME__-web'], [file('__PROJECT_NAME__-web/__OTHER__/a')], 'demo'],
    [['__PROJECT_NAME__'], [file('__PROJECT_NAME__/a')], 'dist'],
    [['__PROJECT_NAME__'], [file('__PROJECT_NAME__/a')], 'con'],
    [['__PROJECT_NAME__'], [file('__PROJECT_NAME__/a')], '../escape'],
    [['__PROJECT_NAME__-web'], [file('static/a')], 'demo'],
  ] as [string[], ArchiveFile[], string][]) {
    await withArchive(template(paths), entries, async (root, archive, digest) => {
      await assert.rejects(stageProject(archive, digest, { projectName }, root), isForgeError);
      assert.ok(!(await readdir(root)).some((name) => name.startsWith('.charon-forge-stage-')));
      assert.ok(!(await readdir(root)).includes('escape'));
    });
  }
});

test('path declarations require mapped tokens, exact non-nested paths and compatible CLI', () => {
  for (const paths of [
    ['fixed'],
    ['__OTHER__'],
    ['../__PROJECT_NAME__'],
    ['__PROJECT_NAME__/*'],
    ['__PROJECT_NAME__-web', '__PROJECT_NAME__-web/nested'],
  ])
    assert.throws(() => validateTemplate(template(paths)), isForgeError);
  assert.throws(
    () => validateTemplate({ ...template(['__PROJECT_NAME__-web']), minCliVersion: '0.1.1' }),
    /minCliVersion/,
  );
  assert.throws(
    () => validateTemplate({ ...template([]), minCliVersion: '0.1.1' }),
    /minCliVersion/,
  );
});

test('packing rejects path rules that do not match the published files', async () => {
  const f = await fixture();
  try {
    await writeFile(
      join(f.directory, 'template.json'),
      JSON.stringify(template(['__PROJECT_NAME__-missing'], ['README.md'])),
    );
    await assert.rejects(
      packTemplate(f.root, f.directory, join(f.root, 'bad.tgz')),
      /渲染路径未包含在发布集合/,
    );
  } finally {
    await f.cleanup();
  }
});
