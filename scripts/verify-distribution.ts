import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm, readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execute } from './lib/args.js';
import { toolCommand } from '../cli/src/core/install.js';
const exec = promisify(execFile);
await execute(async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const temp = await mkdtemp(join(tmpdir(), 'charon-forge-distribution-'));
  const npm = await toolCommand('npm');
  const npmRun = (args: string[], cwd: string) =>
    exec(npm.command, [...npm.prefix, ...args], {
      cwd,
      timeout: 180_000,
      maxBuffer: 2 * 1024 ** 2,
      shell: false,
    });
  try {
    const result = await npmRun(
      ['pack', '--ignore-scripts', '--json', '--pack-destination', temp],
      root,
    );
    const [pack] = JSON.parse(result.stdout) as { filename: string; files: { path: string }[] }[];
    if (!pack) throw new Error('npm pack did not return metadata');
    for (const file of pack.files)
      if (!['package.json', 'README.md'].includes(file.path) && !file.path.startsWith('dist/cli/'))
        throw new Error(`不应进入 CLI 包：${file.path}`);
    const consumer = join(temp, 'consumer');
    await mkdir(consumer);
    await npmRun(
      ['install', '--ignore-scripts', '--no-audit', '--no-fund', join(temp, pack.filename)],
      consumer,
    );
    const entry = join(consumer, 'node_modules/create-charon-forge/dist/cli/index.js');
    const binVersion = await npmRun(
      ['exec', '--offline', '--no', '--', 'create-charon-forge', '--version'],
      consumer,
    );

    const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as {
      version: string;
    };
    if (binVersion.stdout.trim() !== pkg.version) throw new Error('npm bin invocation failed');
    const version = await exec(process.execPath, [entry, '--version'], { cwd: consumer });
    if (version.stdout.trim() !== pkg.version) throw new Error('实际 npm 包版本输出不一致。');
    const help = await exec(process.execPath, [entry, '--help'], { cwd: consumer });
    if (!help.stdout.includes('--template')) throw new Error('实际 npm 包缺少 CLI 参数。');
    // The unconfigured framework must list cleanly without a published template source.
    const config = JSON.parse(await readFile(join(root, 'forge.config.json'), 'utf8')) as {
      channelUrl: string | null;
    };
    if (config.channelUrl === null) {
      const list = await exec(process.execPath, [entry, '--list'], { cwd: consumer });
      if (!list.stdout.includes('暂无可用模板')) throw new Error('空仓库列表行为不一致。');
    }
    console.log(
      `真实 npm tarball 验证通过：${pack.files.length} 个发布文件；仓库外安装、版本和帮助通过。${config.channelUrl === null ? '空目录列表通过。' : '公开分发链路由发布 workflow 另行验证。'}`,
    );
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
