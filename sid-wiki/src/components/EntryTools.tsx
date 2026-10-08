'use client';

import { useEffect, useState } from 'react';

const SIZES = [0.9, 1, 1.125, 1.25, 1.4];
const KEY = 'wiki-text-size';

function apply(i: number) {
  document.documentElement.style.setProperty('--fs', String(SIZES[i]));
}

/** Partager (lien copié / menu de partage du téléphone), imprimer, taille du texte. */
export default function EntryTools({ title }: { title: string }) {
  const [size, setSize] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const v = parseInt(localStorage.getItem(KEY) ?? '1', 10);
      if (v >= 0 && v < SIZES.length) {
        setSize(v);
        apply(v);
      }
    } catch {}
    return () => {
      document.documentElement.style.removeProperty('--fs');
    };
  }, []);

  function change(delta: number) {
    const next = Math.min(SIZES.length - 1, Math.max(0, size + delta));
    setSize(next);
    apply(next);
    try {
      localStorage.setItem(KEY, String(next));
    } catch {}
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${title} — Wiki du S.I.D.`, url });
        return;
      }
    } catch {
      return; // partage annulé
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copie ce lien :', url);
    }
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <button type="button" className="btn-ghost" onClick={share}>
        {copied ? '✅ Lien copié' : '🔗 Partager'}
      </button>
      <button type="button" className="btn-ghost hidden sm:inline-flex" onClick={() => window.print()}>
        🖨 Imprimer
      </button>
      <span className="inline-flex items-center overflow-hidden rounded-full border border-white/20" role="group" aria-label="Taille du texte">
        <button type="button" className="px-3 py-1.5 text-sm font-bold hover:bg-white/10 disabled:opacity-30" onClick={() => change(-1)} disabled={size === 0} aria-label="Réduire le texte">
          A−
        </button>
        <button type="button" className="px-3 py-1.5 text-base font-bold hover:bg-white/10 disabled:opacity-30" onClick={() => change(1)} disabled={size === SIZES.length - 1} aria-label="Agrandir le texte">
          A+
        </button>
      </span>
    </div>
  );
}
