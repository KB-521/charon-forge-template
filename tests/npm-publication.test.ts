import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { temporary } from './helpers.js';
import { writeArchive } from '../cli/src/core/archive.js';
import { publishCliPackage } from '../scripts/lib/release-publisher.js';

async function withTarballs(check: (local: Buffer, changed: Buffer) => Promise<void>) {
  const root = await temporary();
  try {
    for (const text of ['original', 'changed']) {
      await writeArchive(join(root, text + '.tgz'), [
        { path: 'package/index.js', data: Buffer.from(text), mode: 0o644 },
      ]);
    }
    await check(
      await readFile(join(root, 'original.tgz')),
      await readFile(join(root, 'changed.tgz')),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
const registry = (bytes: Buffer): typeof fetch =>
  (async (url) =>
    String(url).endsWith('.tgz')
      ? new Response(new Uint8Array(bytes))
      : Response.json({
          dist: {
            tarball: 'https://registry.npmjs.org/plain/-/plain-1.0.0.tgz',
            integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}`,
          },
        })) as typeof fetch;

test('successful npm submission passes without querying registry again while validating', async () => {
  await withTarballs(async (bytes) => {
    let requests = 0;
    let publishes = 0;
    const fetcher = (async () => {
      requests++;
      return new Response('', { status: 404 });
    }) as typeof fetch;
    assert.equal(
      await publishCliPackage(
        'plain',
        '1.0.0',
        bytes,
        async () => {
          publishes++;
        },
        fetcher,
      ),
      'submitted',
    );
    assert.equal(publishes, 1);
    assert.equal(requests, 1, 'only preflight may query the registry');
  });
});

test('an npm command error still fails without post-publish polling', async () => {
  await withTarballs(async (bytes) => {
    let requests = 0;
    const failure = new Error('npm publish failed (1)');
    const fetcher = (async () => {
      requests++;
      return new Response('', { status: 404 });
    }) as typeof fetch;
    await assert.rejects(
      publishCliPackage(
        'plain',
        '1.0.0',
        bytes,
        async () => {
          throw failure;
        },
        fetcher,
      ),
      (error) => error === failure,
    );
    assert.equal(requests, 1);
  });
});

test('an already published matching package skips npm submission', async () => {
  await withTarballs(async (bytes) => {
    let publishes = 0;
    assert.equal(
      await publishCliPackage(
        'plain',
        '1.0.0',
        bytes,
        async () => {
          publishes++;
        },
        registry(bytes),
      ),
      'unchanged',
    );
    assert.equal(publishes, 0);
  });
});

test('a preflight version conflict fails before invoking npm', async () => {
  await withTarballs(async (bytes, changed) => {
    let publishes = 0;
    await assert.rejects(
      publishCliPackage(
        'plain',
        '1.0.0',
        bytes,
        async () => {
          publishes++;
        },
        registry(changed),
      ),
      /已发布且内容不同/,
    );
    assert.equal(publishes, 0);
  });
});
