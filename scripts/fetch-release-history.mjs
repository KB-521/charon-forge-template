import { mkdir, writeFile } from 'node:fs/promises';
const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GH_TOKEN;
if (!repository || !token)
  throw new Error('This helper runs in an authenticated repository workflow.');
await mkdir('dist/history', { recursive: true });
let count = 0;
for (let page = 1; ; page++) {
  const response = await fetch(
    `https://api.github.com/repos/${repository}/releases?per_page=100&page=${page}`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!response.ok) throw new Error(`Release history HTTP ${response.status}`);
  const releases = await response.json();
  if (!releases.length) break;
  for (const release of releases) {
    if (
      release.draft ||
      release.prerelease ||
      !/^templates-\d{4}\.\d{2}\.\d{2}\.[1-9]\d*$/.test(release.tag_name)
    )
      continue;
    const asset = release.assets.find((item) => item.name === 'catalog.json');
    if (!asset)
      throw new Error(
        `Formal batch ${release.tag_name} has no catalog.json; aborting history merge.`,
      );
    const download = await fetch(asset.browser_download_url, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!download.ok) throw new Error(`Could not read historical catalog for ${release.tag_name}`);
    const bytes = Buffer.from(await download.arrayBuffer());
    if (bytes.length > 10 * 1024 ** 2) throw new Error('Historical catalog too large.');
    await writeFile(`dist/history/${release.tag_name}.json`, bytes, { flag: 'wx' });
    count++;
  }
}
console.log(`Read ${count} formal template catalogs; no release was created or changed.`);
