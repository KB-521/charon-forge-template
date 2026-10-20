import { build } from 'esbuild';
import { readFile, mkdir } from 'node:fs/promises';
const pkg = JSON.parse(await readFile(new URL('./package.json', import.meta.url), 'utf8'));
const config = JSON.parse(await readFile(new URL('./forge.config.json', import.meta.url), 'utf8'));
if (config.channelUrl !== null) {
  const url = new URL(config.channelUrl);
  if (url.protocol !== 'https:' || !config.allowedHosts.includes(url.hostname))
    throw new Error('channelUrl must use HTTPS and an allowed host');
}
await mkdir('dist/cli', { recursive: true });
await build({
  entryPoints: ['cli/src/index.ts'],
  outfile: 'dist/cli/index.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  packages: 'external',
  banner: {
    js: '#!/usr/bin/env node',
  },
  define: {
    __CLI_VERSION__: JSON.stringify(pkg.version),
    __DISTRIBUTION__: JSON.stringify(config),
  },
});
