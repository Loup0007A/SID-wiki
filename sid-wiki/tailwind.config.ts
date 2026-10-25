import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

// Thème « Codex » (Lot 50). Les noms de tokens historiques sont conservés :
//   ink / olive-* = textes clairs (os → lichen)   kraft = vert-de-gris
//   brass = laiton   stamp = sanguine   night = texte foncé (sur laiton)
// Les couleurs de catégorie et des surfaces sont des variables CSS (globals.css).
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        kraft: {
          50: '#f1f8f5',
          100: '#ddeee8',
          200: '#bfe0d6',
          300: '#98ccbe',
          400: '#76bba9',
          500: '#5fb3a1',
        },
        olive: {
          600: '#a3b3a2',
          700: '#b5c0b2',
          800: '#dcd5c4',
          900: '#f2ebdc',
        },
        brass: {
          300: '#f0d48f',
          400: '#d6aa4c',
          500: '#c4923a',
          600: '#a8782a',
        },
        ink: '#ece4d2',
        night: '#1b140a',
        stamp: '#d8664d',
        felt: '#1b302b',
        sapin: '#0e1b18',
      },
      fontFamily: {
        typewriter: ['"Young Serif"', 'Georgia', 'serif'],
        body: ['"Schibsted Grotesk Variable"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [typography],
};

export default config;
