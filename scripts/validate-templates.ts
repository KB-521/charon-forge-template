import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discoverTemplates, packTemplate } from './lib/template-pack.js';
import { execute } from './lib/args.js';
await execute(async () => {
  const templates = await discoverTemplates(process.cwd());
  const temp = await mkdtemp(join(tmpdir(), 'charon-forge-validate-'));
  try {
    for (const { directory, template } of templates) {
      const result = await packTemplate(process.cwd(), directory, join(temp, `${template.id}.tgz`));
      console.log(`${template.id}@${template.version}: ${result.files.length} files`);
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
  console.log(
    `模板校验完成：${templates.length} 个模板${templates.length ? '' : '（空模板仓库有效）'}。`,
  );
});
