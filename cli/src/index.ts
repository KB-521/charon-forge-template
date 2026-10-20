import { runCLI } from './commands/create.js';
import { readFile } from 'node:fs/promises';
declare const __CLI_VERSION__: string;
declare const __DISTRIBUTION__: { channelUrl: string | null; allowedHosts: string[] };
const version =
  typeof __CLI_VERSION__ === 'undefined'
    ? (JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'))
        .version as string)
    : __CLI_VERSION__;
const distribution =
  typeof __DISTRIBUTION__ === 'undefined'
    ? { channelUrl: null, allowedHosts: [] }
    : __DISTRIBUTION__;
process.exitCode = await runCLI(process.argv.slice(2), version, distribution);
