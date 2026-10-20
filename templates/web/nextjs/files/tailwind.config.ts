import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f7f6f2',
        ink: '#25251f',
        accent: '#c34b23',
      },
    },
  },
  // Ant Design supplies the component reset; avoid applying two resets.
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}

export default config
