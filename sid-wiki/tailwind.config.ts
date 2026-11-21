import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

// Thème « Codex » (Lot 50). Les noms de tokens historiques sont conservés :
//   ink / olive-* = textes clairs (os → lichen)   kraft = vert-de-gris
//   brass = laiton   stamp = sanguine   night = texte foncé (sur laiton)
// Les couleurs de catégorie et des surfaces sont des variables CSS (globals.css).
const v = (n: string) => `rgb(var(--t-${n}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Refonte (Lot 91) : les textes clairs (ink, olive-*) et quelques
      // accents lisent des variables qui changent sur une fiche crème
      // (texte foncé) ou sur le fond vert (texte clair). Voir globals.css.
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
          600: v('o6'),
          700: v('o7'),
          800: v('o8'),
          900: v('o9'),
        },
        brass: {
          300: v('brass3'),
          400: '#e8b13a',
          500: '#c99526',
          600: '#a8782a',
        },
        ink: v('ink'),
        night: 'rgb(var(--encre) / <alpha-value>)',
        stamp: v('stamp'),
        felt: 'rgb(var(--encre) / <alpha-value>)',
        sapin: 'rgb(var(--encre) / <alpha-value>)',
        encre: 'rgb(var(--encre) / <alpha-value>)',
        creme: 'rgb(var(--creme) / <alpha-value>)',
        fond: 'rgb(var(--fond) / <alpha-value>)',
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
