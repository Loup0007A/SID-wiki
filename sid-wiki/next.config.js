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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: { NEXT_PUBLIC_WIKI_ICONS: ICONS },
  // Icônes et images du dossier public : gardées un jour par le navigateur
  // (au lieu d'être revérifiées à chaque page).
  async headers() {
    return [{ source: '/icons/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] }];
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
  // @gltf-transform embarque un lecteur Node (fs/path) inutile dans le navigateur
  webpack: (config, { isServer, webpack }) => {
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
