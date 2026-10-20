import type { RuntimeConfig } from '@/types/runtime-config'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { parseEnv } from 'node:util'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** 保留原 Docker 部署选择变量；未指定时跟随 APP_ENV。 */
function resolveProfile(): 'dev' | 'prod' {
  const profile = process.env.SPRING_PROFILES_ACTIVE?.trim().toLowerCase()
  if (profile === 'dev' || profile === 'prod')
    return profile
  if (profile)
    throw new Error('SPRING_PROFILES_ACTIVE must be dev or prod')
  const appEnv = process.env.APP_ENV?.trim().toLowerCase()
    || (process.env.NODE_ENV === 'development' ? 'local' : 'production')
  return ['local', 'test', 'ci'].includes(appEnv) ? 'dev' : 'prod'
}

/** 按请求读取公开配置，支持同一构建产物在运行时切换配置文件。 */
export async function GET() {
  const profile = resolveProfile()
  const source = await readFile(join(process.cwd(), 'docker-config', `.env.${profile}`), 'utf8')
  const config = parseEnv(source) as Record<string, string>
  if (config.ENV !== (profile === 'dev' ? 'DEV' : 'PROD'))
    throw new Error(`docker-config/.env.${profile}: ENV does not match the profile`)
  if (!config.BASE_URL?.trim())
    throw new Error(`docker-config/.env.${profile}: BASE_URL is required`)

  const publicConfig: RuntimeConfig = { ...config, ENV: config.ENV, BASE_URL: config.BASE_URL.trim() }
  const serialized = JSON.stringify(publicConfig)
    .replaceAll('<', '\\u003c')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029')
  const script = `Object.defineProperty(window, 'CONFIG', { value: Object.freeze(${serialized}), writable: false, configurable: false, enumerable: true });`
  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
