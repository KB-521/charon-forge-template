import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sha256 } from '../cli/src/core/archive.js';
import { validateCatalog, type Catalog } from '../cli/src/core/protocol/index.js';
import { mergeCatalogs, type PackedArtifact } from './lib/catalog.js';
import { command, execute } from './lib/args.js';
const program = command('catalog:build')
  .option('--catalog-version <version>', '发布批次', 'local')
  .option('--manifest <file>', '归档清单', 'dist/templates/manifest.json')
  .option('--history <directory>', '全部历史 catalog 所在目录')
  .option('--base-url <url>', '不可变附件目录 HTTPS URL')
  .option('--recommendations <file>', '推荐版本映射，可用于推荐回退')
  .option('--output <directory>', '输出目录', 'dist/catalog')
  .option('--dry-run', '仅校验，不写输出')
  .parse(process.argv.filter((a, i) => i !== 2 || a !== '--'));
await execute(async () => {
  const opts = program.opts<{
    catalogVersion: string;
    manifest: string;
    history?: string;
    baseUrl?: string;
    recommendations?: string;
    output: string;
    dryRun?: boolean;
  }>();
  const history: Catalog[] = [];
  if (opts.history)
    for (const file of await readdir(opts.history))
      if (file.endsWith('.json'))
        history.push(validateCatalog(JSON.parse(await readFile(join(opts.history, file), 'utf8'))));
  const artifacts: PackedArtifact[] = JSON.parse(await readFile(opts.manifest, 'utf8'));
  const recommendations = opts.recommendations
    ? JSON.parse(await readFile(opts.recommendations, 'utf8'))
    : {};
  const catalog = mergeCatalogs(
    history,
    opts.catalogVersion,
    artifacts,
    opts.baseUrl,
    recommendations,
  );
  const bytes = Buffer.from(JSON.stringify(catalog, null, 2) + '\n');
  if (!opts.dryRun) {
    await mkdir(opts.output, { recursive: true });
    await writeFile(join(opts.output, 'catalog.json'), bytes);
    if (opts.baseUrl)
      await writeFile(
        join(opts.output, 'stable-v1.json'),
        JSON.stringify(
          {
            schemaVersion: 1,
            catalogVersion: catalog.catalogVersion,
            catalogUrl: new URL(
              'catalog.json',
              opts.baseUrl.endsWith('/') ? opts.baseUrl : `${opts.baseUrl}/`,
            ).href,
            sha256: sha256(bytes),
          },
          null,
          2,
        ) + '\n',
      );
  }
  console.log(
    `catalog ${catalog.catalogVersion}: ${Object.keys(catalog.templates).length} 个模板，SHA-256 ${sha256(bytes)}${opts.dryRun ? '（dry-run）' : ''}`,
  );
});
