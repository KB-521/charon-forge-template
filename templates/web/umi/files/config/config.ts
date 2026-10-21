import process from 'node:process'
import { defineConfig } from '@umijs/max'
import settings from './defaultSettings'
import routes from './routes'

export default defineConfig({
  hash: true,
  routes,
  model: {},
  initialState: {},
  layout: { ...settings },
  access: {},
  antd: {},
  request: {},
  tailwindcss: {},
  npmClient: 'pnpm',
  mfsu: false,
  headScripts: [{ src: '/runtime-config.js' }],
  favicons: ['/logo.svg'],
  proxy: process.env.API_PROXY_TARGET
    ? {
        '/api': { target: process.env.API_PROXY_TARGET, changeOrigin: true },
      }
    : undefined,
})
