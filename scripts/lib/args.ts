import { readFile } from 'node:fs/promises';
import { Command } from 'commander';
import { ForgeError } from '../../cli/src/core/errors.js';
export function command(name: string): Command {
  return new Command().name(name);
}
export async function execute(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch (error) {
    console.error(
      error instanceof ForgeError
        ? `[${error.code}] ${error.message}`
        : error instanceof Error
          ? error.message
          : '操作失败',
    );
    process.exitCode = 1;
  }
}

export async function packageVersion(): Promise<string> {
  return (
    JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8')) as {
      version: string;
    }
  ).version;
}
