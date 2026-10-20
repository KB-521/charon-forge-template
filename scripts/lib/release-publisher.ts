import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { createHash } from 'node:crypto';
import tar from 'tar-stream';
import { sha256, LIMITS } from '../../cli/src/core/archive.js';
import { relativePath } from '../../cli/src/core/protocol/index.js';
import { stable } from './catalog.js';
import { pause, type GitHubRelease, type ReleaseAsset } from './release-github.js';

export type ReleaseTransport = {
  releases(): Promise<GitHubRelease[]>;
  createRelease(tag: string, sha: string): Promise<GitHubRelease>;
  upload(release: GitHubRelease, path: string): Promise<void>;
  publish(release: GitHubRelease): Promise<GitHubRelease>;
  assetBytes(release: GitHubRelease, asset: ReleaseAsset): Promise<Buffer>;
};

export async function ensureTemplateRelease(
  github: ReleaseTransport,
  tag: string,
  sha: string,
  paths: string[],
): Promise<GitHubRelease> {
  let release = (await github.releases()).find((item) => item.tag_name === tag);
  release ??= await github.createRelease(tag, sha);
  if (release.prerelease) throw new Error(`发布批次已被 prerelease 占用：${tag}`);
  for (const path of paths) {
    const name = basename(path);
    const bytes = await readFile(path);
    const existing = release.assets.find((item) => item.name === name);
    if (existing) {
      if (sha256(await github.assetBytes(release, existing)) !== sha256(bytes))
        throw new Error(`远端附件内容冲突，拒绝覆盖：${tag}/${name}`);
    } else {
      if (!release.draft) throw new Error(`正式发布缺少附件，拒绝修改：${tag}/${name}`);
      await github.upload(release, path);
      release = (await github.releases()).find((item) => item.tag_name === tag)!;
      const asset = release.assets.find((item) => item.name === name);
      if (!asset || sha256(await github.assetBytes(release, asset)) !== sha256(bytes))
        throw new Error(`上传后校验失败：${name}`);
    }
  }
  if (release.draft) release = await github.publish(release);
  return release;
}

export async function downloadPublic(url: string, max = LIMITS.archive): Promise<Buffer> {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok || !response.body) throw new Error(`公开下载失败：HTTP ${response.status}`);
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > max) throw new Error('公开下载超过大小限制。');
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function verifyPublicRelease(release: GitHubRelease, paths: string[]): Promise<void> {
  for (const path of paths) {
    const asset = release.assets.find((item) => item.name === basename(path));
    if (!asset) throw new Error(`公开发布缺少附件：${basename(path)}`);
    const expected = sha256(await readFile(path));
    for (let attempt = 0; ; attempt++) {
      try {
        if (sha256(await downloadPublic(asset.browser_download_url)) !== expected)
          throw new Error(`公开附件摘要不一致：${asset.name}`);
        break;
      } catch (error) {
        if (attempt === 4) throw error;
        await pause(2000);
      }
    }
  }
}

/** npm tarball timestamps/compression may vary; compare paths, executable bits and file bytes. */
export async function npmPackageDigest(bytes: Buffer): Promise<string> {
  if (bytes.length > LIMITS.archive) throw new Error('npm 包过大。');
  const files: { path: string; executable: boolean; sha256: string }[] = [];
  const seen = new Set<string>();
  const extract = tar.extract();
  let expanded = 0;
  const limit = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      expanded += chunk.length;
      callback(expanded > LIMITS.expanded ? new Error('npm 包展开超限。') : null, chunk);
    },
  });
  extract.on('entry', (header, stream, next) => {
    void (async () => {
      relativePath(header.name.replace(/\/$/, ''));
      if (header.type === 'directory') {
        stream.resume();
        await new Promise<void>((resolve) => stream.once('end', resolve));
        next();
        return;
      }
      if (
        header.type !== 'file' ||
        !header.name.startsWith('package/') ||
        seen.has(header.name) ||
        files.length >= LIMITS.entries ||
        header.size! > LIMITS.file
      )
        throw new Error('npm 包条目无效。');
      seen.add(header.name);
      const hash = createHash('sha256');
      for await (const chunk of stream) hash.update(chunk as Buffer);
      files.push({
        path: header.name,
        executable: Boolean((header.mode ?? 0) & 0o111),
        sha256: hash.digest('hex'),
      });
      next();
    })().catch((error) => extract.destroy(error as Error));
  });
  await pipeline(Readable.from([bytes]), createGunzip(), limit, extract);
  if (!files.length) throw new Error('npm 包为空。');
  return sha256(Buffer.from(stable(files.sort((a, b) => a.path.localeCompare(b.path)))));
}

export async function cliPublishStatus(
  name: string,
  version: string,
  localTarball: Buffer,
  fetcher: typeof fetch = fetch,
): Promise<'publish' | 'unchanged'> {
  const response = await fetcher(
    `https://registry.npmjs.org/${encodeURIComponent(name)}/${encodeURIComponent(version)}`,
    { signal: AbortSignal.timeout(30_000) },
  );
  if (response.status === 404) return 'publish';
  if (!response.ok) throw new Error(`npm 元数据查询失败：HTTP ${response.status}`);
  const metadata = (await response.json()) as { dist?: { tarball: string; integrity: string } };
  const dist = metadata.dist;
  if (
    !dist ||
    new URL(dist.tarball).origin !== 'https://registry.npmjs.org' ||
    !dist.integrity?.startsWith('sha512-')
  )
    throw new Error('npm 包元数据无效。');
  const remoteResponse = await fetcher(dist.tarball, { signal: AbortSignal.timeout(60_000) });
  if (!remoteResponse.ok || !remoteResponse.body) throw new Error('npm 包下载失败。');
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of remoteResponse.body) {
    size += chunk.length;
    if (size > LIMITS.archive) throw new Error('npm 包下载超限。');
    chunks.push(Buffer.from(chunk));
  }
  const remote = Buffer.concat(chunks);
  if (`sha512-${createHash('sha512').update(remote).digest('base64')}` !== dist.integrity)
    throw new Error('npm 包完整性校验失败。');
  if ((await npmPackageDigest(localTarball)) !== (await npmPackageDigest(remote)))
    throw new Error(
      `${name}@${version} 已发布且内容不同，请先提升 package.json 版本、提交并推送。`,
    );
  return 'unchanged';
}

/** A successful npm command accepts submission; npm validation remains asynchronous. */
export async function publishCliPackage(
  name: string,
  version: string,
  localTarball: Buffer,
  publish: () => Promise<void>,
  fetcher: typeof fetch = fetch,
): Promise<'submitted' | 'unchanged'> {
  if ((await cliPublishStatus(name, version, localTarball, fetcher)) === 'unchanged')
    return 'unchanged';
  await publish();
  return 'submitted';
}
