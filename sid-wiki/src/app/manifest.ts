import type { MetadataRoute } from 'next';
import { brandify } from '@/lib/brand';
import { getBrand } from '@/lib/brand-server';

// Noms tirés de app_config (Lot 77) : relus à chaque demande (gardés 5 minutes côté serveur).
export const dynamic = 'force-dynamic';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  await getBrand();
  return {
    name: brandify('Wiki du S.I.D.'),
    short_name: brandify('Wiki S.I.D.'),
    description: brandify('Lieux, armes, monstres, objets et skills de la S.I.D.'),
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#138A72',
    theme_color: '#0B2621',
    lang: 'fr',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
