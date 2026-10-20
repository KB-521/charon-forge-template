import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateCatalog, type Catalog } from '../../cli/src/core/protocol/index.js';
import { repositoryName, type ReleasePlan } from './release-plan.js';

const exec = promisify(execFile);
export async function output(
  command: string,
  args: string[],
  cwd = process.cwd(),
): Promise<string> {
  const result = await exec(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 ** 2,
    timeout: 60_000,
    shell: false,
  });
  return result.stdout.trim();
}
export async function live(command: string, args: string[], cwd = process.cwd()): Promise<void> {
  console.log(`> ${command} ${args.join(' ')}`);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', shell: false, timeout: 300_000 });
    child.once('error', reject);
    child.once('close', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} ${args.join(' ')} 失败（${code ?? '中断'}）。`)),
    );
  });
}
export const pause = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
export type ReleaseAsset = { id: number; name: string; browser_download_url: string; size: number };
export type GitHubRelease = {
  id: number;
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  assets: ReleaseAsset[];
  html_url: string;
};
export type HistoryEntry = { release: GitHubRelease; catalog: Catalog; bytes: Buffer };
export type WorkflowRun = {
  id: number;
  display_title: string;
  html_url: string;
  status: string;
  conclusion: string | null;
  head_sha: string;
};

export class GitHubClient {
  constructor(readonly repository: string) {
    repositoryName(repository);
  }

  async json<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const temp = body === undefined ? null : await mkdtemp(join(tmpdir(), 'charon-forge-gh-'));
    try {
      const args = ['api', '--hostname', 'github.com', '--method', method, path];
      if (temp) {
        await writeFile(join(temp, 'request.json'), JSON.stringify(body));
        args.push('--input', join(temp, 'request.json'));
      }
      const result = await output('gh', args);
      return (result ? JSON.parse(result) : undefined) as T;
    } finally {
      if (temp) await rm(temp, { recursive: true, force: true });
    }
  }

  async releases(): Promise<GitHubRelease[]> {
    const pages = JSON.parse(
      await output('gh', [
        'api',
        '--hostname',
        'github.com',
        '--paginate',
        '--slurp',
        `repos/${this.repository}/releases?per_page=100`,
      ]),
    ) as GitHubRelease[][];
    return pages.flat();
  }

  async assetBytes(release: GitHubRelease, asset: ReleaseAsset): Promise<Buffer> {
    if (asset.size > 100 * 1024 ** 2) throw new Error(`附件过大：${asset.name}`);
    const temp = await mkdtemp(join(tmpdir(), 'charon-forge-asset-'));
    try {
      // gh authenticates private draft downloads without forwarding credentials to arbitrary hosts.
      const path = join(temp, 'asset');
      await output('gh', [
        'release',
        'download',
        release.tag_name,
        '--repo',
        `github.com/${this.repository}`,
        '--pattern',
        asset.name,
        '--output',
        path,
      ]);
      return await readFile(path);
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  }

  async history(releases?: GitHubRelease[]): Promise<HistoryEntry[]> {
    const entries: HistoryEntry[] = [];
    for (const release of releases ?? (await this.releases())) {
      if (
        release.draft ||
        release.prerelease ||
        !/^templates-\d{4}\.\d{2}\.\d{2}\.[1-9]\d*$/.test(release.tag_name)
      )
        continue;
      const asset = release.assets.find((item) => item.name === 'catalog.json');
      if (!asset || asset.size > 10 * 1024 ** 2)
        throw new Error(`正式发布缺少有效 catalog.json：${release.tag_name}`);
      const bytes = await this.assetBytes(release, asset);
      const catalog = validateCatalog(JSON.parse(bytes.toString('utf8')));
      if (release.tag_name !== `templates-${catalog.catalogVersion}`)
        throw new Error('历史 catalog 批次与 Release 不匹配。');
      entries.push({ release, catalog, bytes });
    }
    return entries.sort((a, b) =>
      a.catalog.catalogVersion.localeCompare(b.catalog.catalogVersion, 'en', { numeric: true }),
    );
  }

  async dispatch(plan: ReleasePlan, branch: string): Promise<void> {
    await this.json(`repos/${this.repository}/actions/workflows/release.yml/dispatches`, 'POST', {
      ref: branch,
      inputs: { plan: JSON.stringify(plan), request_id: plan.requestId },
    });
  }

  async createRelease(tag: string, sha: string): Promise<GitHubRelease> {
    return this.json(`repos/${this.repository}/releases`, 'POST', {
      tag_name: tag,
      target_commitish: sha,
      name: tag,
      draft: true,
      prerelease: false,
      body: `Charon Forge incremental template release from ${sha}.`,
    });
  }

  async upload(release: GitHubRelease, path: string): Promise<void> {
    await output('gh', [
      'release',
      'upload',
      release.tag_name,
      path,
      '--repo',
      `github.com/${this.repository}`,
    ]);
  }

  async publish(release: GitHubRelease): Promise<GitHubRelease> {
    return this.json(`repos/${this.repository}/releases/${release.id}`, 'PATCH', {
      draft: false,
      make_latest: 'false',
    });
  }

  async findRun(plan: ReleasePlan): Promise<WorkflowRun | undefined> {
    const result = await this.json<{ workflow_runs: WorkflowRun[] }>(
      `repos/${this.repository}/actions/workflows/release.yml/runs?event=workflow_dispatch&head_sha=${plan.sha}&per_page=100`,
    );
    return result.workflow_runs.find(
      (run) => run.display_title === `Release ${plan.requestId}` && run.head_sha === plan.sha,
    );
  }
}
