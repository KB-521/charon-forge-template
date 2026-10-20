import { createReadStream, createWriteStream } from 'node:fs';
import { readFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createGzip, createGunzip } from 'node:zlib';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import tar from 'tar-stream';
import { fail, ForgeError, cancelled } from './errors.js';
import {
  validateTemplate,
  relativePath,
  forbiddenPath,
  resolveInputs,
  type Template,
  type Inputs,
  type PublishedVersion,
} from './protocol/index.js';
export const LIMITS = {
  archive: 100 * 1024 ** 2,
  expanded: 500 * 1024 ** 2,
  file: 100 * 1024 ** 2,
  entries: 20_000,
};
export const sha256 = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');
export type ArchiveFile = { path: string; data: Buffer; mode: number };
export type Stage = {
  path: string;
  template: Template;
  inputs: Inputs;
  files: { path: string; mode: number }[];
};
export async function writeArchive(output: string, files: ArchiveFile[]): Promise<string> {
  await mkdir(dirname(output), { recursive: true });
  const pack = tar.pack();
  const writing = pipeline(
    pack,
    createGzip({ level: 9 }),
    createWriteStream(output, { flags: 'wx' }),
  );
  // Observe errors immediately, including before the final await.
  void writing.catch(() => {});
  try {
    for (const file of [...files].sort((a, b) =>
      Buffer.compare(Buffer.from(a.path), Buffer.from(b.path)),
    )) {
      relativePath(file.path);
      await new Promise<void>((resolve, reject) =>
        pack.entry(
          {
            name: file.path,
            type: 'file',
            size: file.data.length,
            mode: file.mode,
            mtime: new Date(0),
            uid: 0,
            gid: 0,
            uname: '',
            gname: '',
          },
          file.data,
          (error) => (error ? reject(error) : resolve()),
        ),
      );
    }
    pack.finalize();
    await writing;
    return sha256(await readFile(output));
  } catch (error) {
    pack.destroy(error as Error);
    await writing.catch(() => {});
    await rm(output, { force: true });
    throw error;
  }
}
export async function stageProject(
  archive: string,
  digest: string,
  supplied: Inputs | ((template: Template) => Promise<Inputs>),
  parent: string,
  expected?: PublishedVersion,
  signal?: AbortSignal,
): Promise<Stage> {
  cancelled(signal);
  // Verify at consumption as well, including after a content-addressed cache hit.
  const archiveBytes = await readFile(archive);
  if (archiveBytes.length > LIMITS.archive || sha256(archiveBytes) !== digest)
    fail('E_INTEGRITY', 'archive', '模板包摘要不一致或超限。');
  const stage = await mkdtemp(join(parent, '.charon-forge-stage-'));
  const entries = new Map<string, { data?: Buffer; mode: number; directory: boolean }>();
  const folded = new Set<string>();
  const spellings = new Map<string, string>();
  let expanded = 0,
    totalFiles = 0;
  const limit = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      expanded += chunk.length;
      callback(
        expanded > LIMITS.expanded
          ? new ForgeError('E_ARCHIVE', 'extract', '展开数据超限。')
          : null,
        chunk,
      );
    },
  });
  const extract = tar.extract();
  extract.on('entry', (header, stream, next) => {
    void (async () => {
      cancelled(signal);
      if (++totalFiles > LIMITS.entries) fail('E_ARCHIVE', 'extract', '归档条目超限。');
      const name = header.type === 'directory' ? header.name.replace(/\/$/, '') : header.name;
      relativePath(name);
      if (name !== 'template.json' && !name.startsWith('files/'))
        fail('E_ARCHIVE', 'extract', `非法归档条目：${name}`);
      if (!['file', 'directory'].includes(header.type ?? ''))
        fail('E_ARCHIVE', 'extract', `不支持链接或特殊文件：${name}`);
      const parts = name.split('/');
      for (let index = 1; index <= parts.length; index++) {
        const prefix = parts.slice(0, index).join('/');
        const normalized = prefix.normalize('NFC').toLowerCase();
        const previous = spellings.get(normalized);
        if (previous && previous !== prefix)
          fail('E_ARCHIVE', 'extract', `跨平台目录拼写冲突：${prefix}`);
        spellings.set(normalized, prefix);
      }
      const key = name.normalize('NFC').toLowerCase();
      if (folded.has(key)) fail('E_ARCHIVE', 'extract', `重复/跨平台冲突路径：${name}`);
      folded.add(key);
      if (
        (header.size ?? 0) > LIMITS.file ||
        (name === 'template.json' && (header.size ?? 0) > 1024 ** 2)
      )
        fail('E_ARCHIVE', 'extract', '单文件超限。');
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of stream) {
        const bytes = Buffer.from(chunk as Uint8Array);
        size += bytes.length;
        if (size > LIMITS.file) fail('E_ARCHIVE', 'extract', '单文件超限。');
        chunks.push(bytes);
      }
      entries.set(name, {
        data: header.type === 'file' ? Buffer.concat(chunks) : undefined,
        mode: (header.mode ?? 0) & 0o111 ? 0o755 : 0o644,
        directory: header.type === 'directory',
      });
      next();
    })().catch((error) => {
      stream.destroy();
      extract.destroy(error as Error);
    });
  });
  try {
    await pipeline(createReadStream(archive), createGunzip(), limit, extract, { signal });
    const descriptor = entries.get('template.json')?.data;
    if (!descriptor) fail('E_ARCHIVE', 'extract', '缺少 template.json。');
    let raw: unknown;
    try {
      raw = JSON.parse(descriptor.toString('utf8'));
    } catch {
      fail('E_SCHEMA', 'extract', 'template.json 不是合法 JSON。');
    }
    const template = validateTemplate(raw);
    if (expected)
      for (const key of [
        'id',
        'version',
        'schemaVersion',
        'minCliVersion',
        'name',
        'category',
        'layout',
        'tags',
        'requirements',
      ] as const) {
        if (JSON.stringify(template[key]) !== JSON.stringify(expected[key]))
          fail('E_INTEGRITY', 'extract', `catalog 与模板描述不一致：${key}`);
      }
    const inputs = resolveInputs(
      template,
      typeof supplied === 'function' ? await supplied(template) : supplied,
    );
    const renderedFiles = new Set(template.render.files);
    const usedTokens = new Set<string>();
    const pathRules = template.render.paths ?? [];
    const usedPaths = new Set<string>();
    const sourceFiles = new Set<string>();
    const outputPaths = new Map<string, { spelling: string; directory: boolean }>();
    const renderText = (text: string, path: string): string => {
      for (const [token, key] of Object.entries(template.render.tokens)) {
        if (text.includes(token)) usedTokens.add(token);
        if (text.includes(token) && inputs[key] === undefined)
          fail('E_RENDER', 'render', `缺少 token 输入：${key}`);
        text = text.split(token).join(inputs[key] ?? '');
      }
      if (/__[A-Z][A-Z0-9_]*__/.test(text)) fail('E_RENDER', 'render', `残留 token：${path}`);
      return text;
    };
    const files: Stage['files'] = [];
    for (const [name, entry] of entries) {
      if (name === 'template.json') continue;
      const path = name.slice('files/'.length);
      relativePath(path);
      if (forbiddenPath(path))
        fail('E_ARCHIVE', 'extract', `模板包包含运行产物或保留文件：${path}`);
      const rule = pathRules.find((rule) => path === rule || path.startsWith(`${rule}/`));
      // Render only the declared prefix. Tokens in undeclared descendants still fail.
      const outputPath = rule ? renderText(rule, rule) + path.slice(rule.length) : path;
      if (/__[A-Z][A-Z0-9_]*__/.test(outputPath))
        fail('E_RENDER', 'render', `路径 token 未列入 render.paths：${path}`);
      relativePath(outputPath);
      if (forbiddenPath(outputPath))
        fail('E_ARCHIVE', 'render', `渲染路径包含运行产物或保留文件：${outputPath}`);
      const parts = outputPath.split('/');
      for (let index = 1; index <= parts.length; index++) {
        const prefix = parts.slice(0, index).join('/');
        const key = prefix.normalize('NFC').toLowerCase();
        const directory = index < parts.length || entry.directory;
        const previous = outputPaths.get(key);
        if (previous && (previous.spelling !== prefix || !previous.directory || !directory))
          fail('E_RENDER', 'render', `渲染路径冲突：${outputPath}`);
        outputPaths.set(key, { spelling: prefix, directory });
      }
      if (entry.directory) continue;
      if (rule) usedPaths.add(rule);
      sourceFiles.add(path);
      let bytes = entry.data!;
      const hasToken = Object.keys(template.render.tokens).some((token) =>
        bytes.includes(Buffer.from(token)),
      );
      if (renderedFiles.has(path)) {
        let text: string;
        try {
          text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        } catch {
          fail('E_RENDER', 'render', `非 UTF-8 渲染文件：${path}`);
        }
        if (bytes.includes(0) || bytes.subarray(0, 3).equals(Buffer.from([239, 187, 191])))
          fail('E_RENDER', 'render', `二进制或 BOM 渲染文件：${path}`);
        bytes = Buffer.from(renderText(text, path));
      } else if (hasToken) fail('E_RENDER', 'render', `token 文件未列入 render.files：${path}`);
      const destination = join(stage, outputPath);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, bytes, { flag: 'wx', mode: entry.mode });
      files.push({ path: outputPath, mode: entry.mode });
    }
    for (const path of renderedFiles)
      if (!sourceFiles.has(path)) fail('E_RENDER', 'render', `渲染文件不存在：${path}`);
    for (const path of pathRules)
      if (!usedPaths.has(path)) fail('E_RENDER', 'render', `渲染路径不存在：${path}`);
    for (const token of Object.keys(template.render.tokens))
      if (!usedTokens.has(token)) fail('E_RENDER', 'render', `未使用的 token 映射：${token}`);
    if (!files.length) fail('E_ARCHIVE', 'extract', '模板 files/ 不能为空。');
    return { path: stage, template, inputs, files };
  } catch (error) {
    await rm(stage, { recursive: true, force: true });
    if (signal?.aborted) cancelled(signal);
    if (error instanceof ForgeError) throw error;
    fail('E_ARCHIVE', 'extract', '模板包无法安全解包。');
  }
}
