import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        foreground: '#fafafa',
        primary: {
          DEFAULT: '#06b6d4',
          foreground: '#09090b',
        },
        terminal: {
          dark: '#030712',
          card: '#090d16',
          border: '#1f293d',
          neonCyan: '#06b6d4',
          neonEmerald: '#10b981',
          neonRose: '#f43f5e',
          neonAmber: '#f59e0b',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Cascadia Code',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
