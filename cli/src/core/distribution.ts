import { readFile, writeFile, mkdir, rename, rm, open } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { homedir } from 'node:os';
import semver from 'semver';
import { sha256, LIMITS } from './archive.js';
import { ForgeError, fail, cancelled } from './errors.js';
import {
  validateCatalog,
  validateChannel,
  type Catalog,
  type PublishedVersion,
} from './protocol/index.js';
export type Distribution = { channelUrl: string | null; allowedHosts: string[] };
export type Snapshot = { catalog: Catalog; digest: string | null; offline: boolean };
export type NetworkOptions = {
  cacheDir?: string;
  fetch?: typeof fetch;
  allowHttpForTests?: boolean;
  signal?: AbortSignal;
  delay?: (ms: number) => Promise<void>;
};
export class RemoteStore {
  readonly cacheDir: string;
  constructor(
    readonly config: Distribution,
    readonly options: NetworkOptions = {},
  ) {
    this.cacheDir = options.cacheDir ?? join(homedir(), '.cache', 'charon-forge');
  }
  private checkUrl(raw: string): URL {
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      fail('E_SCHEMA', 'network', '分发 URL 无效。');
    }
    if (
      url.username ||
      url.password ||
      url.hash ||
      (url.protocol !== 'https:' &&
        !(this.options.allowHttpForTests && url.protocol === 'http:')) ||
      !this.config.allowedHosts.includes(url.hostname)
    )
      fail('E_SCHEMA', 'network', '分发 URL 不在可信 HTTPS 来源内。');
    return url;
  }
  private async response(raw: string, signal: AbortSignal): Promise<Response> {
    let url = this.checkUrl(raw);
    for (let redirects = 0; redirects <= 5; redirects++) {
      const response = await (this.options.fetch ?? fetch)(url, { redirect: 'manual', signal });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        await response.body?.cancel();
        const location = response.headers.get('location');
        if (!location) fail('E_NETWORK', 'network', '重定向缺少地址。');
        url = this.checkUrl(new URL(location, url).href);
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw new ForgeError(
          'E_NETWORK',
          'network',
          `下载失败：HTTP ${response.status}`,
          response.status === 408 || response.status === 429 || response.status >= 500,
        );
      }
      return response;
    }
    fail('E_NETWORK', 'network', '重定向次数超限。');
  }
  private async transfer(raw: string, max: number, destination?: string): Promise<Buffer> {
    this.checkUrl(raw);
    cancelled(this.options.signal);
    const overall = AbortSignal.timeout(5 * 60_000);
    for (let attempt = 0; attempt < 3; attempt++) {
      const signal = AbortSignal.any([
        overall,
        AbortSignal.timeout(30_000),
        ...(this.options.signal ? [this.options.signal] : []),
      ]);
      let handle: Awaited<ReturnType<typeof open>> | undefined;
      try {
        const response = await this.response(raw, signal);
        if (Number(response.headers.get('content-length') ?? 0) > max) {
          await response.body?.cancel();
          fail('E_INTEGRITY', 'download', '下载体积超限。');
        }
        if (!response.body) fail('E_NETWORK', 'download', '下载响应为空。');
        if (destination) handle = await open(destination, 'wx');
        const chunks: Buffer[] = [];
        let size = 0;
        for await (const chunk of response.body) {
          size += chunk.length;
          if (size > max) fail('E_INTEGRITY', 'download', '下载体积超限。');
          if (handle) await handle.writeFile(chunk);
          else chunks.push(Buffer.from(chunk));
        }
        await handle?.close();
        handle = undefined;
        return destination ? Buffer.alloc(0) : Buffer.concat(chunks);
      } catch (error) {
        await handle?.close();
        if (destination) await rm(destination, { force: true });
        cancelled(this.options.signal);
        if (error instanceof ForgeError && !error.retryable) throw error;
        if (attempt === 2 || overall.aborted)
          throw new ForgeError('E_NETWORK', 'download', '网络连接失败，重试已用尽。', true);
        await (this.options.delay ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms))))(
          500 * 2 ** attempt,
        );
      }
    }
    fail('E_NETWORK', 'download', '网络下载失败。');
  }
  async loadCatalog(): Promise<Snapshot> {
    if (!this.config.channelUrl)
      return {
        catalog: { schemaVersion: 1, catalogVersion: 'unconfigured', templates: {} },
        digest: null,
        offline: false,
      };
    await mkdir(this.cacheDir, { recursive: true });
    const pointerPath = join(
      this.cacheDir,
      `channel-${sha256(Buffer.from(this.config.channelUrl))}.json`,
    );
    const parse = (bytes: Buffer): unknown => {
      try {
        return JSON.parse(bytes.toString('utf8'));
      } catch {
        fail('E_SCHEMA', 'catalog', 'catalog/channel 不是合法 JSON。');
      }
    };
    let offline = false,
      channelBytes: Buffer;
    try {
      channelBytes = await this.transfer(this.config.channelUrl, 64 * 1024);
    } catch (error) {
      if (!(error instanceof ForgeError) || error.code !== 'E_NETWORK' || !error.retryable)
        throw error;
      try {
        channelBytes = await readFile(pointerPath);
      } catch {
        fail('E_OFFLINE_MISS', 'catalog', '无法联网，且没有完整 channel 缓存。');
      }
      offline = true;
    }
    const channel = validateChannel(parse(channelBytes));
    this.checkUrl(channel.catalogUrl);
    const cached = join(this.cacheDir, `${channel.sha256}.catalog.json`);
    let bytes: Buffer;
    try {
      bytes = await readFile(cached);
      if (sha256(bytes) !== channel.sha256) throw new Error('cache mismatch');
    } catch {
      await rm(cached, { force: true });
      if (offline) fail('E_OFFLINE_MISS', 'catalog', '离线 catalog 缓存缺失或损坏。');
      bytes = await this.transfer(channel.catalogUrl, 10 * 1024 ** 2);
      if (sha256(bytes) !== channel.sha256) fail('E_INTEGRITY', 'catalog', 'catalog 摘要不一致。');
    }
    const catalog = validateCatalog(parse(bytes));
    if (catalog.catalogVersion !== channel.catalogVersion)
      fail('E_INTEGRITY', 'catalog', 'channel/catalog 批次不一致。');
    await this.atomicCache(cached, bytes);
    if (!offline) await this.atomicCache(pointerPath, channelBytes);
    return { catalog, digest: channel.sha256, offline };
  }
  private async atomicCache(path: string, bytes: Buffer): Promise<void> {
    const temp = `${path}.${randomUUID()}.part`;
    try {
      await writeFile(temp, bytes, { flag: 'wx' });
      await rename(temp, path);
    } finally {
      await rm(temp, { force: true });
    }
  }
  async download(meta: PublishedVersion, offline = false): Promise<string> {
    this.checkUrl(meta.artifactUrl);
    await mkdir(this.cacheDir, { recursive: true });
    const destination = join(this.cacheDir, `${meta.sha256}.tgz`);
    try {
      if ((await hashFile(destination)) === meta.sha256) return destination;
    } catch {
      /* Missing or corrupted cache is never trusted. */
    }
    await rm(destination, { force: true });
    if (offline) fail('E_OFFLINE_MISS', 'download', '离线模板包缓存缺失或损坏。');
    const temp = `${destination}.${randomUUID()}.part`;
    try {
      await this.transfer(meta.artifactUrl, LIMITS.archive, temp);
      if ((await hashFile(temp)) !== meta.sha256)
        fail('E_INTEGRITY', 'download', '模板包 SHA-256 不一致。');
      await rename(temp, destination);
      return destination;
    } finally {
      await rm(temp, { force: true });
    }
  }
}
export async function hashFile(path: string): Promise<string> {
  const handle = await open(path, 'r');
  const hash = createHash('sha256');
  let size = 0;
  try {
    for await (const chunk of handle.createReadStream()) {
      size += chunk.length;
      if (size > LIMITS.archive) fail('E_INTEGRITY', 'cache', '缓存超限。');
      hash.update(chunk);
    }
    return hash.digest('hex');
  } finally {
    await handle.close();
  }
}
export function compatible(meta: PublishedVersion, cliVersion: string): boolean {
  return meta.schemaVersion === 1 && semver.gte(cliVersion, meta.minCliVersion);
}
export function recommended(
  catalog: Catalog,
  id: string,
  cliVersion: string,
): PublishedVersion | undefined {
  const item = Object.hasOwn(catalog.templates, id) ? catalog.templates[id] : undefined;
  if (!item) return undefined;
  return item.recommendedVersions
    .map((v) => item.versions[v]!)
    .find((meta) => compatible(meta, cliVersion));
}
export function resolveTemplate(
  catalog: Catalog,
  id: string,
  cliVersion: string,
  requested?: string,
): PublishedVersion {
  const item = Object.hasOwn(catalog.templates, id) ? catalog.templates[id] : undefined;
  if (!item) fail('E_INPUT', 'resolve', `未知模板：${id}`);
  if (requested && !semver.valid(requested))
    fail('E_INPUT', 'resolve', '模板版本必须是完整 SemVer。');
  const meta = requested ? item.versions[requested] : recommended(catalog, id, cliVersion);
  if (!meta)
    fail(
      'E_COMPAT',
      'resolve',
      requested ? `没有版本：${id}@${requested}` : '没有兼容推荐版本，请升级 CLI。',
    );
  if (!compatible(meta, cliVersion))
    fail('E_COMPAT', 'resolve', `模板需要 CLI >= ${meta.minCliVersion}。`);
  return meta;
}
