import { Inject, Injectable } from '@nestjs/common';
import type OSS from 'ali-oss';
import { createWriteStream } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { basename, dirname, join } from 'node:path';
import { rename, rm } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { OSS_CLIENT, OSS_CONFIG } from './oss.constants';
import { createLazyOssClient } from './oss-client';
import type { OssYamlConfig } from './oss.config';

export interface OssListResult {
  objects: OSS.ObjectMeta[];
  prefixes: string[];
  nextMarker?: string;
  isTruncated: boolean;
}

/** Objects OSS accepts in one bulk delete request. */
const DELETE_BATCH_SIZE = 1_000;

/** OSS answers a key it does not hold with 404/`NoSuchKey`; anything else is unknown. */
function isMissingObject(error: unknown): boolean {
  const { status, code } = (error ?? {}) as { status?: unknown; code?: unknown };
  return status === 404 || code === 'NoSuchKey' || code === 'NotFound';
}

@Injectable()
export class OssService {
  private readonly bucketClients = new Map<string, OSS>();
  constructor(
    @Inject(OSS_CLIENT) private readonly client: OSS,
    @Inject(OSS_CONFIG) private readonly config: OssYamlConfig,
  ) {}

  async create(
    key: string,
    content: Buffer,
    contentType = 'application/octet-stream',
    bucketName = this.config.bucketName,
    cacheControl?: string,
  ): Promise<string> {
    this.checkKey(key);
    await this.clientForBucket(bucketName).put(key, content, {
      headers: {
        'Content-Type': contentType,
        ...(cacheControl ? { 'Cache-Control': cacheControl } : {}),
      },
    });
    return `oss://${bucketName}/${key}`;
  }

  async get(key: string, bucketName = this.config.bucketName): Promise<Buffer> {
    this.checkKey(key);
    const result = await this.clientForBucket(bucketName).get(key);
    if (!Buffer.isBuffer(result.content)) throw new Error('OSS returned invalid object content');
    return result.content;
  }

  /**
   * {@link get} for a caller that treats the object as a cache: a missing key
   * answers `null`, while a transport, auth or throttling failure is still thrown
   * so "it is not there" never gets confused with "the bucket could not be read".
   */
  async tryGet(key: string, bucketName = this.config.bucketName): Promise<Buffer | null> {
    try {
      return await this.get(key, bucketName);
    } catch (error) {
      if (isMissingObject(error)) return null;
      throw error;
    }
  }

  /**
   * Confirms one key is still in the bucket without moving its body. Only OSS's own
   * "no such object" answer returns `false`; a transport, auth or throttling failure is
   * thrown, so a caller can tell "it was deleted" from "the bucket could not be read".
   */
  async exists(key: string, bucketName = this.config.bucketName): Promise<boolean> {
    this.checkKey(key);
    try {
      await this.clientForBucket(bucketName).head(key);
      return true;
    } catch (error) {
      if (isMissingObject(error)) return false;
      throw error;
    }
  }

  /** Download atomically. Missing objects return false; failures preserve an existing target. */
  async tryDownloadToFile(
    key: string,
    filePath: string,
    bucketName = this.config.bucketName,
    options: { signal?: AbortSignal; timeoutMs?: number } = {},
  ): Promise<boolean> {
    this.checkKey(key);
    options.signal?.throwIfAborted();
    if (
      options.timeoutMs !== undefined &&
      (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0)
    ) {
      throw new Error('OSS download timeoutMs must be positive');
    }
    const temporary = join(dirname(filePath), `.${basename(filePath)}.${randomUUID()}.part`);
    try {
      const { stream } = await this.clientForBucket(bucketName).getStream(
        key,
        options.timeoutMs ? { timeout: options.timeoutMs } : undefined,
      );
      if (!stream) throw new Error('OSS returned no body');
      await pipeline(
        stream,
        createWriteStream(temporary, { flags: 'wx' }),
        options.signal ? { signal: options.signal } : {},
      );
      options.signal?.throwIfAborted();
      await rename(temporary, filePath);
      return true;
    } catch (error) {
      if (isMissingObject(error)) return false;
      throw error;
    } finally {
      await rm(temporary, { force: true });
    }
  }

  async list(
    prefix = '',
    marker?: string,
    maxKeys = 100,
    bucketName = this.config.bucketName,
    delimiter?: string,
  ): Promise<OssListResult> {
    if (prefix) this.checkKey(prefix);
    if (!Number.isInteger(maxKeys)) throw new Error('OSS maxKeys must be an integer');
    const result = await this.clientForBucket(bucketName).list(
      { prefix, marker, delimiter, 'max-keys': Math.min(Math.max(maxKeys, 1), 1_000) },
      {},
    );
    return {
      objects: result.objects ?? [],
      prefixes: result.prefixes ?? [],
      nextMarker: result.nextMarker || undefined,
      isTruncated: result.isTruncated === true,
    };
  }

  async update(...args: Parameters<OssService['create']>): Promise<string> {
    return this.create(...args);
  }
  async remove(key: string, bucketName = this.config.bucketName): Promise<void> {
    this.checkKey(key);
    await this.clientForBucket(bucketName).delete(key);
  }

  /**
   * Deletes many objects with the bulk API, one request per 1000 keys. A tile
   * sweep queues five figures of stale objects, and a per-object delete costs a
   * round trip each, so retention must not walk them one at a time. Returns the
   * number of objects OSS confirmed.
   */
  async removeMany(keys: readonly string[], bucketName = this.config.bucketName): Promise<number> {
    for (const key of keys) this.checkKey(key);
    const client = this.clientForBucket(bucketName);
    let deleted = 0;
    for (let index = 0; index < keys.length; index += DELETE_BATCH_SIZE) {
      const batch = keys.slice(index, index + DELETE_BATCH_SIZE);
      const result = await client.deleteMulti(batch);
      // Without `quiet` OSS echoes every deleted key, so a short list means the
      // remainder failed; the next sweep lists those objects again.
      deleted += result.deleted?.length ?? 0;
    }
    return deleted;
  }

  private clientForBucket(bucketName: string): OSS {
    if (!this.config.enabled)
      throw new Error('OSS is disabled; set OSS_ENABLED=true and provide OSS configuration');
    if (!bucketName.trim() || !this.config.allowedBucketNames.includes(bucketName))
      throw new Error('OSS bucket is not allowed');
    if (bucketName === this.config.bucketName) return this.client;
    const existing = this.bucketClients.get(bucketName);
    if (existing) return existing;
    const client = createLazyOssClient({ ...this.config, bucketName });
    this.bucketClients.set(bucketName, client);
    return client;
  }

  private checkKey(key: string): void {
    if (
      !key ||
      key.startsWith('/') ||
      key.includes('..') ||
      key.includes('\\') ||
      key.includes('//')
    )
      throw new Error('Invalid OSS object key');
  }
}
