import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        kraft: {
          50: '#f7f0e2',
          100: '#eee0c4',
          200: '#e0cba0',
          300: '#cdb27c',
          400: '#b89659',
          500: '#9a7a43',
        },
        olive: {
          600: '#4d5a22',
          700: '#3f4a1c',
          800: '#2f3815',
          900: '#1f260e',
        },
        brass: {
          300: '#e3c67c',
          400: '#cfa64c',
          500: '#b08d3c',
          600: '#8f6f2b',
        },
        ink: '#2b2419',
        stamp: '#a3241f',
      },
      fontFamily: {
        typewriter: ['"Courier New"', 'Courier', 'monospace'],
        body: ['Georgia', '"Times New Roman"', 'serif'],
      },
    },
  },
  plugins: [typography],
};

export default config;
