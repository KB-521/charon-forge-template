import { Ajv } from 'ajv';
import type { FromSchema } from 'json-schema-to-ts';
import semver from 'semver';
import {
  templateSchema,
  catalogSchema,
  channelSchema,
  generationRecordSchema,
} from './schemas.generated.js';
import { fail } from '../errors.js';
export type Template = FromSchema<typeof templateSchema>;
export type Catalog = FromSchema<typeof catalogSchema>;
export type Channel = FromSchema<typeof channelSchema>;
export type GenerationRecord = FromSchema<typeof generationRecordSchema>;
export type PublishedVersion = Catalog['templates'][string]['versions'][string];
export type Inputs = Record<string, string>;
const ajv = new Ajv({ allErrors: true, strict: true, allowUnionTypes: true });
const checks = {
  template: ajv.compile(templateSchema),
  catalog: ajv.compile(catalogSchema),
  channel: ajv.compile(channelSchema),
  record: ajv.compile(generationRecordSchema),
};
function validate<T>(kind: keyof typeof checks, value: unknown): T {
  const check = checks[kind];
  if (!check(value)) fail('E_SCHEMA', 'protocol', `${kind}: ${ajv.errorsText(check.errors)}`);
  return value as T;
}
function version(value: string): void {
  if (!semver.valid(value) || value.includes('+'))
    fail('E_SCHEMA', 'protocol', `非法版本：${value}`);
}
export function relativePath(value: string): void {
  if (
    !value ||
    value.startsWith('/') ||
    value.includes('\\') ||
    value
      .split('/')
      .some(
        (p) =>
          !p ||
          p === '.' ||
          p === '..' ||
          /[\x00-\x1f<>:"|?*]/.test(p) ||
          /[. ]$/.test(p) ||
          /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(p),
      )
  ) {
    fail('E_ARCHIVE', 'path', `不安全的相对路径：${JSON.stringify(value)}`);
  }
}
export function forbiddenPath(path: string): boolean {
  const parts = path.split('/');
  // These exact paths are public browser configuration, not private dotenv files.
  const publicRuntimeConfig = ['docker-config/.env.dev', 'docker-config/.env.prod'].includes(path);
  return parts.some(
    (p) =>
      [
        'node_modules',
        '.git',
        '.next',
        '.dart_tool',
        '.venv',
        '__pycache__',
        'coverage',
        'dist',
        'target',
        'build',
        'LOCAL.md',
        '.charon-forge.json',
        '.charon-forge.incomplete.json',
      ].includes(p) ||
      /\.log$/i.test(p) ||
      (p.startsWith('.env') && p !== '.env.example' && !publicRuntimeConfig),
  );
}
export function validateTemplate(value: unknown): Template {
  const t = validate<Template>('template', value);
  version(t.version);
  version(t.minCliVersion);
  if (['constructor', 'prototype'].includes(t.id))
    fail('E_SCHEMA', 'protocol', '模板 ID 为保留名称。');
  if (!t.inputs.projectName?.required)
    fail('E_SCHEMA', 'protocol', 'inputs.projectName 必须声明为必填。');
  for (const [key, input] of Object.entries(t.inputs)) {
    if (
      !/^[A-Za-z][A-Za-z0-9]*$/.test(key) ||
      ['__proto__', 'constructor', 'prototype'].includes(key)
    )
      fail('E_SCHEMA', 'protocol', `非法输入字段：${key}`);
    if (input.pattern) {
      try {
        new RegExp(input.pattern);
      } catch {
        fail('E_SCHEMA', 'protocol', `非法 pattern：${key}`);
      }
    }
  }
  for (const path of t.render.files) relativePath(path);
  for (const pattern of t.publish.include) {
    if (
      pattern.startsWith('/') ||
      pattern.startsWith('!') ||
      pattern.includes('\\') ||
      pattern.split('/').includes('..') ||
      /^[A-Za-z]:/.test(pattern)
    )
      fail('E_SCHEMA', 'protocol', `非法 include：${pattern}`);
  }
  for (const [token, key] of Object.entries(t.render.tokens)) {
    if (!/^__[A-Z][A-Z0-9_]*__$/.test(token) || !Object.hasOwn(t.inputs, key))
      fail('E_SCHEMA', 'protocol', `非法 token 映射：${token}`);
  }
  const paths = t.render.paths ?? [];
  if (t.render.paths && semver.lt(t.minCliVersion, '0.1.2'))
    fail('E_SCHEMA', 'protocol', '路径渲染要求 minCliVersion >= 0.1.2。');
  for (const path of paths) {
    relativePath(path);
    const tokens = path.match(/__[A-Z][A-Z0-9_]*__/g) ?? [];
    if (!tokens.length || tokens.some((token) => !Object.hasOwn(t.render.tokens, token)))
      fail('E_SCHEMA', 'protocol', `路径须使用已声明的 token：${path}`);
    if (paths.some((other) => other !== path && path.startsWith(`${other}/`)))
      fail('E_SCHEMA', 'protocol', `路径渲染规则不能嵌套：${path}`);
  }
  if (t.install.adapter === 'node' && !t.install.packageManagers?.length)
    fail('E_SCHEMA', 'protocol', 'Node 安装适配器须声明 packageManagers。');
  for (const r of t.requirements)
    if (!semver.validRange(r.range)) fail('E_SCHEMA', 'protocol', `非法工具版本范围：${r.range}`);
  return t;
}
export function validateCatalog(value: unknown): Catalog {
  const c = validate<Catalog>('catalog', value);
  for (const [id, item] of Object.entries(c.templates)) {
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id) || ['constructor', 'prototype'].includes(id))
      fail('E_SCHEMA', 'catalog', `非法模板 ID：${id}`);
    for (const [v, meta] of Object.entries(item.versions)) {
      version(v);
      version(meta.minCliVersion);
      if (meta.id !== id || meta.version !== v) fail('E_SCHEMA', 'catalog', '版本键与描述不一致。');
    }
    for (const v of item.recommendedVersions)
      if (!item.versions[v] || semver.prerelease(v))
        fail('E_SCHEMA', 'catalog', `推荐版本无效：${id}@${v}`);
  }
  return c;
}
export const validateChannel = (value: unknown): Channel => validate<Channel>('channel', value);
export const validateRecord = (value: unknown): GenerationRecord =>
  validate<GenerationRecord>('record', value);
export function validateInput(key: string, rule: Template['inputs'][string], value: string): void {
  // v1 only supports identifier-like public text; arbitrary free text needs contextual encoding.
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value))
    fail(
      'E_INPUT',
      'inputs',
      `输入格式无效：${key}。须以小写字母开头，仅含小写字母、数字或单个短横线，且不能以短横线结尾，例如 app-2。`,
    );
  const maxLength = Math.min(rule.maxLength ?? 63, 63);
  if (value.length > maxLength)
    fail('E_INPUT', 'inputs', `输入格式无效：${key}。长度不能超过 ${maxLength} 个字符。`);
  if (value.length < (rule.minLength ?? 1))
    fail('E_INPUT', 'inputs', `输入格式无效：${key}。长度不能少于 ${rule.minLength} 个字符。`);
  if (rule.pattern && !new RegExp(rule.pattern).test(value))
    fail(
      'E_INPUT',
      'inputs',
      `输入格式无效：${key}。须匹配模板规则 ${JSON.stringify(rule.pattern)}。`,
    );
  relativePath(value);
}
export function resolveInputs(template: Template, supplied: Inputs): Inputs {
  for (const key of Object.keys(supplied))
    if (!Object.hasOwn(template.inputs, key)) fail('E_INPUT', 'inputs', `未知输入：${key}`);
  const result: Inputs = {};
  for (const [key, rule] of Object.entries(template.inputs)) {
    const value = supplied[key] ?? rule.default;
    if (value === undefined) {
      if (rule.required) fail('E_INPUT', 'inputs', `缺少必填输入：${key}`);
      continue;
    }
    validateInput(key, rule, value);
    result[key] = value;
  }
  return result;
}
