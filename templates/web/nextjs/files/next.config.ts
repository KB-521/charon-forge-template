import type { NextConfig } from 'next'
import { relative, resolve } from 'node:path'
import process from 'node:process'

export type AppEnv = 'local' | 'test' | 'production'

/** APP_ENV 表示部署环境；ci/prod 兼容原工程及常见 CI 写法。 */
export function resolveAppEnv(value = process.env.APP_ENV): AppEnv {
  const selected = value?.trim().toLowerCase()
    || (process.env.NODE_ENV === 'development' ? 'local' : 'production')
  if (selected === 'ci')
    return 'test'
  if (selected === 'prod')
    return 'production'
  if (selected === 'local' || selected === 'test' || selected === 'production')
    return selected
  throw new Error('APP_ENV must be local, test or production (aliases: ci, prod)')
}

function splitList(value?: string): string[] {
  return value?.split(',').map(item => item.trim()).filter(Boolean) ?? []
}

function parseHttpURL(value: string, name: string): URL {
  try {
    const url = new URL(value)
    if ((url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password)
      return url
  }
  catch {
    // Report the configuration name without logging its value.
  }
  throw new Error(`${name} must be an http(s) URL without credentials`)
}

/** 保留按环境分支的构建能力，原产品域名与云存储上传由项目自行接入。 */
export function createNextConfig(appEnv: AppEnv = resolveAppEnv()): NextConfig {
  const prefixes: Record<AppEnv, string> = {
    local: 'LOCAL',
    test: 'TEST',
    production: 'PRODUCTION',
  }
  const prefix = prefixes[appEnv]
  const apiTarget = process.env[`${prefix}_API_PROXY_TARGET`]?.trim().replace(/\/+$/, '') ?? ''
  const assetPrefix = process.env[`${prefix}_ASSET_PREFIX`]?.trim().replace(/\/+$/, '') ?? ''
  if (apiTarget)
    parseHttpURL(apiTarget, `${prefix}_API_PROXY_TARGET`)
  if (assetPrefix && !assetPrefix.startsWith('/'))
    parseHttpURL(assetPrefix, `${prefix}_ASSET_PREFIX`)

  const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = splitList(
    process.env[`${prefix}_IMAGE_REMOTE_ORIGINS`],
  ).map((origin) => {
    const url = parseHttpURL(origin, `${prefix}_IMAGE_REMOTE_ORIGINS`)
    return {
      protocol: url.protocol === 'https:' ? 'https' : 'http',
      hostname: url.hostname,
      port: url.port,
      pathname: '/**',
    }
  })

  return {
    distDir: '.next',
    reactStrictMode: true,
    outputFileTracingIncludes: {
      '/runtime-config.js': ['./docker-config/.env.dev', './docker-config/.env.prod'],
    },
    env: {
      // Only this public marker is exposed; backend targets stay server-side.
      NEXT_PUBLIC_APP_ENV: appEnv,
    },
    assetPrefix,
    allowedDevOrigins: splitList(process.env[`${prefix}_ALLOWED_DEV_ORIGINS`]),
    experimental: {
      proxyTimeout: 300_000,
    },
    images: {
      unoptimized: appEnv === 'local',
      remotePatterns,
    },
    async rewrites() {
      return apiTarget
        ? [{ source: '/api/:path*', destination: `${apiTarget}/api/:path*` }]
        : []
    },
    compiler: appEnv === 'production'
      ? { removeConsole: { exclude: ['error', 'warn'] } }
      : undefined,
    logging: appEnv === 'local' ? { browserToTerminal: false } : undefined,
    webpack(config) {
      config.module.rules.push({
        test: /\.(mp4|mov|webm|ogg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/media/[name].[contenthash][ext]',
          publicPath: `${assetPrefix}/_next/`,
          // Server and client compilers both emit to the public .next/static tree.
          outputPath: relative(config.output.path, resolve(process.cwd(), '.next')).replaceAll('\\', '/'),
        },
      })
      return config
    },
  }
}

export default createNextConfig()
