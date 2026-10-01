import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import SearchShortcut from '@/components/SearchShortcut';

export const metadata: Metadata = {
  title: 'Wiki du S.I.D.',
  description: 'Le wiki de la S.I.D. : lieux, armes, monstres et trésors à découvrir !',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        <Header />
        <SearchShortcut />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
