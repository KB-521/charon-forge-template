import { spawnSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
const first = process.env.FIRST_RELEASE === 'true';
const history = await readdir('dist/history');
if (first && history.length)
  throw new Error('Published history exists; first_release is not valid.');
const args = [
  'exec',
  'tsx',
  'scripts/prepare-release.ts',
  '--catalog-version',
  process.env.CATALOG_VERSION ?? '',
  '--base-url',
  process.env.BASE_URL ?? '',
  ...(first ? ['--first-release'] : ['--history', 'dist/history']),
];
const result = spawnSync('pnpm', args, { stdio: 'inherit', shell: false });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
