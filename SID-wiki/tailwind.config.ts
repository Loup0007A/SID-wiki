import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

// Les noms de tokens (kraft / olive / brass / stamp / ink) sont conservés,
// mais la palette est maintenant bleu ciel :
//   kraft = bleus très clairs (fonds, verre)   olive = bleus profonds (texte, boutons)
//   brass = jaune soleil (accents)             stamp = corail (alertes, « ? »)
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        kraft: {
          50: '#f4fbff',
          100: '#e3f4ff',
          200: '#c9e9fb',
          300: '#a5d8f5',
          400: '#7cc3ee',
          500: '#4fa8e0',
        },
        olive: {
          600: '#2f7fd1',
          700: '#2563b8',
          800: '#1c4a94',
          900: '#14336b',
        },
        brass: {
          300: '#ffe08a',
          400: '#ffcb45',
          500: '#f5a623',
          600: '#d98614',
        },
        ink: '#16305a',
        stamp: '#ef5b4c',
      },
      fontFamily: {
        typewriter: ['"Baloo 2"', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [typography],
};

export default config;
