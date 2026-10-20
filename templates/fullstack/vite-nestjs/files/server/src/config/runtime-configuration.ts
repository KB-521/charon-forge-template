import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parse } from 'yaml';

function findConfigDirectory(): string {
  if (process.env.APP_CONFIG_DIR) return resolve(process.env.APP_CONFIG_DIR);
  let current = __dirname;
  while (true) {
    const candidate = resolve(current, 'docker');
    if (existsSync(resolve(candidate, 'env.dev.yaml'))) return candidate;
    const parent = dirname(current);
    if (parent === current)
      throw new Error('Cannot locate docker/env.dev.yaml; set APP_CONFIG_DIR');
    current = parent;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function loadRuntimeConfiguration(): Record<string, string> {
  const profile = process.env.APP_ENV ?? process.env.SPRING_PROFILES_ACTIVE ?? 'dev';
  if (!['dev', 'prod'].includes(profile)) throw new Error('APP_ENV must be dev or prod');
  const configPath = resolve(findConfigDirectory(), `env.${profile}.yaml`);
  const document: unknown = parse(readFileSync(configPath, 'utf8'));
  if (!isRecord(document) || !isRecord(document.environment)) {
    throw new Error('Configuration must contain an environment mapping');
  }

  const config: Record<string, string> = { APP_ENV: profile };
  for (const group of Object.values(document.environment)) {
    if (!isRecord(group)) throw new Error('Configuration groups must be mappings');
    for (const [key, value] of Object.entries(group)) {
      if (key === 'APP_ENV' || !/^[A-Z][A-Z0-9_]*$/.test(key) || Object.hasOwn(config, key)) {
        throw new Error('Configuration contains an invalid or duplicate key');
      }
      if (!['string', 'number', 'boolean'].includes(typeof value)) {
        throw new Error(`Configuration ${key} must be a scalar`);
      }
      config[key] = process.env[key] ?? String(value);
    }
  }
  return config;
}
