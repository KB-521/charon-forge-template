import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2];
if (!['static', 'package'].includes(mode)) throw new Error('Expected static or package');
const webOutput = join(root, 'web', 'dist');
const serverOutput = join(root, 'server', 'dist', 'main.js');
if (!existsSync(webOutput) || !existsSync(serverOutput))
  throw new Error('Run pnpm build before packaging');

const publicDirectory = join(root, 'server', 'public');
rmSync(publicDirectory, { recursive: true, force: true });
cpSync(webOutput, publicDirectory, { recursive: true });

if (mode === 'package') {
  const output = join(root, 'package-output');
  rmSync(output, { recursive: true, force: true });
  // npm_execpath points to the pinned pnpm JS entry on every platform.
  if (!process.env.npm_execpath) throw new Error('Run packaging through pnpm package');
  execFileSync(
    process.execPath,
    [process.env.npm_execpath, '--filter', './server', 'deploy', '--legacy', '--prod', output],
    {
      cwd: root,
      stdio: 'inherit',
    },
  );
  const configOutput = join(output, 'docker');
  mkdirSync(configOutput, { recursive: true });
  for (const profile of ['dev', 'prod']) {
    cpSync(join(root, 'docker', `env.${profile}.yaml`), join(configOutput, `env.${profile}.yaml`));
  }
  console.log('Standalone service: package-output (node dist/main.js)');
}
