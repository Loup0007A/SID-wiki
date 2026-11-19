'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BRAND } from '@/lib/brand';

type Pt = { x: number; y: number };
type Data = {
  world: number;
  zones: Pt[][];
  places: { id: string; name: string; x: number; y: number }[];
  sightings: { x: number; y: number; at: string; place: string | null }[];
  count: number;
  last_at: string | null;
};

/**
 * « Où l'observer » : les signalements faits depuis la Cartographie quand la
 * créature est passée en incursion, et les lieux liés à la fiche.
 */
export default function SightingsMap({ category, number }: { category: string; number: number }) {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    createClient()
      .rpc('wiki_entry_sightings', { p_category: category, p_number: number })
      .then(({ data: d, error }) => !error && d && setData(d as Data));
  }, [category, number]);

  const now = useMemo(() => Date.now(), []);
  if (!data || (data.count === 0 && data.places.length === 0)) return null;
  const w = data.world || 100;
  const pts = (p: Pt[]) => p.map((q) => `${q.x},${q.y}`).join(' ');
  const mapUrl = (id?: string) => `${BRAND.urls.map}/carte${id ? `?lieu=${id}` : ''}`;
  const last = data.last_at ? new Date(data.last_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : null;

  return (
    <section className="observe mt-10" aria-labelledby="observe-title">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 id="observe-title" className="font-typewriter text-2xl text-olive-900">
          {data.count > 0 ? 'Où l’observer' : 'Sur la carte'}
        </h2>
        <p className="text-sm text-olive-700">
          {data.count > 0
            ? `${data.count} signalement${data.count > 1 ? 's' : ''}${last ? ` · dernier le ${last}` : ''}`
            : 'Lieux liés à cette fiche'}
        </p>
      </div>
      <div className="observe-frame">
        <svg viewBox={`${-w * 0.02} ${-w * 0.02} ${w * 1.04} ${w * 1.04}`} role="img" aria-label="Carte des observations" className="block h-auto w-full">
          <defs>
            <radialGradient id="obs-dot">
              <stop offset="0" stopColor="var(--cat)" stopOpacity="0.95" />
              <stop offset="1" stopColor="var(--cat)" stopOpacity="0" />
            </radialGradient>
            <pattern id="obs-sea" width={w / 25} height={w / 25} patternUnits="userSpaceOnUse">
              <path d={`M0 ${w / 50} q${w / 100} -${w / 160} ${w / 50} 0 t${w / 50} 0`} fill="none" stroke="#2c5a52" strokeOpacity="0.35" strokeWidth={w / 900} />
            </pattern>
          </defs>
          <rect x={-w} y={-w} width={w * 3} height={w * 3} fill="#0d201d" />
          <rect x={0} y={0} width={w} height={w} fill="url(#obs-sea)" />
          {data.zones.map((z, i) => (
            <polygon key={i} points={pts(z)} fill="#1f3a34" stroke="#46685d" strokeWidth={w / 400} strokeLinejoin="round" />
          ))}
          {data.sightings.map((s, i) => {
            const age = (now - new Date(s.at).getTime()) / 86_400_000;
            const o = Math.max(0.35, 1 - age / 60);
            return (
              <g key={i} opacity={o}>
                <circle cx={s.x} cy={s.y} r={w / 28} fill="url(#obs-dot)" />
                <circle cx={s.x} cy={s.y} r={w / 220} fill="var(--bone)">
                  <title>{`${new Date(s.at).toLocaleDateString('fr-FR')}${s.place ? ` · près de ${s.place}` : ''}`}</title>
                </circle>
              </g>
            );
          })}
          {data.places.map((p) => (
            <a key={p.id} href={mapUrl(p.id)} target="_blank" rel="noopener noreferrer">
              <g transform={`translate(${p.x} ${p.y})`}>
                <path d={`M0 0 l-${w / 90} -${w / 45} a${w / 90} ${w / 90} 0 1 1 ${w / 45} 0 z`} fill="var(--brass)" stroke="#1b140a" strokeWidth={w / 700} />
                <text y={-w / 30} textAnchor="middle" fontSize={w / 34} fill="var(--bone)" stroke="#0d201d" strokeWidth={w / 300} paintOrder="stroke">
                  {p.name}
                </text>
              </g>
            </a>
          ))}
        </svg>
      </div>
      <p className="mt-2 text-xs text-olive-700">
        {data.count > 0 && 'Les points sont les signalements des chasseurs pendant ses incursions ; les plus récents brillent davantage. '}
        <a href={mapUrl()} target="_blank" rel="noopener noreferrer" className="wiki-link">
          Ouvrir la carte
        </a>
      </p>
    </section>
  );
}
