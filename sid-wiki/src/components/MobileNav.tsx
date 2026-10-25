'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/wiki';
import Icon, { type IconName } from './Icon';

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

  const tabs: { href: string; icon: IconName; label: string; active: boolean }[] = [
    { href: '/', icon: 'accueil', label: 'Accueil', active: pathname === '/' },
    { href: '/recherche', icon: 'chercher', label: 'Chercher', active: pathname.startsWith('/recherche') },
    { href: '/favoris', icon: 'favoris', label: 'Favoris', active: pathname.startsWith('/favoris') },
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
          <button className="absolute inset-0 bg-black/60" aria-label="Fermer le menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-[color:var(--rule-2)] bg-[#172925] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[color:var(--rule-2)]" />

            <form action="/recherche" className="mb-4">
              <input name="q" type="search" placeholder="Chercher une fiche, un numéro, un tag…" className="input" />
            </form>

            <h2 className="mb-2 font-typewriter text-lg text-olive-900">Les tiroirs</h2>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <Link
                  key={c}
                  href={`/${c}`}
                  className={`cat-${c} flex items-center gap-2.5 rounded-lg border border-l-4 px-3 py-3 font-semibold ${
                    pathname === `/${c}` || pathname.startsWith(`/${c}/`) ? 'border-[color:var(--cat)] bg-[color:var(--felt-2)] text-ink' : 'border-[color:var(--rule)] border-l-[color:var(--cat)] bg-[color:var(--felt)] text-olive-800'
                  }`}
                >
                  <Icon name={c} className="text-xl" />
                  {CATEGORY_LABELS[c].label}
                </Link>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs font-bold">
              {([
                ['/profils', 'profils', 'Profils'],
                ['/hasard', 'hasard', 'Hasard'],
                ['/tags', 'tags', 'Tags'],
                ['/aide', 'aide', 'Aide'],
                ['/confidentialite', 'aide', 'Données'],
              ] as const).map(([href, icon, label]) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-3 ${
                    pathname === href || pathname.startsWith(`${href}/`) ? 'border-brass-400 bg-[color:var(--felt-2)] text-ink' : 'border-[color:var(--rule)] bg-[color:var(--felt)] text-olive-800'
                  }`}
                >
                  <Icon name={icon} className="text-xl" />
                  {label}
                </Link>
              ))}
            </div>

            {isAdmin && (
              <Link href="/admin" className="btn mt-3 w-full !min-h-[3rem]">
                <Icon name="admin" /> Dashboard admin
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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--rule)] bg-[#10201c]/95 pb-[env(safe-area-inset-bottom)]"
        aria-label="Navigation principale"
      >
        <ul className="grid grid-cols-4">
          {tabs.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`relative flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                  t.active ? 'text-brass-300' : 'text-olive-700'
                }`}
              >
                <Icon name={t.icon} className="text-xl leading-none" />
                {t.label}
                {t.active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-b bg-brass-400" />}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="flex min-h-[3.5rem] w-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-olive-700"
            >
              <Icon name="menu" className="text-xl leading-none" />
              Menu
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
