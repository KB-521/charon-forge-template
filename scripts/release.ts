import * as prompts from '@clack/prompts';
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import semver from 'semver';
import { validateCatalog, type Catalog } from '../cli/src/core/protocol/index.js';
import { command, execute } from './lib/args.js';
import {
  detectTemplateChanges,
  selectTemplate,
  repositoryName,
  type ReleasePlan,
} from './lib/release-plan.js';
import { GitHubClient, output, pause, type WorkflowRun } from './lib/release-github.js';

function answer<T>(value: T): Exclude<T, symbol> {
  if (prompts.isCancel(value)) {
    prompts.cancel('已取消，未触发发布。');
    process.exit(0);
  }
  return value as Exclude<T, symbol>;
}
const program = command('release')
  .description('交互选择增量模板和 CLI，并通过 GitHub Actions 发布')
  .option('--dry-run', '只检查变化，不触发外发')
  .option('--history <directory>', '离线预览的历史 catalog 目录（仅 --dry-run）')
  .parse(process.argv.filter((a, i) => i !== 2 || a !== '--'));
await execute(async () => {
  const options = program.opts<{ dryRun?: boolean; history?: string }>();
  if (options.history && !options.dryRun)
    throw new Error('--history 只能用于 --dry-run 离线预览。');
  const origin = await output('git', ['remote', 'get-url', 'origin']);
  const match = /^(?:https:\/\/github\.com\/|git@github\.com:)([^/]+\/[^/]+?)(?:\.git)?\/?$/.exec(
    origin,
  );
  if (!match) throw new Error('origin 必须指向 github.com 上的发布仓库。');
  const repository = repositoryName(match[1]!);
  const gh = new GitHubClient(repository);
  const sha = await output('git', ['rev-parse', 'HEAD']);
  prompts.intro('Charon Forge 发布');
  let branch = '';
  let history: Catalog[];
  if (options.history) {
    history = [];
    for (const file of await readdir(options.history))
      if (file.endsWith('.json'))
        history.push(
          validateCatalog(JSON.parse(await readFile(join(options.history, file), 'utf8'))),
        );
  } else {
    try {
      await output('gh', ['auth', 'status', '--hostname', 'github.com']);
    } catch {
      throw new Error(
        '请先安装 GitHub CLI 并运行 gh auth login；离线预览可用 pnpm release --dry-run --history <目录>。',
      );
    }
    const remote = await gh.json<{ default_branch: string }>(`repos/${repository}`);
    branch = remote.default_branch;
    if (!options.dryRun) {
      if (await output('git', ['status', '--porcelain']))
        throw new Error('请先提交并推送修改，再运行 pnpm release。');
      if ((await output('git', ['branch', '--show-current'])) !== branch)
        throw new Error(`请在默认分支 ${branch} 发布。`);
      const remoteHead = await gh.json<{ object: { sha: string } }>(
        `repos/${repository}/git/ref/heads/${encodeURIComponent(branch)}`,
      );
      if (remoteHead.object.sha !== sha)
        throw new Error('本地提交与远端默认分支不一致，请先同步并推送。');
    }
    prompts.log.info('正在读取正式发布历史并检测模板变化…');
    history = (await gh.history()).map((entry) => entry.catalog);
  }
  const historyDirectory = options.history;
  const changes = await detectTemplateChanges(
    process.cwd(),
    history,
    historyDirectory
      ? async (version) => {
          const path = join(historyDirectory, `${version.id}-${version.version}.tgz`);
          try {
            return await readFile(path);
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT')
              throw new Error(`离线比较需要历史模板归档：${path}`);
            throw error;
          }
        }
      : undefined,
  );
  for (const item of changes) {
    const status = { new: '首次发布', changed: '有更新', unchanged: '无变化，跳过' }[item.status];
    prompts.log.info(
      `${item.template.id}  ${item.previousVersion ?? '未发布'}${item.status === 'unchanged' ? '' : ` → ${item.suggestedVersion}`}  ${status}`,
    );
  }
  if (options.dryRun) {
    prompts.outro('预览完成，未修改版本或触发发布。');
    return;
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error('请在交互终端运行 pnpm release；预览可使用 --dry-run。');
  const scope = answer(
    await prompts.select({
      message: '发布什么？',
      options: [
        { value: 'templates', label: '模板' },
        { value: 'cli', label: 'CLI' },
        { value: 'all', label: '全部（只发布变化部分）' },
      ],
    }),
  );
  const plan: ReleasePlan = {
    schemaVersion: 1,
    repository,
    sha,
    requestId: randomUUID(),
    templates: [],
    cli: scope !== 'templates',
  };
  const changed = changes.filter((item) => item.status !== 'unchanged');
  if (scope !== 'cli' && changed.length) {
    const selected = answer(
      await prompts.multiselect({
        message: '选择本次发布的模板（空格切换）',
        required: false,
        initialValues: changed.map((item) => item.template.id),
        options: changed.map((item) => ({
          value: item.template.id,
          label: `${item.template.id} → ${item.suggestedVersion}`,
        })),
      }),
    );
    for (const id of selected) {
      const item = changed.find((change) => change.template.id === id)!;
      const bump = answer(
        await prompts.select({
          message: `${id} 的发布版本`,
          options: [
            { value: 'suggested', label: `${item.suggestedVersion}（建议）` },
            ...(item.previousVersion
              ? [
                  {
                    value: 'minor',
                    label: `${semver.inc(item.previousVersion, 'minor')}（minor）`,
                  },
                  {
                    value: 'major',
                    label: `${semver.inc(item.previousVersion, 'major')}（major）`,
                  },
                ]
              : []),
            { value: 'custom', label: '指定版本' },
          ],
        }),
      );
      const version =
        bump === 'custom'
          ? answer(
              await prompts.text({
                message: '版本号',
                initialValue: item.suggestedVersion,
                validate: (value) => {
                  try {
                    selectTemplate(item, value ?? '');
                  } catch (error) {
                    return (error as Error).message;
                  }
                },
              }),
            )
          : bump === 'suggested'
            ? item.suggestedVersion
            : semver.inc(item.previousVersion!, bump as 'minor' | 'major')!;
      plan.templates.push(selectTemplate(item, version));
    }
  }
  const pkg = JSON.parse(await readFile('package.json', 'utf8')) as {
    name: string;
    version: string;
  };
  if (!plan.cli && !plan.templates.length && !history.length) {
    prompts.outro('本次未选择发布项。');
    return;
  }
  prompts.note(
    [
      `仓库：${repository}`,
      `提交：${sha}`,
      ...plan.templates.map((item) => `模板：${item.id}@${item.version}`),
      ...(plan.cli ? [`CLI：${pkg.name}@${pkg.version}（已发布且内容相同则跳过）`] : []),
      ...(!plan.templates.length ? ['模板：不上传新包，核验并同步已有下载入口'] : []),
    ].join('\n'),
    '本次发布',
  );
  if (!answer(await prompts.confirm({ message: '确认触发正式发布？', initialValue: false }))) {
    prompts.cancel('已取消。');
    return;
  }
  await gh.dispatch(plan, branch);
  prompts.log.info(`已触发。请求编号：${plan.requestId}`);
  let run: WorkflowRun | undefined;
  for (let attempt = 0; attempt < 30; attempt++) {
    run = await gh.findRun(plan);
    if (run) break;
    await pause(2000);
  }
  if (!run)
    throw new Error(
      `发布已触发，运行链接暂未出现。请在 https://github.com/${repository}/actions 查找 Release ${plan.requestId}，不要重复触发。`,
    );
  prompts.log.info(run.html_url);
  const deadline = Date.now() + 2 * 60 * 60_000;
  let previous = '';
  while (run.status !== 'completed') {
    if (Date.now() > deadline) throw new Error(`等待超时，发布仍由 Actions 管理：${run.html_url}`);
    if (run.status !== previous) {
      prompts.log.info(`发布状态：${run.status}`);
      previous = run.status;
    }
    await pause(5000);
    run = await gh.json<WorkflowRun>(`repos/${repository}/actions/runs/${run.id}`);
  }
  if (run.conclusion !== 'success')
    throw new Error(
      `发布未完成（${run.conclusion}），请查看日志并在 Actions 重跑：${run.html_url}`,
    );
  prompts.outro(`发布完成。用户安装：npm create charon-forge@latest\n${run.html_url}`);
});
