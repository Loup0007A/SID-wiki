const fs = require('fs');
const path = require('path');

// Icônes présentes dans public/icons (lues au moment du build) : le composant
// Icon n'essaie de charger que celles qui existent (sinon l'emoji, sans
// requête perdue en 404 à chaque page).
const ICONS = fs
  .readdirSync(path.join(__dirname, 'public/icons'))
  .filter((f) => f.endsWith('.png'))
  .map((f) => f.slice(0, -4))
  .join(',');

// En-têtes de sécurité : en-tetes-securite.js (identique sur les trois sites).
const { SECURITY_HEADERS } = require('./en-tetes-securite');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: { NEXT_PUBLIC_WIKI_ICONS: ICONS },
  // Icônes et images du dossier public : gardées un jour par le navigateur
  // (au lieu d'être revérifiées à chaque page).
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      { source: '/icons/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
    ];
  },
  // Aucune page n'utilise next/image : l'optimiseur d'images de Next est coupé
  // (/_next/image répond 404), ce qui écarte ses failles connues.
  images: { unoptimized: true },
  // @gltf-transform embarque un lecteur Node (fs/path) inutile dans le navigateur
  webpack: (config, { isServer, webpack }) => {
    // Lot 77 : le JSX passe par src/brand (tsconfig jsxImportSource). Le cache
    // de compilation gardé d'un build à l'autre (Vercel compris) ne doit pas
    // resservir les modules compilés avant ce changement.
    if (config.cache && typeof config.cache === 'object') {
      config.cache.version = `${config.cache.version || ''}|jsx-brand-1`;
    }
    if (!isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (res) => {
          res.request = res.request.replace(/^node:/, '');
        })
      );
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
    }
    return config;
  },
};

module.exports = nextConfig;
