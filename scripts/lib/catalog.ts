import {
  validateCatalog,
  validateTemplate,
  type Catalog,
  type Template,
  type PublishedVersion,
} from '../../cli/src/core/protocol/index.js';
import { fail } from '../../cli/src/core/errors.js';
export type PackedArtifact = {
  template: Template;
  filename: string;
  sha256: string;
  files: string[];
};
export function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value !== null && typeof value === 'object')
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}
export function mergeCatalogs(
  history: Catalog[],
  catalogVersion: string,
  artifacts: PackedArtifact[],
  baseUrl?: string,
  recommendations: Record<string, string[]> = {},
): Catalog {
  const result: Catalog = { schemaVersion: 1, catalogVersion, templates: {} };
  for (const snapshot of [...history].sort((a, b) =>
    a.catalogVersion.localeCompare(b.catalogVersion, 'en', { numeric: true }),
  )) {
    validateCatalog(snapshot);
    for (const [id, item] of Object.entries(snapshot.templates)) {
      const dest = (result.templates[id] ??= { versions: {}, recommendedVersions: [] });
      for (const [v, meta] of Object.entries(item.versions)) {
        const previous = dest.versions[v];
        if (previous && stable(previous) !== stable(meta))
          fail('E_INTEGRITY', 'release', `历史冲突：${id}@${v}`);
        dest.versions[v] = meta;
      }
      dest.recommendedVersions = [...item.recommendedVersions];
    }
  }
  for (const artifact of artifacts) {
    const t = validateTemplate(artifact.template);
    if (!baseUrl) fail('E_INPUT', 'catalog', '非空发布需要 --base-url。');
    if (!/^[a-z0-9][a-z0-9.-]*\.tgz$/.test(artifact.filename))
      fail('E_INPUT', 'catalog', '归档文件名无效。');
    const artifactUrl = new URL(artifact.filename, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`)
      .href;
    if (!artifactUrl.startsWith('https://')) fail('E_INPUT', 'catalog', '发布地址必须为 HTTPS。');
    const meta: PublishedVersion = {
      id: t.id,
      version: t.version,
      schemaVersion: t.schemaVersion,
      name: t.name,
      category: t.category,
      layout: t.layout,
      tags: t.tags,
      minCliVersion: t.minCliVersion,
      requirements: t.requirements,
      artifactUrl,
      sha256: artifact.sha256,
    };
    const dest = (result.templates[t.id] ??= { versions: {}, recommendedVersions: [] });
    const old = dest.versions[t.version];
    if (old) {
      if (stable({ ...old, artifactUrl: '' }) !== stable({ ...meta, artifactUrl: '' }))
        fail('E_INTEGRITY', 'catalog', `模板内容变化必须升版本：${t.id}@${t.version}`);
    } else {
      dest.versions[t.version] = meta;
      if (!t.version.includes('-'))
        dest.recommendedVersions = [
          t.version,
          ...dest.recommendedVersions.filter((v) => v !== t.version),
        ];
    }
  }
  for (const [id, versions] of Object.entries(recommendations)) {
    if (!Object.hasOwn(result.templates, id)) fail('E_INPUT', 'catalog', `推荐项模板不存在：${id}`);
    result.templates[id]!.recommendedVersions = versions;
  }
  return validateCatalog(result);
}
