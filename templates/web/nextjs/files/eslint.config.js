import charon from '@charonix/eslint-config'

export default charon({
  react: true,
  typescript: true,
  vue: false,
  tailwindcss: {
    callees: ['cn', 'clsx', 'classNames'],
  },
  ignores: ['.next/**', 'out/**', 'dist/**', 'next-env.d.ts', '**/*.md'],
})
