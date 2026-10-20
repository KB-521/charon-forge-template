import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { discoverTemplates, packTemplate } from './lib/template-pack.js';
import { command, execute } from './lib/args.js';
const program = command('templates:pack')
  .option('--output <directory>', '新的归档目录', 'dist/templates')
  .option('--template <id>', '仅打包指定模板')
  .parse(process.argv.filter((a, i) => i !== 2 || a !== '--'));
await execute(async () => {
  const options = program.opts<{ output: string; template?: string }>();
  const templates = await discoverTemplates(process.cwd());
  if (options.template && !templates.some((t) => t.template.id === options.template))
    throw new Error(`未知模板：${options.template}`);
  await mkdir(options.output, { recursive: true });
  const artifacts = [];
  for (const { directory, template } of templates.filter(
    (t) => !options.template || t.template.id === options.template,
  )) {
    const filename = `${template.id}-${template.version}.tgz`;
    const result = await packTemplate(process.cwd(), directory, join(options.output, filename));
    artifacts.push({
      template: result.template,
      filename,
      sha256: result.digest,
      files: result.files,
    });
  }
  await writeFile(join(options.output, 'manifest.json'), JSON.stringify(artifacts, null, 2) + '\n');
  console.log(`归档完成：${artifacts.length} 个模板 → ${resolve(options.output)}`);
});
