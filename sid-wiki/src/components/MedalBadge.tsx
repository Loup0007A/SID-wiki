import type { Medal } from '@/lib/paliers';

const COLORS: Record<Medal['key'], [string, string] | null> = {
  aucun: null,
  bronze: ['#e0a46b', '#9c5a2b'],
  argent: ['#eef2f5', '#8b98a3'],
  or: ['#ffe08a', '#b8862f'],
  complet: ['#fff1b3', '#c4902e']
};

/** Médaille d'une catégorie (palier de la collection, Lot 60). */
export default function MedalBadge({ medal, size = 26 }: { medal: Medal; size?: number }) {
  const c = COLORS[medal.key];
  if (!c) return null;
  const id = `md-${medal.key}`;
  return (
    <svg viewBox="0 0 32 40" width={size} height={size * 1.25} role="img" aria-label={`Médaille ${medal.label}`} className={`medal medal-${medal.key}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c[0]} />
          <stop offset="1" stopColor={c[1]} />
        </linearGradient>
      </defs>
      <path d="M9 0 H14 L18 12 H13 Z" fill="#b8432c" />
      <path d="M23 0 H18 L14 12 H19 Z" fill="#2f5bd8" />
      <circle cx="16" cy="25" r="12" fill={`url(#${id})`} stroke="#2e261d" strokeOpacity="0.5" strokeWidth="1" />
      <circle cx="16" cy="25" r="8.5" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="1" />
      {medal.key === 'complet' ? (
        <path d="M16 18.5 l1.9 4 4.3 .5 -3.2 3 .9 4.3 -3.9 -2.2 -3.9 2.2 .9 -4.3 -3.2 -3 4.3 -.5 Z" fill="#fff8d8" stroke="#8a6420" strokeWidth=".6" />
      ) : (
        <text x="16" y="29" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2e261d" fillOpacity="0.7">
          {medal.key === 'bronze' ? 'III' : medal.key === 'argent' ? 'II' : 'I'}
        </text>
      )}
    </svg>
  );
}
