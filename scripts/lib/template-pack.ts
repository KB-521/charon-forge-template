import { execFileSync } from 'node:child_process';
import { readFile, readdir, lstat, realpath } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { createHash } from 'node:crypto';
import picomatch from 'picomatch';
import { writeArchive, LIMITS, type ArchiveFile } from '../../cli/src/core/archive.js';
import {
  relativePath,
  forbiddenPath,
  validateTemplate,
  type Template,
} from '../../cli/src/core/protocol/index.js';
import { fail } from '../../cli/src/core/errors.js';

/** Compare the deterministic tar payload, independent of gzip OS headers and compression. */
export async function archiveContentDigest(bytes: Buffer): Promise<string> {
  if (bytes.length > LIMITS.archive) fail('E_ARCHIVE', 'pack', '模板归档超限。');
  const hash = createHash('sha256');
  let size = 0;
  await pipeline(
    Readable.from([bytes]),
    createGunzip(),
    new Writable({
      write(chunk: Buffer, _encoding, callback) {
        size += chunk.length;
        if (size > LIMITS.expanded) {
          callback(new Error('模板归档展开超限。'));
          return;
        }
        hash.update(chunk);
        callback();
      },
    }),
  );
  return hash.digest('hex');
}
export async function discoverTemplates(
  root: string,
): Promise<{ directory: string; template: Template }[]> {
  const base = join(root, 'templates');
  const result: { directory: string; template: Template }[] = [];
  for (const category of await readdir(base, { withFileTypes: true }).catch(() => [])) {
    if (!category.isDirectory()) continue;
    for (const entry of await readdir(join(base, category.name), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const directory = join(base, category.name, entry.name);
      const template = validateTemplate(
        JSON.parse(await readFile(join(directory, 'template.json'), 'utf8')),
      );
      if (result.some((r) => r.template.id === template.id))
        fail('E_SCHEMA', 'discover', `模板 ID 重复：${template.id}`);
      result.push({ directory, template });
    }
  }
  return result;
}
export async function packTemplate(
  root: string,
  directory: string,
  output: string,
  overrides: { version?: string } = {},
): Promise<{ template: Template; digest: string; contentSha256: string; files: string[] }> {
  root = await realpath(root);
  directory = await realpath(directory);
  const template = validateTemplate({
    ...JSON.parse(await readFile(join(directory, 'template.json'), 'utf8')),
    ...overrides,
  });
  const rel = relative(root, directory).split(sep).join('/');
  if (rel.startsWith('../') || !rel.startsWith('templates/'))
    fail('E_INPUT', 'pack', '模板必须位于仓库 templates/ 下。');
  const raw = execFileSync('git', ['-C', root, 'ls-files', '--stage', '-z', '--', `${rel}/`], {
    encoding: 'utf8',
  });
  const tracked = new Map<string, string>();
  for (const line of raw.split('\0').filter(Boolean)) {
    const match = /^(\d+) [a-f0-9]+ (\d)\t(.+)$/.exec(line);
    if (!match || match[2] !== '0') fail('E_SCHEMA', 'pack', '模板存在未解决的 Git 冲突。');
    const path = match[3]!.slice(rel.length + 1);
    if (match[1] === '120000' || match[1] === '160000')
      fail('E_ARCHIVE', 'pack', `禁止链接/子模块：${path}`);
    tracked.set(path, match[1]!);
  }
  if (!tracked.has('template.json'))
    fail('E_SCHEMA', 'pack', 'template.json 必须先纳入 Git 跟踪（可暂存），工具不会自动 git add。');
  const include = picomatch(template.publish.include, { dot: true });
  const files: ArchiveFile[] = [
    {
      path: 'template.json',
      data: Buffer.from(JSON.stringify(template, null, 2) + '\n'),
      mode: 0o644,
    },
  ];
  const inspect = async (path: string): Promise<void> => {
    relativePath(path);
    const stat = await lstat(join(directory, path));
    if (!stat.isFile() || stat.isSymbolicLink()) fail('E_ARCHIVE', 'pack', `非普通文件：${path}`);
    let cursor = directory;
    for (const part of path.split('/').slice(0, -1)) {
      cursor = join(cursor, part);
      if ((await lstat(cursor)).isSymbolicLink()) fail('E_ARCHIVE', 'pack', `目录链接：${path}`);
    }
  };
  await inspect('template.json');
  const untracked = execFileSync(
    'git',
    ['-C', root, 'ls-files', '--others', '--exclude-standard', '-z', '--', `${rel}/files/`],
    { encoding: 'utf8' },
  );
  for (const path of untracked.split('\0').filter(Boolean))
    if (include(path.slice(rel.length + '/files/'.length)))
      fail('E_SCHEMA', 'pack', `include 命中未跟踪文件，请先纳入 Git：${path}`);
  for (const [path, mode] of tracked) {
    if (!path.startsWith('files/')) continue;
    const local = path.slice(6);
    relativePath(local);
    if (forbiddenPath(local)) fail('E_ARCHIVE', 'pack', `已跟踪运行产物/本地配置：${local}`);
    if (!include(local)) continue;
    await inspect(path);
    files.push({
      path,
      data: await readFile(join(directory, path)),
      mode: mode === '100755' ? 0o755 : 0o644,
    });
  }
  if (files.length === 1) fail('E_SCHEMA', 'pack', '模板没有可发布负载。');
  for (const path of template.render.files)
    if (!files.some((f) => f.path === `files/${path}`))
      fail('E_SCHEMA', 'pack', `渲染文件未包含在发布集合：${path}`);
  const digest = await writeArchive(output, files);
  return {
    template,
    digest,
    contentSha256: await archiveContentDigest(await readFile(output)),
    files: files.map((f) => f.path),
  };
}
