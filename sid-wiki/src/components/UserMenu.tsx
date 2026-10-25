'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Icon from './Icon';
import { SidIcon } from "@/components/icons/SidIcon";

/** Menu unique (ordinateur) : profils, hasard, tags, aide, admin, déconnexion. */
export default function UserMenu({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const item = 'flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-semibold text-olive-800 hover:bg-[color:var(--felt-2)] hover:text-ink';

  return (
    <div ref={ref} className="relative">
      <button type="button" className="btn-ghost !min-h-[2.5rem] !px-3" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" aria-label="Menu">
        <Icon name="menu" />
      </button>
      {open && (
        <div role="menu" onClick={() => setOpen(false)} className="absolute right-0 top-full z-50 mt-2 flex w-56 flex-col rounded-xl border border-[color:var(--rule-2)] bg-[#172925] p-1.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.85)]">
          <Link href="/profils" className={item} role="menuitem">
            <Icon name="profils" /> Profils
          </Link>
          <Link href="/hasard" className={item} role="menuitem">
            <Icon name="hasard" /> Fiche au hasard
          </Link>
          <Link href="/tags" className={item} role="menuitem">
            <Icon name="tags" /> Tags
          </Link>
          <Link href="/aide" className={item} role="menuitem">
            <Icon name="aide" /> Aide
          </Link>
          <Link href="/confidentialite" className={item} role="menuitem">
            <SidIcon name="padlock" /> Confidentialité
          </Link>
          {isAdmin && (
            <Link href="/admin" className={`${item} text-brass-300`} role="menuitem">
              <Icon name="admin" /> Dashboard admin
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            className={`${item} mt-1 rounded-t-none border-t border-[color:var(--rule)] pt-3`}
            onClick={async () => {
              await createClient().auth.signOut();
              router.replace('/login');
              router.refresh();
            }}
          >
            <SidIcon name="power" /> Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
