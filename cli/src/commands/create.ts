import { Command, CommanderError } from 'commander';
import * as prompts from '@clack/prompts';
import { basename, dirname } from 'node:path';
import {
  RemoteStore,
  resolveTemplate,
  recommended,
  type Distribution,
  type NetworkOptions,
} from '../core/distribution.js';
import { stageProject } from '../core/archive.js';
import { canonicalTarget, commitProject } from '../core/commit.js';
import { installProject, installArgv } from '../core/install.js';
import {
  resolveInputs,
  validateInput,
  type Inputs,
  type Template,
} from '../core/protocol/index.js';
import { fail, ForgeError, exitCode } from '../core/errors.js';
function answer<T>(value: T): Exclude<T, symbol> {
  if (prompts.isCancel(value)) fail('E_CANCELLED', 'prompt', '操作已取消。');
  return value as Exclude<T, symbol>;
}
async function inputPrompt(
  key: string,
  rule: Template['inputs'][string],
  initialValue?: string,
): Promise<string> {
  return answer(
    await prompts.text({
      message: key === 'projectName' ? '项目名称' : key,
      initialValue,
      validate(value) {
        try {
          validateInput(key, rule, value ?? '');
        } catch (error) {
          if (error instanceof ForgeError) return error.message;
          throw error;
        }
      },
    }),
  );
}
export function parseInputs(items: string[]): Inputs {
  const inputs: Inputs = {};
  for (const item of items) {
    const index = item.indexOf('=');
    const key = item.slice(0, index);
    if (
      index < 1 ||
      key === 'projectName' ||
      Object.hasOwn(inputs, key) ||
      ['__proto__', 'constructor', 'prototype'].includes(key)
    )
      fail('E_INPUT', 'inputs', '--input 必须是唯一 key=value，项目名称使用 --name。');
    Object.defineProperty(inputs, key, {
      value: item.slice(index + 1),
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  return inputs;
}
export async function runCLI(
  argv: string[],
  version: string,
  config: Distribution,
  network: NetworkOptions = {},
): Promise<number> {
  const program = new Command()
    .name('create-charon-forge')
    .version(version)
    .argument('[directory]')
    .option('--list', '列出可用模板')
    .option('--template <id>', '模板 ID')
    .option('--template-version <version>', '模板精确版本')
    .option('--name <projectName>', '项目名称')
    .option(
      '--input <key=value>',
      '模板公开输入（可重复）',
      (value: string, old: string[]) => [...old, value],
      [],
    )
    .option('--package-manager <name>', '模板支持的包管理器')
    .option('--install', '安装依赖')
    .option('--no-install', '只生成文件')
    .option('-y, --yes', '使用已有默认值，不交互');
  program.exitOverride();
  try {
    program.parse(argv, { from: 'user' });
    const options = program.opts<{
      list?: boolean;
      template?: string;
      templateVersion?: string;
      name?: string;
      input: string[];
      packageManager?: string;
      install?: boolean;
      yes?: boolean;
    }>();
    const hasInstall = argv.includes('--install'),
      noInstall = argv.includes('--no-install');
    if (hasInstall && noInstall)
      fail('E_INPUT', 'args', '--install 与 --no-install 不能同时使用。');
    if (
      options.list &&
      (program.args.length ||
        options.template ||
        options.templateVersion ||
        options.name ||
        options.input.length ||
        hasInstall ||
        noInstall ||
        options.packageManager)
    )
      fail('E_INPUT', 'args', '--list 不能与创建参数组合。');
    const controller = new AbortController();
    const abort = () => controller.abort();
    process.once('SIGINT', abort);
    try {
      const store = new RemoteStore(config, { ...network, signal: controller.signal });
      const snapshot = await store.loadCatalog();
      if (snapshot.offline) console.error(`使用已校验离线快照：${snapshot.catalog.catalogVersion}`);
      const available = Object.keys(snapshot.catalog.templates).filter((id) =>
        recommended(snapshot.catalog, id, version),
      );
      if (options.list) {
        if (!available.length) console.log('暂无可用模板。');
        for (const id of available) {
          const meta = recommended(snapshot.catalog, id, version)!;
          console.log(`${id}\t${meta.version}\t${meta.name}`);
        }
        return 0;
      }
      if (!Object.keys(snapshot.catalog.templates).length)
        fail('E_INPUT', 'resolve', '暂无可用模板。请在模板加入分发目录后重试。');
      const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY && !options.yes);
      let id = options.template;
      let directory = program.args[0];
      if (!id && interactive) {
        const categories = [
          ...new Set(
            available.map(
              (key) =>
                snapshot.catalog.templates[key]!.versions[
                  recommended(snapshot.catalog, key, version)!.version
                ]!.category,
            ),
          ),
        ];
        if (!categories.length) fail('E_COMPAT', 'resolve', '没有兼容推荐模板，请升级 CLI。');
        const category = answer(
          await prompts.select({
            message: '选择项目类型',
            options: categories.map((value) => ({ value, label: value })),
          }),
        );
        id = answer(
          await prompts.select({
            message: '选择模板',
            options: available
              .filter((key) => recommended(snapshot.catalog, key, version)!.category === category)
              .map((value) => ({
                value,
                label: recommended(snapshot.catalog, value, version)!.name,
              })),
          }),
        );
      }
      if (!directory && interactive)
        directory = answer(await prompts.text({ message: '新项目目录' }));
      if (!id || !directory)
        fail('E_INPUT', 'args', '缺少 directory 或 --template；非交互模式不会猜测必填值。');
      const meta = resolveTemplate(snapshot.catalog, id, version, options.templateVersion);
      const target = await canonicalTarget(directory);
      const archive = await store.download(meta, snapshot.offline);
      let shouldInstall = hasInstall;
      const stage = await stageProject(
        archive,
        meta.sha256,
        async (template: Template) => {
          const values = parseInputs(options.input);
          values.projectName = options.name ?? basename(target);
          if (interactive) {
            values.projectName = await inputPrompt(
              'projectName',
              template.inputs.projectName!,
              values.projectName,
            );
            for (const [key, rule] of Object.entries(template.inputs))
              if (key !== 'projectName' && values[key] === undefined) {
                if (rule.default !== undefined) values[key] = rule.default;
                else if (rule.required) values[key] = await inputPrompt(key, rule);
              }
          }
          const normalized = resolveInputs(template, values);
          if (
            options.packageManager &&
            !template.install.packageManagers?.includes(
              options.packageManager as 'pnpm' | 'npm' | 'yarn',
            )
          )
            fail('E_INPUT', 'args', '模板不支持指定的包管理器。');
          if (interactive && !hasInstall && !noInstall && template.install.adapter !== 'manual')
            shouldInstall = answer(
              await prompts.confirm({ message: '安装依赖？', initialValue: false }),
            );
          if (
            interactive &&
            !answer(
              await prompts.confirm({
                message: `创建 ${target}\n${meta.id}@${meta.version}\n参数 ${JSON.stringify(normalized)}\n安装依赖：${shouldInstall ? '是' : '否'}`,
                initialValue: true,
              }),
            )
          )
            fail('E_CANCELLED', 'prompt', '操作已取消。');
          return normalized;
        },
        dirname(target),
        meta,
        controller.signal,
      );
      const project = await commitProject(
        stage,
        target,
        {
          schemaVersion: 1,
          source: 'catalog',
          cliVersion: version,
          templateId: meta.id,
          templateVersion: meta.version,
          catalogVersion: snapshot.catalog.catalogVersion,
          catalogSha256: snapshot.digest,
          artifactSha256: meta.sha256,
          inputs: stage.inputs,
          createdAt: new Date().toISOString(),
        },
        controller.signal,
      );
      console.log(`已创建 ${meta.id}@${meta.version}\n${project}`);
      if (shouldInstall)
        await installProject(
          stage.template,
          project,
          options.packageManager,
          undefined,
          controller.signal,
        );
      const action = installArgv(stage.template, options.packageManager);
      console.log(`下一步：进入 ${JSON.stringify(project)}，查看 README.md。`);
      if (action && !shouldInstall)
        console.log(`安装命令：${action.tool} ${action.args.join(' ')}`);
      return 0;
    } finally {
      process.removeListener('SIGINT', abort);
    }
  } catch (error) {
    if (error instanceof CommanderError)
      return ['commander.helpDisplayed', 'commander.version'].includes(error.code) ? 0 : 2;
    console.error(
      error instanceof ForgeError
        ? `[${error.code}] ${error.message}`
        : '[E_INTERNAL] 操作未完成，请检查运行环境或联系维护者。',
    );
    return exitCode(error);
  }
}
