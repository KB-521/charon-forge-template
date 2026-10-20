import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import semver from 'semver';
import {
  validateTemplate,
  type Catalog,
  type Template,
  type PublishedVersion,
} from '../../cli/src/core/protocol/index.js';
import { sha256 } from '../../cli/src/core/archive.js';
import { RemoteStore, type Distribution } from '../../cli/src/core/distribution.js';
import { discoverTemplates, packTemplate, archiveContentDigest } from './template-pack.js';
import { mergeCatalogs } from './catalog.js';
import { fail } from '../../cli/src/core/errors.js';

export type PublishedArchiveLoader = (version: PublishedVersion) => Promise<Buffer>;

export type TemplateChange = {
  directory: string;
  template: Template;
  status: 'new' | 'changed' | 'unchanged';
  previousVersion: string | null;
  previousSha256: string | null;
  comparisonSha256: string;
  suggestedVersion: string;
};
export type TemplateSelection = {
  id: string;
  version: string;
  previousVersion: string | null;
  previousSha256: string | null;
  comparisonSha256: string;
};
export type ReleasePlan = {
  schemaVersion: 1;
  repository: string;
  sha: string;
  requestId: string;
  templates: TemplateSelection[];
  cli: boolean;
};

export function repositoryName(value: string): string {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value))
    throw new Error('仓库必须为 GitHub owner/repository。');
  return value;
}

export function parseReleasePlan(value: unknown): ReleasePlan {
  const plan = value as ReleasePlan;
  if (
    !plan ||
    plan.schemaVersion !== 1 ||
    !/^[a-f0-9]{40}$/.test(plan.sha) ||
    !/^[a-f0-9-]{36}$/.test(plan.requestId) ||
    typeof plan.cli !== 'boolean' ||
    !Array.isArray(plan.templates) ||
    plan.templates.length > 100
  )
    throw new Error('发布计划格式无效。');
  repositoryName(plan.repository);
  const ids = new Set<string>();
  for (const item of plan.templates) {
    if (
      !item ||
      !/^[a-z0-9][a-z0-9-]*$/.test(item.id) ||
      ids.has(item.id) ||
      !semver.valid(item.version) ||
      item.version.includes('+') ||
      !/^[a-f0-9]{64}$/.test(item.comparisonSha256) ||
      !(
        (item.previousVersion === null && item.previousSha256 === null) ||
        (semver.valid(item.previousVersion) && /^[a-f0-9]{64}$/.test(item.previousSha256 ?? ''))
      )
    )
      throw new Error('模板发布计划格式无效或包含重复模板。');
    ids.add(item.id);
  }
  return plan;
}

export async function detectTemplateChanges(
  root: string,
  history: Catalog[],
  loadArchive: PublishedArchiveLoader = async (version) => {
    const config = JSON.parse(
      await readFile(join(root, 'forge.config.json'), 'utf8'),
    ) as Distribution;
    const store = new RemoteStore(config);
    return readFile(await store.download(version, false));
  },
): Promise<TemplateChange[]> {
  const catalog = mergeCatalogs(history, 'detection', []);
  const temp = await mkdtemp(join(tmpdir(), 'charon-forge-detect-'));
  try {
    const changes: TemplateChange[] = [];
    for (const { directory, template } of await discoverTemplates(root)) {
      const versions = catalog.templates[template.id]?.versions ?? {};
      const latest = Object.keys(versions).sort(semver.rcompare)[0];
      const previous = latest ? versions[latest]! : null;
      // Compare at the published version so version bumps alone do not count as source changes.
      const packed = await packTemplate(
        root,
        directory,
        join(temp, `${template.id}.tgz`),
        previous ? { version: previous.version } : {},
      );
      let previousContent: string | null = null;
      if (previous) {
        const bytes = await loadArchive(previous);
        if (sha256(bytes) !== previous.sha256)
          fail(
            'E_INTEGRITY',
            'release',
            `历史模板包摘要不一致：${previous.id}@${previous.version}`,
          );
        previousContent = await archiveContentDigest(bytes);
      }
      changes.push({
        directory,
        template,
        status: previous
          ? packed.contentSha256 === previousContent
            ? 'unchanged'
            : 'changed'
          : 'new',
        previousVersion: previous?.version ?? null,
        previousSha256: previous?.sha256 ?? null,
        comparisonSha256: packed.contentSha256,
        suggestedVersion:
          !previous || semver.gt(template.version, previous.version)
            ? template.version
            : semver.inc(previous.version, 'patch')!,
      });
    }
    return changes;
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

export function selectTemplate(change: TemplateChange, version: string): TemplateSelection {
  validateTemplate({ ...change.template, version });
  if (change.status === 'unchanged') throw new Error(`模板无变化：${change.template.id}`);
  if (change.previousVersion && !semver.gt(version, change.previousVersion))
    throw new Error(`${change.template.id} 的新版本必须高于 ${change.previousVersion}。`);
  return {
    id: change.template.id,
    version,
    previousVersion: change.previousVersion,
    previousSha256: change.previousSha256,
    comparisonSha256: change.comparisonSha256,
  };
}

export function validateSelections(
  changes: TemplateChange[],
  selections: TemplateSelection[],
): void {
  for (const selection of selections) {
    const change = changes.find((item) => item.template.id === selection.id);
    if (
      !change ||
      change.previousVersion !== selection.previousVersion ||
      change.previousSha256 !== selection.previousSha256 ||
      change.comparisonSha256 !== selection.comparisonSha256
    )
      throw new Error(`模板或发布历史已变化，请重新运行 pnpm release：${selection.id}`);
    selectTemplate(change, selection.version);
  }
}

export function batchVersion(runId: string, date = new Date()): string {
  if (!/^[1-9]\d*$/.test(runId)) throw new Error('缺少有效的 GitHub run ID。');
  return `${date.toISOString().slice(0, 10).replaceAll('-', '.')}.${runId}`;
}
