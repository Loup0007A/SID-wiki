'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Flèches ← → du clavier (Lot 59) : fiche précédente / suivante, comme on
 * tourne les pages d'un carnet. Rien ne se passe pendant la saisie d'un texte.
 */
export default function EntryKeys({ prev, next }: { prev: string | null; next: string | null }) {
  const router = useRouter();
  useEffect(() => {
    if (prev) router.prefetch(prev);
    if (next) router.prefetch(next);
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (document.querySelector('[role="dialog"], dialog[open]')) return;
      const to = e.key === 'ArrowLeft' ? prev : e.key === 'ArrowRight' ? next : null;
      if (!to) return;
      e.preventDefault();
      router.push(to);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, router]);
  return null;
}
