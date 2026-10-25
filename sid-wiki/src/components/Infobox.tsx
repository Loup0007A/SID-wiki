import type { InfoRow } from '@/lib/wiki';
import Rarity from './Rarity';

/** Fiche signalétique d'une entrée (colonne de gauche du Codex). */
export default function Infobox({ rows, rarity }: { rows: InfoRow[]; rarity?: number | null }) {
  if (rows.length === 0 && !rarity) return null;
  return (
    <section aria-label="Fiche signalétique" className="w-full">
      <h2 className="mb-1.5 font-typewriter text-base text-olive-800">Fiche signalétique</h2>
      <dl className="border-t border-[color:var(--rule)] text-sm">
        {rarity ? (
          <div className="flex items-center justify-between gap-3 border-b border-[color:var(--rule)] py-2">
            <dt className="text-olive-700">Rareté</dt>
            <dd>
              <Rarity value={rarity} />
            </dd>
          </div>
        ) : null}
        {rows.map((r, i) => (
          <div key={i} className="flex justify-between gap-3 border-b border-[color:var(--rule)] py-2">
            <dt className="text-olive-700">{r.label}</dt>
            <dd className="text-right font-medium text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
