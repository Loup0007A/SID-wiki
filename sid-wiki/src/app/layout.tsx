import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import SearchShortcut from '@/components/SearchShortcut';

export const metadata: Metadata = {
  title: 'Wiki du S.I.D.',
  description: 'Le wiki de la S.I.D. : lieux, armes, monstres et trésors à découvrir !',
  applicationName: 'Wiki du S.I.D.',
  appleWebApp: { capable: true, title: 'Wiki S.I.D.', statusBarStyle: 'default' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#bfe3fb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        <Header />
        <SearchShortcut />
        <main className="mx-auto max-w-6xl overflow-x-hidden px-4 py-5 pb-28 md:overflow-x-visible md:py-6 md:pb-6">{children}</main>
      </body>
    </html>
  );
}
