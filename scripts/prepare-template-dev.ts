import { mkdtemp, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, relative, isAbsolute } from 'node:path';
import { execFileSync } from 'node:child_process';
import { discoverTemplates, packTemplate } from './lib/template-pack.js';
import { stageProject } from '../cli/src/core/archive.js';
import { canonicalTarget, commitProject } from '../cli/src/core/commit.js';
import { installArgv } from '../cli/src/core/install.js';
import { parseInputs } from '../cli/src/commands/create.js';
import { fail } from '../cli/src/core/errors.js';
import { command, execute, packageVersion } from './lib/args.js';
const program = command('template:dev')
  .requiredOption('--template <id>', '本地模板 ID')
  .requiredOption('--output <directory>', '仓库外的新目录')
  .option('--name <name>', '项目名称', 'template-dev')
  .option('--input <key=value>', '模板输入', (v: string, old: string[]) => [...old, v], [])
  .parse(process.argv.filter((a, i) => i !== 2 || a !== '--'));
await execute(async () => {
  const options = program.opts<{
    template: string;
    output: string;
    name: string;
    input: string[];
  }>();
  const root = await realpath(process.cwd());
  const output = await canonicalTarget(options.output);
  const rel = relative(root, output);
  if (
    !rel ||
    (!rel.startsWith('..' + (process.platform === 'win32' ? '\\' : '/')) &&
      rel !== '..' &&
      !isAbsolute(rel))
  )
    fail('E_INPUT', 'dev', '开发工程必须位于仓库外。');
  const item = (await discoverTemplates(root)).find((t) => t.template.id === options.template);
  if (!item) fail('E_INPUT', 'dev', `未知本地模板：${options.template}。请先导入模板。`);
  const temp = await mkdtemp(join(tmpdir(), 'charon-forge-dev-'));
  try {
    const archive = join(temp, 'template.tgz');
    const packed = await packTemplate(root, item.directory, archive);
    const inputs = { ...parseInputs(options.input), projectName: options.name };
    const stage = await stageProject(archive, packed.digest, inputs, dirname(output));
    const project = await commitProject(stage, output, {
      schemaVersion: 1,
      source: 'local-dev',
      cliVersion: await packageVersion(),
      templateId: item.template.id,
      templateVersion: item.template.version,
      catalogVersion: null,
      catalogSha256: null,
      artifactSha256: packed.digest,
      inputs: stage.inputs,
      sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: root,
        encoding: 'utf8',
      }).trim(),
      createdAt: new Date().toISOString(),
    });
    const action = installArgv(item.template);
    console.log(
      `开发工程：${project}\n${action ? `安装：${action.tool} ${action.args.join(' ')}` : '按生成工程 README.md 安装。'}\n启动/构建/测试命令见生成工程 README.md。不会自动安装、启动或回写。`,
    );
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
