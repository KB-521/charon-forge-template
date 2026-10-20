import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { sha256 } from '../cli/src/core/archive.js';
import { RemoteStore, type Distribution } from '../cli/src/core/distribution.js';
import { mergeCatalogs, stable, type PackedArtifact } from './lib/catalog.js';
import { packTemplate, discoverTemplates } from './lib/template-pack.js';
import {
  parseReleasePlan,
  batchVersion,
  detectTemplateChanges,
  validateSelections,
} from './lib/release-plan.js';
import { GitHubClient, output, live, pause } from './lib/release-github.js';
import {
  cliPublishStatus,
  publishCliPackage,
  ensureTemplateRelease,
  verifyPublicRelease,
} from './lib/release-publisher.js';
import { execute } from './lib/args.js';

const directory = resolve('dist/publish');
type State = {
  tag: string;
  assets: string[];
  channel: boolean;
  cliTarball: string | null;
  cliStatus: 'publish' | 'unchanged' | null;
};

await execute(async () => {
  if (process.env.GITHUB_ACTIONS !== 'true')
    throw new Error('此脚本仅由正式发布 workflow 调用；终端请运行 pnpm release。');
  const plan = parseReleasePlan(JSON.parse(process.env.RELEASE_PLAN ?? 'null'));
  if (
    plan.sha !== process.env.GITHUB_SHA ||
    plan.repository !== process.env.GITHUB_REPOSITORY ||
    plan.requestId !== process.env.REQUEST_ID
  )
    throw new Error('计划与 workflow 提交、仓库或请求编号不匹配，请重新运行 pnpm release。');
  const gh = new GitHubClient(plan.repository);
  const mode = process.argv[2];
  if (mode === 'prepare') {
    if (await output('git', ['status', '--porcelain'])) throw new Error('发布 checkout 必须干净。');
    await mkdir(directory, { recursive: true });
    const run = await gh.json<{ created_at: string }>(
      `repos/${plan.repository}/actions/runs/${process.env.GITHUB_RUN_ID}`,
    );
    const batch = batchVersion(process.env.GITHUB_RUN_ID ?? '', new Date(run.created_at));
    const tag = `templates-${batch}`;
    const history = await gh.history();
    mergeCatalogs(
      history.map((entry) => entry.catalog),
      'history-check',
      [],
    );
    const own = history.find((entry) => entry.release.tag_name === tag);
    const artifacts: PackedArtifact[] = [];
    const state: State = { tag, assets: [], channel: false, cliTarball: null, cliStatus: null };

    // Reject npm version conflicts before publishing any selected templates.
    if (plan.cli) {
      await live('pnpm', ['build']);
      await live('pnpm', ['verify:distribution']);
      const [packed] = JSON.parse(
        await output('npm', [
          'pack',
          '--ignore-scripts',
          '--json',
          '--pack-destination',
          directory,
        ]),
      ) as { filename: string }[];
      if (!packed || !/^[a-zA-Z0-9_.-]+\.tgz$/.test(packed.filename))
        throw new Error('npm pack 未返回有效包。');
      state.cliTarball = join(directory, packed.filename);
      const pkg = JSON.parse(await readFile('package.json', 'utf8')) as {
        name: string;
        version: string;
      };
      state.cliStatus = await cliPublishStatus(
        pkg.name,
        pkg.version,
        await readFile(state.cliTarball),
      );
      console.log(`CLI ${pkg.name}@${pkg.version}: ${state.cliStatus}`);
    }

    if (plan.templates.length) {
      if (own) {
        const asset = own.release.assets.find((item) => item.name === 'release-plan.json');
        if (
          !asset ||
          stable(JSON.parse((await gh.assetBytes(own.release, asset)).toString('utf8'))) !==
            stable(plan)
        )
          throw new Error('已发布批次与当前计划不匹配，拒绝复用。');
      } else {
        const latest = history.at(-1);
        if (
          latest &&
          batch.localeCompare(latest.catalog.catalogVersion, 'en', { numeric: true }) <= 0
        )
          throw new Error('当前运行早于最新正式批次，请重新发起发布；不会回退下载入口。');
        validateSelections(
          await detectTemplateChanges(
            process.cwd(),
            history.map((entry) => entry.catalog),
          ),
          plan.templates,
        );
      }
      const templates = await discoverTemplates(process.cwd());
      for (const selection of plan.templates) {
        const item = templates.find((entry) => entry.template.id === selection.id);
        if (!item) throw new Error(`模板不存在：${selection.id}`);
        const filename = `${selection.id}-${selection.version}.tgz`;
        const path = join(directory, filename);
        const packed = await packTemplate(process.cwd(), item.directory, path, {
          version: selection.version,
        });
        if (own) {
          if (
            own.catalog.templates[selection.id]?.versions[selection.version]?.sha256 !==
            packed.digest
          )
            throw new Error(`重跑归档与已发布内容不一致：${selection.id}`);
        } else {
          await live('pnpm', [
            'exec',
            'tsx',
            'scripts/verify-templates.ts',
            '--template',
            selection.id,
            '--template-version',
            selection.version,
            '--native',
          ]);
          // Verify native commands did not change publish inputs before uploading the packed artifact.
          const after = await packTemplate(
            process.cwd(),
            item.directory,
            join(directory, `${selection.id}-after.tgz`),
            { version: selection.version },
          );
          if (after.digest !== packed.digest) throw new Error('原生验证修改了模板源码。');
        }
        artifacts.push({
          template: packed.template,
          filename,
          sha256: packed.digest,
          files: packed.files,
        });
        state.assets.push(path);
      }
      const catalog =
        own?.catalog ??
        mergeCatalogs(
          history.map((entry) => entry.catalog),
          batch,
          artifacts,
          `https://github.com/${plan.repository}/releases/download/${tag}/`,
        );
      const bytes = own?.bytes ?? Buffer.from(JSON.stringify(catalog, null, 2) + '\n');
      await writeFile(join(directory, 'catalog.json'), bytes);
      await writeFile(join(directory, 'release-plan.json'), JSON.stringify(plan, null, 2) + '\n');
      state.assets.push(join(directory, 'catalog.json'), join(directory, 'release-plan.json'));
      if (!own)
        history.push({
          catalog,
          bytes,
          release: {
            id: 0,
            tag_name: tag,
            draft: false,
            prerelease: false,
            assets: [],
            html_url: '',
          },
        });
    }

    const latest = history
      .sort((a, b) =>
        a.catalog.catalogVersion.localeCompare(b.catalog.catalogVersion, 'en', { numeric: true }),
      )
      .at(-1);
    if (latest) {
      const channelDirectory = join(directory, 'channel');
      await mkdir(channelDirectory);
      await writeFile(
        join(channelDirectory, 'stable-v1.json'),
        JSON.stringify(
          {
            schemaVersion: 1,
            catalogVersion: latest.catalog.catalogVersion,
            catalogUrl: `https://github.com/${plan.repository}/releases/download/${latest.release.tag_name}/catalog.json`,
            sha256: sha256(latest.bytes),
          },
          null,
          2,
        ) + '\n',
      );
      state.channel = true;
    } else if (plan.cli)
      throw new Error('首次 CLI 发布需要先发布模板，请在 pnpm release 中选择“全部”或先选择模板。');
    await writeFile(join(directory, 'state.json'), JSON.stringify(state));
    if (process.env.GITHUB_OUTPUT)
      await appendFile(
        process.env.GITHUB_OUTPUT,
        `has_channel=${state.channel}\nhas_cli=${plan.cli}\n`,
      );
    console.log(`已准备 ${plan.templates.length} 个增量模板；其它模板沿用历史附件。`);
  } else if (mode === 'templates') {
    const state = JSON.parse(await readFile(join(directory, 'state.json'), 'utf8')) as State;
    if (state.assets.length) {
      const release = await ensureTemplateRelease(gh, state.tag, plan.sha, state.assets);
      await verifyPublicRelease(release, state.assets);
      console.log(`模板公开下载校验通过：${release.html_url}`);
    }
  } else if (mode === 'channel') {
    const expected = JSON.parse(
      await readFile(join(directory, 'channel/stable-v1.json'), 'utf8'),
    ) as { catalogVersion: string; sha256: string };
    const config = JSON.parse(await readFile('forge.config.json', 'utf8')) as Distribution;
    if (!config.channelUrl) throw new Error('请先配置 forge.config.json 的公开下载源。');
    for (let attempt = 0; ; attempt++) {
      try {
        const store = new RemoteStore(config, {
          cacheDir: join(directory, `channel-smoke-${attempt}`),
        });
        const snapshot = await store.loadCatalog();
        if (
          snapshot.catalog.catalogVersion !== expected.catalogVersion ||
          snapshot.digest !== expected.sha256
        )
          throw new Error('公开下载入口尚未指向本次核定的 catalog。');
        for (const selection of plan.templates) {
          const meta = snapshot.catalog.templates[selection.id]?.versions[selection.version];
          if (!meta) throw new Error(`公开目录缺少 ${selection.id}@${selection.version}`);
          await store.download(meta, false);
        }
        console.log(`公开下载入口和选中模板校验通过：${config.channelUrl}`);
        break;
      } catch (error) {
        if (attempt === 5) throw error;
        await pause(5000);
      }
    }
  } else if (mode === 'cli') {
    const state = JSON.parse(await readFile(join(directory, 'state.json'), 'utf8')) as State;
    if (plan.cli && state.cliTarball) {
      const pkg = JSON.parse(await readFile('package.json', 'utf8')) as {
        name: string;
        version: string;
      };
      const status = await publishCliPackage(
        pkg.name,
        pkg.version,
        await readFile(state.cliTarball),
        () =>
          live('npm', [
            'publish',
            state.cliTarball!,
            '--ignore-scripts',
            '--access',
            'public',
            '--registry',
            'https://registry.npmjs.org',
          ]),
      );
      console.log(
        status === 'submitted'
          ? `CLI ${pkg.name}@${pkg.version}：npm publish 已成功提交，发布步骤通过；npm 后续校验异步处理。`
          : 'CLI 内容与已发布版本一致，跳过 npm 发布。',
      );
    }
  } else throw new Error('未知发布阶段。');
});
