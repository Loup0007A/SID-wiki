'use client';

import { useEffect, useState } from 'react';
import { SidIcon } from '@/components/icons/SidIcon';

const LAST = 'wiki-last-visit';
const PREV = 'wiki-prev-visit';

/** « 3 nouvelles découvertes depuis ta dernière visite » (une visite = 30 min d'écart minimum). */
export default function NewSince({ dates }: { dates: (string | null)[] }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    try {
      const now = Date.now();
      const last = parseInt(localStorage.getItem(LAST) ?? '0', 10);
      let prev = parseInt(localStorage.getItem(PREV) ?? '0', 10);
      if (last && now - last > 30 * 60 * 1000) {
        prev = last;
        localStorage.setItem(PREV, String(prev));
      }
      localStorage.setItem(LAST, String(now));
      if (prev) setCount(dates.filter((d) => d && new Date(d).getTime() > prev).length);
    } catch {}
  }, [dates]);

  if (count === 0) return null;
  return (
    <p className="mb-5 rounded-lg border border-brass-400/40 bg-brass-400/10 px-4 py-2 text-sm font-semibold text-brass-300">
      <SidIcon name="sparkle" /> {count} nouvelle{count > 1 ? 's' : ''} découverte{count > 1 ? 's' : ''} depuis ta dernière visite !
    </p>
  );
}
