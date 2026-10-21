import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { delimiter, join } from 'node:path';
import semver from 'semver';
import { ForgeError, cancelled, fail } from './errors.js';
import type { Template } from './protocol/index.js';
export type ProcessRunner = (
  command: string,
  args: string[],
  cwd: string,
  signal?: AbortSignal,
) => Promise<{ code: number; output: string }>;
export const runProcess: ProcessRunner = (command, args, cwd, signal) =>
  new Promise((resolveResult, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      signal,
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk: Buffer) => {
      if (output.length < 64 * 1024) output += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      if (output.length < 64 * 1024) output += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => resolveResult({ code: code ?? 1, output }));
  });
export async function toolCommand(
  tool: string,
  platform = process.platform,
): Promise<{ command: string; prefix: string[] }> {
  if (!['node', 'npm', 'pnpm', 'yarn', 'uv'].includes(tool))
    fail('E_TOOL', 'install', `不支持自动检测工具：${tool}，请按模板说明手动安装。`);
  if (tool === 'node') return { command: process.execPath, prefix: [] };
  if (platform !== 'win32') return { command: tool, prefix: [] };
  if (tool === 'uv') return { command: 'uv.exe', prefix: [] };
  const candidates: string[] = [];
  for (const base of (process.env.PATH ?? '').split(delimiter)) {
    candidates.push(join(base, `${tool}.cjs`), join(base, `${tool}.js`));
    if (tool === 'npm') candidates.push(join(base, 'node_modules/npm/bin/npm-cli.js'));
    if (tool === 'pnpm') candidates.push(join(base, 'node_modules/pnpm/bin/pnpm.cjs'));
    if (tool === 'yarn') candidates.push(join(base, 'node_modules/yarn/bin/yarn.js'));
  }
  for (const file of candidates)
    try {
      await access(file);
      return { command: process.execPath, prefix: [file] };
    } catch {
      /* Try the next known JS entry. */
    }
  fail('E_TOOL', 'install', `无法安全解析 Windows ${tool} 入口。请在生成目录手动运行安装命令。`);
}
export function installArgv(
  template: Template,
  manager?: string,
): { tool: string; args: string[] } | null {
  if (template.install.adapter === 'manual') return null;
  if (template.install.adapter === 'python-uv')
    return { tool: 'uv', args: ['sync', '--frozen', '--no-python-downloads'] };
  const selected = manager ?? template.install.packageManagers?.[0];
  if (!selected || !template.install.packageManagers?.includes(selected as 'pnpm' | 'npm' | 'yarn'))
    fail('E_INPUT', 'install', '模板不支持所选包管理器。');
  return {
    tool: selected,
    args:
      selected === 'pnpm'
        ? ['install', '--no-frozen-lockfile']
        : selected === 'npm'
          ? ['ci']
          : ['install', '--immutable'],
  };
}
export async function installProject(
  template: Template,
  cwd: string,
  manager?: string,
  runner: ProcessRunner = runProcess,
  signal?: AbortSignal,
): Promise<void> {
  const action = installArgv(template, manager);
  if (!action) return;
  cancelled(signal);
  const reqs = template.requirements.filter((r) => r.phase === 'install');
  for (const req of reqs) {
    const executable = await toolCommand(req.tool);
    let output: string;
    try {
      const check = await runner(
        executable.command,
        [...executable.prefix, '--version'],
        cwd,
        signal,
      );
      if (check.code !== 0) throw new Error('version check failed');
      output = check.output;
    } catch {
      cancelled(signal);
      fail('E_TOOL', 'install', `项目已生成，但缺少工具 ${req.tool}。`);
    }
    const v = semver.coerce(output);
    if (!v || !semver.satisfies(v, req.range))
      fail('E_TOOL', 'install', `项目已生成，${req.tool} 需要 ${req.range}。`);
  }
  const command = await toolCommand(action.tool);
  try {
    const result = await runner(command.command, [...command.prefix, ...action.args], cwd, signal);
    if (result.code !== 0) throw new ForgeError('E_INSTALL', 'install', '安装返回非零状态。');
  } catch {
    cancelled(signal);
    fail(
      'E_INSTALL',
      'install',
      `项目已生成：${cwd}。安装未完成，可在该目录重试：${action.tool} ${action.args.join(' ')}`,
    );
  }
}
