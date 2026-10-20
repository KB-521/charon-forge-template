import { readdir, mkdir, realpath, copyFile, writeFile, chmod, lstat } from 'node:fs/promises';
import { join, resolve, relative, isAbsolute, dirname } from 'node:path';
import { constants } from 'node:fs';
import { validateTemplate, forbiddenPath, relativePath } from '../cli/src/core/protocol/index.js';
import { fail } from '../cli/src/core/errors.js';
import { command, execute } from './lib/args.js';
const program = command('template:import')
  .requiredOption('--source <directory>', '现有原生项目目录')
  .requiredOption('--id <id>', '稳定模板 ID')
  .requiredOption('--category <category>', '分类')
  .requiredOption('--name <name>', '显示名称')
  .option('--version <version>', '模板版本', '0.1.0')
  .parse(process.argv.filter((a, i) => i !== 2 || a !== '--'));
await execute(async () => {
  const o = program.opts<{
    source: string;
    id: string;
    category: string;
    name: string;
    version: string;
  }>();
  relativePath(o.id);
  relativePath(o.category);
  if (o.id.includes('/') || o.category.includes('/'))
    fail('E_INPUT', 'import', '分类和 ID 只能是一段名称。');
  const template = validateTemplate({
    schemaVersion: 1,
    id: o.id,
    version: o.version,
    name: o.name,
    category: o.category,
    layout: 'single',
    tags: [],
    minCliVersion: '0.1.0',
    source: 'files',
    inputs: { projectName: { type: 'string', required: true } },
    render: { tokens: {}, files: [] },
    publish: { include: ['**/*'] },
    requirements: [],
    install: { adapter: 'manual' },
    verify: [],
  });
  const source = await realpath(o.source);
  const destination = resolve('templates', o.category, o.id);
  const nested = relative(source, destination);
  if (
    !nested ||
    (!nested.startsWith('..' + (process.platform === 'win32' ? '\\' : '/')) &&
      nested !== '..' &&
      !isAbsolute(nested))
  )
    fail('E_INPUT', 'import', '不能将模板导入到来源目录内部。');
  const files: { path: string; source: string; mode: number }[] = [];
  const skipped: string[] = [];
  const collect = async (dir: string, prefix = ''): Promise<void> => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (
        forbiddenPath(path) ||
        ['.codex', '.agents', '.claude', 'ai-workflow'].includes(entry.name)
      ) {
        skipped.push(path);
        continue;
      }
      relativePath(path);
      if (entry.isSymbolicLink()) fail('E_INPUT', 'import', `导入不支持符号链接：${path}`);
      if (entry.isDirectory()) await collect(join(dir, entry.name), path);
      else if (entry.isFile())
        files.push({
          path,
          source: join(dir, entry.name),
          mode: (await lstat(join(dir, entry.name))).mode & 0o111 ? 0o755 : 0o644,
        });
      else fail('E_INPUT', 'import', `导入不支持特殊文件：${path}`);
    }
  };
  await collect(source);
  if (!files.length) fail('E_INPUT', 'import', '来源没有可导入文件。');
  await mkdir(dirname(destination), { recursive: true });
  try {
    await mkdir(destination);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST')
      fail('E_TARGET_EXISTS', 'import', '模板目录已存在，不会合并覆盖。');
    throw error;
  }
  for (const file of files) {
    const output = join(destination, 'files', file.path);
    await mkdir(dirname(output), { recursive: true });
    await copyFile(file.source, output, constants.COPYFILE_EXCL);
    if (process.platform !== 'win32') await chmod(output, file.mode);
  }
  await writeFile(join(destination, 'template.json'), JSON.stringify(template, null, 2) + '\n', {
    flag: 'wx',
  });
  await writeFile(
    join(destination, 'README.md'),
    `# ${o.name}\n\n导入后请检查工具版本、安装/启动/构建/测试说明，补充 template.json 的 requirements、install、verify。\n按需显式声明 token，不自动替换源工程名称。先纳入 Git，再执行校验与仓库外开发。\n`,
    { flag: 'wx' },
  );
  await writeFile(
    join(destination, 'CHANGELOG.md'),
    `# Changelog\n\n## ${o.version}\n\n- 初次导入，尚未完成原生验证。\n`,
    { flag: 'wx' },
  );
  console.log(
    `已导入 ${files.length} 个基础文件 → ${destination}\n跳过 ${skipped.length} 个运行/本地路径。未自动安装、改名或 git add。请审查后补齐描述并纳入 Git。`,
  );
});
