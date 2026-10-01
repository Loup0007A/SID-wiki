import type { InfoRow } from '@/lib/wiki';
import Rarity from './Rarity';

/** Fiche technique à la Wikipédia (encadré à droite sur grand écran). */
export default function Infobox({ rows, rarity }: { rows: InfoRow[]; rarity?: number | null }) {
  if (rows.length === 0 && !rarity) return null;
  return (
    <aside className="mb-4 w-full overflow-hidden rounded-2xl border border-white/80 bg-white/50 backdrop-blur sm:float-right sm:clear-right sm:ml-5 sm:w-64">
      <div className="bg-gradient-to-r from-kraft-500 to-olive-600 px-3 py-1.5 text-center font-typewriter font-bold text-white">
        Fiche technique
      </div>
      <dl className="divide-y divide-white/70 text-sm">
        {rarity ? (
          <div className="flex items-center justify-between gap-3 px-3 py-1.5">
            <dt className="font-bold text-olive-800">Rareté</dt>
            <dd>
              <Rarity value={rarity} />
            </dd>
          </div>
        ) : null}
        {rows.map((r, i) => (
          <div key={i} className="flex justify-between gap-3 px-3 py-1.5">
            <dt className="font-bold text-olive-800">{r.label}</dt>
            <dd className="text-right">{r.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
