'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/wiki';
import Icon from './Icon';

/** Onglets des catégories (ordinateur) : chaque tiroir a sa couleur, l'actif est souligné de cette couleur. */
export default function DesktopNav() {
  const pathname = usePathname();
  const tab = (active: boolean) =>
    `relative -mb-px flex items-center gap-2 border-b-2 px-3.5 pb-2.5 pt-1.5 text-[0.95rem] font-semibold transition ${
      active ? 'border-[color:var(--cat)] text-ink' : 'border-transparent text-olive-700 hover:border-[color:var(--rule-2)] hover:text-ink'
    }`;
  return (
    <nav className="hidden items-end gap-1 md:flex" aria-label="Catégories et profils">
      {CATEGORIES.map((c) => {
        const active = pathname === `/${c}` || pathname.startsWith(`/${c}/`);
        return (
          <Link key={c} href={`/${c}`} className={`cat-${c} ${tab(active)}`} aria-current={active ? 'page' : undefined}>
            <Icon name={c} />
            {CATEGORY_LABELS[c].label}
          </Link>
        );
      })}

      <span aria-hidden className="mx-2 mb-3 h-4 w-px bg-[color:var(--rule-2)]" />
      {(() => {
        const active = pathname === '/profils' || pathname.startsWith('/profils/');
        return (
          <Link href="/profils" className={tab(active)} style={{ ['--cat' as string]: 'var(--brass)' }} aria-current={active ? 'page' : undefined}>
            <Icon name="profils" className="text-brass-400" /> Profils
          </Link>
        );
      })()}
    </nav>
  );
}
