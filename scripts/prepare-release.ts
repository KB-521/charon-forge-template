import { execFileSync } from 'node:child_process';
import { readFile, readdir, mkdir, cp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { mergeCatalogs, type PackedArtifact } from './lib/catalog.js';
import { validateCatalog, type Catalog } from '../cli/src/core/protocol/index.js';
import { hashFile } from '../cli/src/core/distribution.js';
import { sha256 } from '../cli/src/core/archive.js';
import { command, execute } from './lib/args.js';
const program = command('release:prepare')
  .requiredOption('--catalog-version <version>', 'YYYY.MM.DD.sequence')
  .requiredOption('--base-url <url>', '未来不可变附件目录')
  .option('--history <directory>', '所有正式批次 catalog')
  .option('--first-release', '明确首次发布，无历史')
  .option('--manifest <file>', '打包清单', 'dist/templates/manifest.json')
  .option('--output <directory>', '新的发布预览目录', 'dist/release')
  .parse(process.argv.filter((a, i) => i !== 2 || a !== '--'));
await execute(async () => {
  const o = program.opts<{
    catalogVersion: string;
    baseUrl: string;
    history?: string;
    firstRelease?: boolean;
    manifest: string;
    output: string;
  }>();
  if (!/^\d{4}\.\d{2}\.\d{2}\.[1-9]\d*$/.test(o.catalogVersion))
    throw new Error('批次需为 YYYY.MM.DD.sequence。');
  if (Boolean(o.history) === Boolean(o.firstRelease))
    throw new Error('必须二选一指定 --history 或 --first-release，避免意外丢弃历史。');
  if (new URL(o.baseUrl).protocol !== 'https:') throw new Error('发布地址必须 HTTPS。');
  if (execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim())
    throw new Error('正式发布准备须在已提交且干净的指定提交中运行。');
  const history: Catalog[] = [];
  if (o.history) {
    for (const file of await readdir(o.history))
      if (file.endsWith('.json'))
        history.push(validateCatalog(JSON.parse(await readFile(join(o.history, file), 'utf8'))));
    if (!history.length) throw new Error('历史目录为空；首次发行应显式 --first-release。');
  }
  const artifacts: PackedArtifact[] = JSON.parse(await readFile(o.manifest, 'utf8'));
  if (!artifacts.length) throw new Error('模板仓库为空，当前无需准备模板发行。');
  const catalog = mergeCatalogs(history, o.catalogVersion, artifacts, o.baseUrl);
  await mkdir(o.output); // Existing staging is deliberately not overwritten.
  for (const artifact of artifacts) {
    const path = join(o.manifest, '..', artifact.filename);
    if ((await hashFile(path)) !== artifact.sha256)
      throw new Error(`归档摘要不符：${artifact.filename}`);
    // Catalog keeps historical URLs; only new immutable artifacts should be uploaded.
    if (
      catalog.templates[artifact.template.id]!.versions[artifact.template.version]!.artifactUrl ===
      new URL(artifact.filename, o.baseUrl.endsWith('/') ? o.baseUrl : `${o.baseUrl}/`).href
    )
      await cp(path, join(o.output, artifact.filename), { errorOnExist: true, force: false });
  }
  const bytes = Buffer.from(JSON.stringify(catalog, null, 2) + '\n');
  await writeFile(join(o.output, 'catalog.json'), bytes, { flag: 'wx' });
  await writeFile(
    join(o.output, 'stable-v1.json'),
    JSON.stringify(
      {
        schemaVersion: 1,
        catalogVersion: o.catalogVersion,
        catalogUrl: new URL('catalog.json', o.baseUrl.endsWith('/') ? o.baseUrl : `${o.baseUrl}/`)
          .href,
        sha256: sha256(bytes),
      },
      null,
      2,
    ) + '\n',
    { flag: 'wx' },
  );
  console.log(
    `发行预览已准备：${o.output}。尚未创建 Release、部署 channel 或发布 npm。按 docs/releasing.md 完成外发。`,
  );
});
