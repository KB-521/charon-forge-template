import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import vm from 'node:vm'
import {
  buildPublicConfig,
  serializePublicConfig,
  writePublicConfig,
} from '../scripts/runtime-config.mjs'

test('runtime configuration includes only the public allowlist', () => {
  const config = buildPublicConfig({
    APP_NAME: 'demo',
    APP_MODE: 'api',
    API_BASE_URL: '/api',
    DATABASE_PASSWORD: 'never-export',
    RANDOM_SECRET: 'never-export',
  })
  assert.deepEqual(config, {
    APP_NAME: 'demo',
    MODE: 'api',
    API_BASE_URL: '/api',
  })
  assert.ok(!serializePublicConfig(config).includes('never-export'))
})
test('runtime serialization safely round-trips script-like names', () => {
  const name = '</script><script>bad()</script>"\n'
  const config = buildPublicConfig({ APP_NAME: name })
  const context = { window: {} }
  const script = serializePublicConfig(config)
  vm.runInNewContext(script, context)
  assert.equal(
    (context.window as { CONFIG: { APP_NAME: string } }).CONFIG.APP_NAME,
    name,
  )
  assert.ok(!script.includes('</script>'))
})
test('runtime configuration rejects unsupported modes and dangerous API schemes', () => {
  assert.throws(() => buildPublicConfig({ APP_MODE: 'typo' }), /APP_MODE/)
  for (const API_BASE_URL of [
    'javascript:alert(1)',
    '//bad.example',
    'https://user:pass@example.com',
  ])
    assert.throws(() => buildPublicConfig({ API_BASE_URL }))
})
test('runtime writer creates valid external JavaScript without exposing private env', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'umi-runtime-'))
  try {
    const path = join(dir, 'runtime-config.js')
    await writePublicConfig(
      {
        APP_NAME: 'demo',
        API_BASE_URL: '/custom',
        PRIVATE_TOKEN: 'not-public',
      },
      path,
    )
    const code = await readFile(path, 'utf8')
    assert.ok(!code.includes('not-public'))
    const context = { window: {} }
    vm.runInNewContext(code, context)
    assert.equal(
      (context.window as { CONFIG: { API_BASE_URL: string } }).CONFIG
        .API_BASE_URL,
      '/custom',
    )
  }
  finally {
    await rm(dir, { recursive: true, force: true })
  }
})
