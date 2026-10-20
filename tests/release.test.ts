import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';
import { fixture } from './helpers.js';
import { packTemplate, archiveContentDigest } from '../scripts/lib/template-pack.js';
import { mergeCatalogs, type PackedArtifact } from '../scripts/lib/catalog.js';
import {
  batchVersion,
  detectTemplateChanges,
  selectTemplate,
  validateSelections,
  parseReleasePlan,
  type ReleasePlan,
} from '../scripts/lib/release-plan.js';
import {
  GitHubClient,
  type GitHubRelease,
  type ReleaseAsset,
} from '../scripts/lib/release-github.js';
import {
  ensureTemplateRelease,
  npmPackageDigest,
  cliPublishStatus,
  type ReleaseTransport,
} from '../scripts/lib/release-publisher.js';
import { writeArchive, sha256 } from '../cli/src/core/archive.js';

test('release detection normalizes versions and only reacts to actual publish inputs', async () => {
  const f = await fixture();
  try {
    const loadArchive = () => readFile(f.archive);
    const artifact: PackedArtifact = {
      template: f.template,
      filename: 'fixture-plain-1.0.0.tgz',
      sha256: f.packed.digest,
      files: f.packed.files,
    };
    const history = mergeCatalogs([], '2026.10.20.1', [artifact], 'https://example.com/first/');
    assert.equal((await detectTemplateChanges(f.root, []))[0]!.status, 'new');
    assert.equal(
      (await detectTemplateChanges(f.root, [history], loadArchive))[0]!.status,
      'unchanged',
    );
    await writeFile(
      join(f.directory, 'template.json'),
      JSON.stringify({ ...f.template, version: '1.0.1' }),
    );
    assert.equal(
      (await detectTemplateChanges(f.root, [history], loadArchive))[0]!.status,
      'unchanged',
    );
    await writeFile(join(f.directory, 'files/README.md'), '# __PROJECT_NAME__\nchanged\n');
    const [change] = await detectTemplateChanges(f.root, [history], loadArchive);
    assert.equal(change!.status, 'changed');
    assert.equal(change!.suggestedVersion, '1.0.1');
    assert.throws(() => selectTemplate(change!, '1.0.0'), /必须高于/);
    assert.throws(() => selectTemplate(change!, '1.0.1+mutable'));
    const selection = selectTemplate(change!, '1.1.0');
    validateSelections([change!], [selection]);
    assert.throws(
      () => validateSelections([change!], [{ ...selection, previousSha256: '0'.repeat(64) }]),
      /已变化/,
    );
    const packed = await packTemplate(f.root, f.directory, join(f.root, 'release.tgz'), {
      version: '1.1.0',
    });
    assert.equal(packed.template.version, '1.1.0');
    assert.equal(
      JSON.parse(await readFile(join(f.directory, 'template.json'), 'utf8')).version,
      '1.0.1',
    );
  } finally {
    await f.cleanup();
  }
});

test('only selected templates enter the new batch; unselected templates and all history remain', async () => {
  const f = await fixture();
  try {
    const second = join(f.root, 'templates/fixture/second');
    await cp(f.directory, second, { recursive: true });
    await writeFile(join(second, 'template.json'), JSON.stringify({ ...f.template, id: 'second' }));
    execFileSync('git', ['add', 'templates'], { cwd: f.root });
    const secondPack = await packTemplate(f.root, second, join(f.root, 'second.tgz'));
    const base = mergeCatalogs(
      [],
      '2026.10.20.1',
      [
        {
          template: f.template,
          filename: 'plain-1.0.0.tgz',
          sha256: f.packed.digest,
          files: f.packed.files,
        },
        {
          template: secondPack.template,
          filename: 'second-1.0.0.tgz',
          sha256: secondPack.digest,
          files: secondPack.files,
        },
      ],
      'https://example.com/first/',
    );
    await writeFile(join(f.directory, 'files/README.md'), '# changed\n');
    await writeFile(join(second, 'files/README.md'), '# changed too\n');
    const changes = await detectTemplateChanges(f.root, [base], (version) =>
      readFile(version.id === 'second' ? join(f.root, 'second.tgz') : f.archive),
    );
    assert.equal(changes.filter((item) => item.status === 'changed').length, 2);
    const selected = selectTemplate(
      changes.find((item) => item.template.id === f.template.id)!,
      '1.0.1',
    );
    validateSelections(changes, [selected]);
    const packed = await packTemplate(f.root, f.directory, join(f.root, 'selected.tgz'), {
      version: selected.version,
    });
    const catalog = mergeCatalogs(
      [base],
      '2026.10.20.2',
      [
        {
          template: packed.template,
          filename: 'plain-1.0.1.tgz',
          sha256: packed.digest,
          files: packed.files,
        },
      ],
      'https://example.com/second/',
    );
    assert.deepEqual(catalog.templates.second, base.templates.second);
    assert.deepEqual(
      catalog.templates[f.template.id]!.versions['1.0.0'],
      base.templates[f.template.id]!.versions['1.0.0'],
    );
    assert.ok(catalog.templates[f.template.id]!.versions['1.0.1']);
    assert.throws(() => validateSelections([], [selected]), /已变化/);
  } finally {
    await f.cleanup();
  }
});

test('release comparison ignores gzip platform/compression differences but preserves artifact integrity', async () => {
  const f = await fixture();
  try {
    const original = await readFile(f.archive);
    const mac = Buffer.from(original);
    const linux = Buffer.from(original);
    mac[9] = 19;
    linux[9] = 3;
    const recompressed = gzipSync(gunzipSync(original), { level: 1 });
    assert.notEqual(sha256(mac), sha256(linux));
    assert.notEqual(sha256(original), sha256(recompressed));
    const baseline = (await detectTemplateChanges(f.root, []))[0]!;
    assert.equal(baseline.comparisonSha256, await archiveContentDigest(linux));
    for (const bytes of [mac, linux, recompressed]) {
      const history = mergeCatalogs(
        [],
        '2026.10.20.1',
        [
          {
            template: f.template,
            filename: 'fixture-plain-1.0.0.tgz',
            sha256: sha256(bytes),
            files: f.packed.files,
          },
        ],
        'https://example.com/first/',
      );
      const [change] = await detectTemplateChanges(f.root, [history], async () => bytes);
      assert.equal(change!.status, 'unchanged');
      assert.equal(change!.comparisonSha256, baseline.comparisonSha256);
      await assert.rejects(
        detectTemplateChanges(f.root, [history], async () => Buffer.from('corrupt')),
        /历史模板包摘要不一致/,
      );
    }
    await writeFile(join(f.directory, 'files/README.md'), '# changed content\n');
    const [changed] = await detectTemplateChanges(f.root, []);
    assert.notEqual(changed!.comparisonSha256, baseline.comparisonSha256);
    assert.throws(
      () => validateSelections([changed!], [selectTemplate(baseline, '1.0.0')]),
      /已变化/,
    );
  } finally {
    await f.cleanup();
  }
});

test('plans reject malformed/duplicate selections and batches are stable for a run', () => {
  const plan: ReleasePlan = {
    schemaVersion: 1,
    repository: 'owner/repo',
    sha: 'a'.repeat(40),
    requestId: randomUUID(),
    cli: false,
    templates: [],
  };
  assert.deepEqual(parseReleasePlan(plan), plan);
  assert.throws(() => parseReleasePlan({ ...plan, repository: 'https://example.com' }));
  assert.throws(() => parseReleasePlan({ ...plan, sha: 'main' }));
  const item = {
    id: 'plain',
    version: '1.0.0',
    previousVersion: null,
    previousSha256: null,
    comparisonSha256: 'b'.repeat(64),
  };
  assert.throws(() => parseReleasePlan({ ...plan, templates: [item, item] }));
  assert.equal(batchVersion('123', new Date('2026-10-20T12:00:00Z')), '2026.10.20.123');
  assert.throws(() => batchVersion('../bad'));
});

class MemoryReleases implements ReleaseTransport {
  release?: GitHubRelease;
  bytes = new Map<string, Buffer>();
  mutations: string[] = [];
  async releases() {
    return this.release ? [this.release] : [];
  }
  async createRelease(tag: string) {
    this.mutations.push('create');
    return (this.release = {
      id: 1,
      tag_name: tag,
      draft: true,
      prerelease: false,
      assets: [],
      html_url: 'https://example.com/release',
    });
  }
  async upload(release: GitHubRelease, path: string) {
    const name = path.split(/[\\/]/).at(-1)!;
    this.mutations.push(`upload:${name}`);
    this.bytes.set(name, await readFile(path));
    release.assets.push({
      id: release.assets.length + 1,
      name,
      browser_download_url: `https://example.com/${name}`,
      size: this.bytes.get(name)!.length,
    });
  }
  async publish(release: GitHubRelease) {
    this.mutations.push('publish');
    release.draft = false;
    return release;
  }
  async assetBytes(_release: GitHubRelease, asset: ReleaseAsset) {
    return this.bytes.get(asset.name)!;
  }
}

test('release retry resumes a partial draft and never overwrites formal assets', async () => {
  const f = await fixture();
  try {
    const remote = new MemoryReleases();
    const first = join(f.root, 'catalog.json');
    const second = join(f.root, 'release-plan.json');
    await writeFile(first, '{"catalog":true}\n');
    await writeFile(second, '{"plan":true}\n');
    const draft = await remote.createRelease('templates-2026.10.20.1');
    await remote.upload(draft, first);
    await ensureTemplateRelease(remote, draft.tag_name, 'a'.repeat(40), [first, second]);
    assert.deepEqual(remote.mutations, [
      'create',
      'upload:catalog.json',
      'upload:release-plan.json',
      'publish',
    ]);
    remote.mutations = [];
    await ensureTemplateRelease(remote, draft.tag_name, 'a'.repeat(40), [first, second]);
    assert.deepEqual(remote.mutations, []);
    await writeFile(first, 'different');
    await assert.rejects(
      ensureTemplateRelease(remote, draft.tag_name, 'a'.repeat(40), [first]),
      /拒绝覆盖/,
    );
    remote.release!.assets.pop();
    await assert.rejects(
      ensureTemplateRelease(remote, draft.tag_name, 'a'.repeat(40), [second]),
      /拒绝修改/,
    );
  } finally {
    await f.cleanup();
  }
});

test('npm compares package files rather than gzip bytes, skips matches and rejects conflicts', async () => {
  const f = await fixture();
  try {
    const one = join(f.root, 'npm-one.tgz');
    const two = join(f.root, 'npm-two.tgz');
    const changed = join(f.root, 'npm-changed.tgz');
    await writeArchive(one, [
      { path: 'package/index.js', data: Buffer.from('hello'), mode: 0o644 },
    ]);
    await writeArchive(two, [
      { path: 'package/index.js', data: Buffer.from('hello'), mode: 0o600 },
    ]);
    await writeArchive(changed, [
      { path: 'package/index.js', data: Buffer.from('changed'), mode: 0o644 },
    ]);
    const bytes = await readFile(one);
    assert.equal(await npmPackageDigest(bytes), await npmPackageDigest(await readFile(two)));
    const integrity = `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
    const fetcher = (async (url: string | URL | Request) =>
      String(url).endsWith('.tgz')
        ? new Response(new Uint8Array(bytes))
        : Response.json({
            dist: { tarball: 'https://registry.npmjs.org/plain/-/plain.tgz', integrity },
          })) as typeof fetch;
    assert.equal(
      await cliPublishStatus('plain', '1.0.0', await readFile(two), fetcher),
      'unchanged',
    );
    await assert.rejects(
      cliPublishStatus('plain', '1.0.0', await readFile(changed), fetcher),
      /提升 package.json 版本/,
    );
    assert.equal(
      await cliPublishStatus(
        'plain',
        '1.0.0',
        bytes,
        (async () => new Response('', { status: 404 })) as typeof fetch,
      ),
      'publish',
    );
    await assert.rejects(
      cliPublishStatus(
        'plain',
        '1.0.0',
        bytes,
        (async () => new Response('', { status: 503 })) as typeof fetch,
      ),
      /元数据查询失败/,
    );
  } finally {
    await f.cleanup();
  }
});

test('dispatch sends structured inputs and matches its own workflow run', async () => {
  const plan: ReleasePlan = {
    schemaVersion: 1,
    repository: 'owner/repo',
    sha: 'a'.repeat(40),
    requestId: randomUUID(),
    templates: [],
    cli: true,
  };
  const calls: unknown[] = [];
  class FakeGitHub extends GitHubClient {
    override async json<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
      calls.push({ path, method, body });
      return {
        workflow_runs: [
          { id: 1, display_title: 'other request', head_sha: plan.sha },
          { id: 2, display_title: `Release ${plan.requestId}`, head_sha: plan.sha },
        ],
      } as T;
    }
  }
  const client = new FakeGitHub(plan.repository);
  await client.dispatch(plan, 'main');
  assert.deepEqual(calls[0], {
    path: 'repos/owner/repo/actions/workflows/release.yml/dispatches',
    method: 'POST',
    body: { ref: 'main', inputs: { plan: JSON.stringify(plan), request_id: plan.requestId } },
  });
  assert.equal((await client.findRun(plan))!.id, 2);
});
