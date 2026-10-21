import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

export function buildPublicConfig(env = process.env) {
  const MODE = env.APP_MODE || 'demo'
  const API_BASE_URL = env.API_BASE_URL || '/api'
  if (!['demo', 'api'].includes(MODE))
    throw new Error('APP_MODE must be demo or api')
  if (!(API_BASE_URL.startsWith('/') && !API_BASE_URL.startsWith('//'))) {
    const url = new URL(API_BASE_URL)
    if (
      !['http:', 'https:'].includes(url.protocol)
      || url.username
      || url.password
      || url.search
      || url.hash
    ) {
      throw new Error(
        'API_BASE_URL must be a public HTTP(S) base URL without credentials/query/fragment',
      )
    }
  }
  return { APP_NAME: env.APP_NAME || '__PROJECT_NAME__', MODE, API_BASE_URL }
}
export function serializePublicConfig(config) {
  return `window.CONFIG = ${JSON.stringify(config).replace(/</g, '\\u003c')};\n`
}
export async function writePublicConfig(
  env = process.env,
  target = resolve('public/runtime-config.js'),
) {
  const config = buildPublicConfig(env)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, serializePublicConfig(config))
  return config
}
if (
  process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await writePublicConfig()
  console.log(
    'Public runtime config generated (APP_NAME, MODE, API_BASE_URL only).',
  )
}
