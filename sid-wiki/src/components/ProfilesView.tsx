'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { GEAR_SLOTS, type ProfileSummary } from '@/lib/wiki';
import StandFigure from './StandFigure';
import { SidIcon } from '@/components/icons/SidIcon';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Tous les profils : filtre instantané par pseudo, mini porte-armure sur chaque carte. */
export default function ProfilesView({ profiles, standImage = null }: { profiles: ProfileSummary[]; standImage?: string | null }) {
  const [q, setQ] = useState('');
  const [onlyGeared, setOnlyGeared] = useState(false);

  const shown = useMemo(() => {
    const f = norm(q.trim());
    return profiles.filter((p) => (!f || norm(p.nickname).includes(f)) && (!onlyGeared || p.gear.length > 0));
  }, [profiles, q, onlyGeared]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input type="search" className="input max-w-xs" placeholder="Chercher un chasseur…" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-olive-800">
          <input type="checkbox" className="h-4 w-4" checked={onlyGeared} onChange={(e) => setOnlyGeared(e.target.checked)} />
          Équipés seulement
        </label>
        <span className="text-sm text-olive-700">
          {shown.length} profil{shown.length > 1 ? 's' : ''}
        </span>
      </div>

      {shown.length === 0 ? (
        <p className="italic text-olive-700">Aucun chasseur ne correspond.</p>
      ) : (
        <div className="stagger grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {shown.map((p) => (
            <Link
              key={p.id}
              href={`/profils/${p.id}`}
              className={`card flex flex-col items-center p-3 text-center transition hover:-translate-y-0.5 hover:border-brass-500 ${p.is_me ? 'border-brass-400/60' : ''}`}
            >
              <StandFigure gear={p.gear} standImage={standImage} className="h-32 w-auto" />
              <h2 className="mt-2 max-w-full truncate font-typewriter text-lg font-bold">@{p.nickname}</h2>
              {p.is_me && <span className="stamp mt-1 !rotate-0">C’est toi !</span>}
              <p className="mt-1 text-xs text-olive-700">
                {p.gear.length}/{GEAR_SLOTS.length} équipé{p.gear.length > 1 ? 's' : ''}
                {p.discoveries > 0 && <> · <SidIcon name="trophy" /> {p.discoveries}</>}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
