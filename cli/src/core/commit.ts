import { mkdir, realpath, lstat, writeFile, readFile, rm, chmod } from 'node:fs/promises';
import { dirname, basename, resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fail, cancelled, ForgeError } from './errors.js';
import { validateRecord, type GenerationRecord } from './protocol/index.js';
import type { Stage } from './archive.js';
export async function canonicalTarget(target: string): Promise<string> {
  const full = resolve(target);
  if (basename(full).startsWith('.charon-forge-'))
    fail('E_INPUT', 'target', '目标目录不能使用工具保留名称。');
  let parent: string;
  try {
    parent = await realpath(dirname(full));
  } catch {
    fail('E_INPUT', 'target', '目标父目录必须已经存在。');
  }
  return join(parent, basename(full));
}
export async function commitProject(
  stage: Stage,
  target: string,
  record: GenerationRecord,
  signal?: AbortSignal,
): Promise<string> {
  validateRecord(record);
  const destination = await canonicalTarget(target);
  const parentBefore = await lstat(dirname(destination));
  let claimed = false;
  try {
    cancelled(signal);
    await mkdir(destination);
    claimed = true;
    const parentAfter = await lstat(dirname(destination));
    if (parentBefore.ino !== parentAfter.ino || parentBefore.dev !== parentAfter.dev)
      fail('E_WRITE', 'commit', '目标父目录在生成期间发生变化。');
    await writeFile(
      join(destination, '.charon-forge.incomplete.json'),
      JSON.stringify({ operationId: randomUUID(), createdAt: new Date().toISOString() }),
      { flag: 'wx' },
    );
    for (const file of stage.files) {
      cancelled(signal);
      const output = join(destination, file.path);
      // mkdir without recursive creation of an existing file; stage paths were validated.
      const relativeDir = dirname(file.path);
      let cursor = destination;
      if (relativeDir !== '.')
        for (const part of relativeDir.split('/')) {
          cursor = join(cursor, part);
          try {
            await mkdir(cursor);
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
            const stat = await lstat(cursor);
            if (!stat.isDirectory() || stat.isSymbolicLink())
              fail('E_WRITE', 'commit', '项目目录发生路径冲突。');
          }
        }
      await writeFile(output, await readFile(join(stage.path, file.path)), {
        flag: 'wx',
        mode: file.mode,
      });
      if (process.platform !== 'win32') await chmod(output, file.mode);
    }
    cancelled(signal);
    await writeFile(join(destination, '.charon-forge.json'), JSON.stringify(record, null, 2) + '\n', {
      flag: 'wx',
    });
    await rm(join(destination, '.charon-forge.incomplete.json'));
    return destination;
  } catch (error) {
    if (!claimed && (error as NodeJS.ErrnoException).code === 'EEXIST')
      fail('E_TARGET_EXISTS', 'commit', `目标已存在，未写入：${destination}`);
    if (!claimed && error instanceof ForgeError) throw error;
    if (claimed)
      fail(
        'E_INCOMPLETE',
        'commit',
        `生成中断，保留未完成目录供检查：${destination}。请使用新目录重试。`,
      );
    fail('E_WRITE', 'commit', `无法创建项目：${destination}`);
  } finally {
    await rm(stage.path, { recursive: true, force: true });
  }
}
