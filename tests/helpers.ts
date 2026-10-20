import { mkdtemp, realpath, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { validateTemplate, type Template } from '../cli/src/core/protocol/index.js';
import { packTemplate } from '../scripts/lib/template-pack.js';
export const descriptor = (): Template =>
  validateTemplate({
    schemaVersion: 1,
    id: 'fixture-plain',
    version: '1.0.0',
    name: 'Plain fixture',
    category: 'fixture',
    layout: 'single',
    tags: [],
    minCliVersion: '0.1.0',
    source: 'files',
    inputs: { projectName: { type: 'string', required: true } },
    render: { tokens: { __PROJECT_NAME__: 'projectName' }, files: ['README.md'] },
    publish: { include: ['**/*'] },
    requirements: [],
    install: { adapter: 'manual' },
    verify: [],
  });
export async function temporary(): Promise<string> {
  return realpath(await mkdtemp(join(tmpdir(), 'charon-forge-test-')));
}
export async function fixture() {
  const root = await temporary();
  const directory = join(root, 'templates/fixture/plain');
  await mkdir(join(directory, 'files'), { recursive: true });
  const template = descriptor();
  await writeFile(join(directory, 'template.json'), JSON.stringify(template, null, 2) + '\n');
  await writeFile(join(directory, 'files/README.md'), '# __PROJECT_NAME__\n');
  await writeFile(join(directory, 'files/.env.example'), 'DEMO=1\n');
  await writeFile(join(directory, 'files/asset.bin'), Buffer.from([0, 1, 2, 255]));
  execFileSync('git', ['init', '--quiet'], { cwd: root });
  execFileSync('git', ['add', 'templates'], { cwd: root });
  const archive = join(root, 'test.tgz');
  const packed = await packTemplate(root, directory, archive);
  return {
    root,
    directory,
    template,
    archive,
    packed,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}
