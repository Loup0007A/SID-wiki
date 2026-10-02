'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/wiki';

/** Barre d'onglets en bas + menu coulissant, affichés uniquement sur téléphone (< md). */
export default function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Ferme le menu à chaque navigation
  useEffect(() => setOpen(false), [pathname]);

  // Bloque le scroll de la page derrière le menu + Échap pour fermer
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const tabs = [
    { href: '/', icon: '🏠', label: 'Accueil', active: pathname === '/' },
    { href: '/recherche', icon: '🔍', label: 'Chercher', active: pathname.startsWith('/recherche') },
    { href: '/favoris', icon: '⭐', label: 'Favoris', active: pathname.startsWith('/favoris') },
    { href: '/hasard', icon: '🎲', label: 'Hasard', active: false },
  ];

  async function signOut() {
    await createClient().auth.signOut();
    setOpen(false);
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="md:hidden">
      {/* Menu coulissant */}
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Fermer le menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border border-white/15 bg-[#0a1428]/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-olive-800/30" />

            <form action="/recherche" className="mb-4">
              <input name="q" type="search" placeholder="🔍 Rechercher un monstre, un skill…" className="input !rounded-full" />
            </form>

            <h2 className="mb-2 font-typewriter text-sm font-bold text-olive-700">Le wiki</h2>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <Link
                  key={c}
                  href={`/${c}`}
                  className={`flex items-center gap-2 rounded-2xl border border-white/15 px-3 py-3 font-typewriter font-bold ${
                    pathname === `/${c}` || pathname.startsWith(`/${c}/`) ? 'bg-brass-400 text-night' : 'bg-white/[0.1] text-olive-800'
                  }`}
                >
                  <span className="text-xl">{CATEGORY_LABELS[c].icon}</span>
                  {CATEGORY_LABELS[c].label}
                </Link>
              ))}
            </div>

            {isAdmin && (
              <Link href="/admin" className="btn mt-4 w-full !min-h-[3rem]">
                🛠 Dashboard admin
              </Link>
            )}

            <button className="btn-ghost mt-3 w-full !min-h-[3rem]" onClick={signOut}>
              Déconnexion
            </button>
          </div>
        </div>
      )}

      {/* Barre d'onglets */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-[#050912]/80 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        aria-label="Navigation principale"
      >
        <ul className="grid grid-cols-5">
          {tabs.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${
                  t.active ? 'text-olive-700' : 'text-olive-800/70'
                }`}
              >
                <span className={`text-xl leading-none ${t.active ? 'drop-shadow' : ''}`}>{t.icon}</span>
                {t.label}
                {t.active && <span className="mt-0.5 h-1 w-6 rounded-full bg-brass-500" />}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="flex min-h-[3.5rem] w-full flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-olive-800/70"
            >
              <span className="text-xl leading-none">☰</span>
              Menu
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
