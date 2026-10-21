import charon from '@charonix/eslint-config'

export default charon({
  react: true,
  typescript: true,
  vue: false,
  // This template uses the native Node test runner.
  test: {
    overrides: { 'test/no-import-node-test': 'off' },
  },
  tailwindcss: {
    callees: ['cn', 'clsx', 'classNames'],
  },
  ignores: ['src/.umi*/**', '.umi*/**', 'dist/**', 'public/runtime-config.js', '**/*.md'],
})
