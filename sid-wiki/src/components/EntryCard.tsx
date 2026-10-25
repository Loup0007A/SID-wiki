import Link from 'next/link';
import { CATEGORY_LABELS, pad, type EntrySummary } from '@/lib/wiki';
import Rarity from './Rarity';
import Icon from './Icon';

/**
 * Planche d'une fiche (grilles du Codex) : numéro de catalogue en tête,
 * image sous passe-partout, nom, résumé, tags. Fiche non découverte :
 * planche en pointillés avec son numéro et un « ? ».
 */
export default function EntryCard({ entry, showCategory = false }: { entry: EntrySummary; showCategory?: boolean }) {
  const known = entry.title !== null;
  const hidden = !entry.discovered;

  return (
    <Link
      href={`/${entry.category}/${pad(entry.number)}`}
      className={`cat-${entry.category} plate group flex flex-col rounded-xl p-3 transition sm:p-3.5 ${hidden ? 'plate-off' : 'plate-on'}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="catno text-[1.55rem] leading-none sm:text-[1.75rem]">
          {pad(entry.number)}
        </span>
        <span className="flex items-center gap-1.5">
          {showCategory && (
            <span className="text-xs text-olive-700">
              <Icon name={entry.category} /> {CATEGORY_LABELS[entry.category].singular}
            </span>
          )}
          {known && <Rarity value={entry.rarity} className="text-xs" />}
        </span>
      </div>

      {known ? (
        <>
          {entry.image_url ? (
            <div className="mt-2.5 rounded-md bg-[#0f1d1a] p-1.5 ring-1 ring-inset ring-[color:var(--rule)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={entry.image_url} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-[3px] object-cover" />
            </div>
          ) : (
            <div className="mt-2.5 grid aspect-[4/3] place-items-center rounded-md bg-[#0f1d1a] ring-1 ring-inset ring-[color:var(--rule)]">
              <Icon name={entry.category} size="2.6em" className="opacity-70" />
            </div>
          )}
          <h3 className="mt-3 font-semibold leading-snug text-ink group-hover:text-[color:var(--cat)]">
            {entry.title}
            {entry.has_model && (
              <span className="ml-1.5 inline-block rounded border border-[color:var(--cat)]/50 px-1 align-[0.15em] text-[10px] font-semibold text-[color:var(--cat)]" title="Modèle 3D animé">
                3D
              </span>
            )}
          </h3>
          {entry.summary && <p className="mt-1 line-clamp-2 text-sm leading-snug text-olive-700">{entry.summary}</p>}
          {entry.tags && entry.tags.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1 pt-2.5">
              {entry.tags.slice(0, 4).map((t) => (
                <span key={t} className="text-[11px] text-olive-600">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="grid flex-1 place-items-center py-6">
          <span className="font-typewriter text-6xl text-[color:var(--cat)] opacity-30">?</span>
          <span className="mt-1 text-xs text-olive-600">À découvrir</span>
        </div>
      )}
    </Link>
  );
}
