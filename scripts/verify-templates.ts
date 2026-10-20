import { mkdtemp, rm, realpath, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { discoverTemplates, packTemplate } from './lib/template-pack.js';
import { stageProject, sha256 } from '../cli/src/core/archive.js';
import { commitProject } from '../cli/src/core/commit.js';
import { toolCommand } from '../cli/src/core/install.js';
import { parseInputs } from '../cli/src/commands/create.js';
import { fail } from '../cli/src/core/errors.js';
import { command, execute, packageVersion } from './lib/args.js';
const exec = promisify(execFile);
const program = command('verify:templates')
  .option('--template <id>', '指定模板')
  .option('--template-version <version>', '验证发布归档的版本（不回写模板）')
  .option('--input <key=value>', '模板公开输入', (v: string, old: string[]) => [...old, v], [])
  .option('--native', '执行受信任模板声明的 verify 命令')
  .parse(process.argv.filter((a, i) => i !== 2 || a !== '--'));
await execute(async () => {
  const options = program.opts<{
    template?: string;
    templateVersion?: string;
    input: string[];
    native?: boolean;
  }>();
  if (options.templateVersion && !options.template)
    fail('E_INPUT', 'verify', '--template-version 必须同时指定 --template。');
  const overrides = options.templateVersion ? { version: options.templateVersion } : {};
  const root = process.cwd();
  let templates = await discoverTemplates(root);
  if (options.template && !templates.some((t) => t.template.id === options.template))
    fail('E_INPUT', 'verify', `未知模板：${options.template}`);
  templates = templates.filter((t) => !options.template || t.template.id === options.template);
  const temp = await realpath(await mkdtemp(join(tmpdir(), 'charon-forge-verify-')));
  try {
    for (const item of templates) {
      const first = await packTemplate(
        root,
        item.directory,
        join(temp, `${item.template.id}-before.tgz`),
        overrides,
      );
      const inputs = { ...parseInputs(options.input), projectName: 'verify-project' };
      const stage = await stageProject(
        join(temp, `${item.template.id}-before.tgz`),
        first.digest,
        inputs,
        temp,
      );
      const project = await commitProject(stage, join(temp, item.template.id), {
        schemaVersion: 1,
        source: 'local-dev',
        cliVersion: await packageVersion(),
        templateId: item.template.id,
        templateVersion: item.template.version,
        catalogVersion: null,
        catalogSha256: null,
        artifactSha256: first.digest,
        inputs: stage.inputs,
        createdAt: new Date().toISOString(),
      });
      if (options.native)
        for (const step of item.template.verify) {
          const [tool, ...args] = step.argv;
          if (!tool) throw new Error('empty argv');
          // Only trusted repository verification runs commands. Shell scripts never use shell:true.
          const resolved =
            process.platform === 'win32' ? await toolCommand(tool) : { command: tool, prefix: [] };
          console.log(`${item.template.id}: ${step.argv.join(' ')}`);
          try {
            const result = await exec(resolved.command, [...resolved.prefix, ...args], {
              cwd: project,
              timeout: 300_000,
              maxBuffer: 1024 ** 2,
              shell: false,
            });
            if (result.stdout) process.stdout.write(result.stdout);
            if (result.stderr) process.stderr.write(result.stderr);
          } catch (error) {
            const result = error as { stdout?: string; stderr?: string };
            if (result.stdout) process.stdout.write(result.stdout);
            if (result.stderr) process.stderr.write(result.stderr);
            throw error;
          }
        }
      const after = await packTemplate(
        root,
        item.directory,
        join(temp, `${item.template.id}-after.tgz`),
        overrides,
      );
      if (first.digest !== after.digest)
        fail('E_INTEGRITY', 'verify', `基础模板被运行过程修改：${item.template.id}`);
      const fresh = await stageProject(
        join(temp, `${item.template.id}-after.tgz`),
        after.digest,
        inputs,
        temp,
      );
      await rm(fresh.path, { recursive: true, force: true });
      console.log(
        `${item.template.id}: 生成与防污染通过${options.native ? '，原生 verify 通过' : ''}`,
      );
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
  console.log(
    `隔离验证完成：${templates.length} 个模板。${options.native ? '' : '原生 verify 未执行；需要时显式 --native。'}`,
  );
});
