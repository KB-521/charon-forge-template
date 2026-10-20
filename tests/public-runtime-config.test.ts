import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { forbiddenPath } from '../cli/src/core/protocol/index.js';
import { stageProject } from '../cli/src/core/archive.js';
import { packTemplate } from '../scripts/lib/template-pack.js';
import { fixture } from './helpers.js';

test('public Docker profiles are allowed only at the two exact payload paths', () => {
  for (const path of ['docker-config/.env.dev', 'docker-config/.env.prod', '.env.example'])
    assert.equal(forbiddenPath(path), false, path);
  for (const path of [
    '.env',
    '.env.dev',
    '.env.prod',
    '.env.local',
    'docker-config/.env.local',
    'docker-config/.env.production',
    'docker-config/.env.dev.local',
    'other/.env.dev',
    'nested/docker-config/.env.prod',
    'node_modules/docker-config/.env.dev',
  ])
    assert.equal(forbiddenPath(path), true, path);
});

test('public Docker dotenv profiles survive packing and extraction', async () => {
  const f = await fixture();
  try {
    const profiles = join(f.directory, 'files/docker-config');
    await mkdir(profiles);
    for (const [profile, marker] of [
      ['dev', 'DEV'],
      ['prod', 'PROD'],
    ])
      await writeFile(join(profiles, `.env.${profile}`), `ENV=${marker}\nBASE_URL=/api\n`);
    execFileSync('git', ['add', 'templates'], { cwd: f.root });
    const archive = join(f.root, 'profiles.tgz');
    const packed = await packTemplate(f.root, f.directory, archive);
    const stage = await stageProject(
      archive,
      packed.digest,
      { projectName: 'sample-app' },
      f.root,
    );
    for (const [profile, marker] of [
      ['dev', 'DEV'],
      ['prod', 'PROD'],
    ])
      assert.equal(
        await readFile(join(stage.path, 'docker-config', `.env.${profile}`), 'utf8'),
        `ENV=${marker}\nBASE_URL=/api\n`,
      );
  } finally {
    await f.cleanup();
  }
});
