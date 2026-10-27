'use client';

import { useEffect, useState } from 'react';
import MedalBadge from './MedalBadge';
import { MEDALS } from '@/lib/paliers';

/**
 * Nouveau palier (Lot 60) : quand une catégorie gagne une médaille ou que le
 * Codex change de rang depuis la dernière visite (sur cet appareil), un
 * bandeau le célèbre une fois.
 */
type Levels = Record<string, number>;
const KEY = 'wiki-paliers-v1';

export default function PalierWatcher({ levels, labels, codex }: { levels: Levels; labels: Record<string, string>; codex: { level: number; label: string } }) {
  const [news, setNews] = useState<{ cat: string | null; level: number }[]>([]);

  useEffect(() => {
    let prev: Levels | null = null;
    try {
      prev = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    } catch {
      prev = null;
    }
    const now: Levels = { ...levels, __codex: codex.level };
    if (prev) {
      const up: { cat: string | null; level: number }[] = [];
      for (const [k, v] of Object.entries(levels)) if (v > (prev[k] ?? 0)) up.push({ cat: k, level: v });
      if (codex.level > (prev.__codex ?? 0)) up.push({ cat: null, level: codex.level });
      setNews(up);
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(now));
    } catch {
      /* stockage indisponible */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (news.length === 0) return null;
  return (
    <div className="palier-news panel mb-5 flex items-center gap-3 p-3 sm:p-4" role="status">
      <div className="flex -space-x-2">
        {news
          .filter((n) => n.cat)
          .slice(0, 3)
          .map((n) => (
            <span key={n.cat} className={`cat-${n.cat} palier-pop`}>
              <MedalBadge medal={MEDALS[n.level]} size={30} />
            </span>
          ))}
      </div>
      <p className="min-w-0 flex-1 text-[0.95rem]">
        <strong className="font-typewriter text-[1.1rem]">Nouveau palier !</strong>{' '}
        {news
          .map((n) => (n.cat ? `${labels[n.cat]} : médaille ${MEDALS[n.level].label.toLowerCase()}` : `le Codex devient « ${codex.label} »`))
          .join(' · ')}
        .
      </p>
      <button type="button" onClick={() => setNews([])} className="btn-ghost !px-2.5" aria-label="Fermer">
        ✕
      </button>
    </div>
  );
}
