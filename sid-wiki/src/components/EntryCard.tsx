import Link from 'next/link';
import { CATEGORY_LABELS, pad, type EntrySummary } from '@/lib/wiki';
import Rarity from './Rarity';
import Icon from './Icon';

/**
 * Planche d'une fiche (grilles du Codex) : le spécimen est monté sous
 * passe-partout, tenu par quatre coins de laiton, avec son étiquette de
 * papier épinglée dessous (numéro de catalogue, nom, rareté). Fiche non
 * découverte : monture vide et étiquette à remplir.
 */
export default function EntryCard({ entry, showCategory = false }: { entry: EntrySummary; showCategory?: boolean }) {
  const known = entry.title !== null;
  const hidden = !entry.discovered;
  const singular = CATEGORY_LABELS[entry.category].singular;

  return (
    <Link
      href={`/${entry.category}/${pad(entry.number)}`}
      className={`cat-${entry.category} plate group flex flex-col rounded-xl p-2.5 sm:p-3 ${hidden ? 'plate-off' : 'plate-on'}`}
      aria-label={known ? `${singular} n° ${pad(entry.number)} : ${entry.title}` : `${singular} n° ${pad(entry.number)}, à découvrir`}
    >
      <div className={`mount ${known ? '' : 'mount-empty'}`}>
        <span className="mount-corner tl" aria-hidden />
        <span className="mount-corner tr" aria-hidden />
        <span className="mount-corner bl" aria-hidden />
        <span className="mount-corner br" aria-hidden />
        {known && entry.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.image_url} alt="" loading="lazy" className="mount-img" />
        ) : known ? (
          <span className="mount-icon">
            <Icon name={entry.category} size="2.6em" />
          </span>
        ) : (
          <span className="mount-unknown" aria-hidden>
            ?
          </span>
        )}
        {known && entry.has_model && (
          <span className="mount-badge" title="Modèle 3D animé">
            3D
          </span>
        )}
      </div>

      <div className={`specimen-label ${known ? '' : 'specimen-label-blank'}`}>
        <span className="specimen-pin" aria-hidden />
        <span className="flex items-center justify-between gap-2">
          <span className="specimen-no">
            {showCategory && <>{singular} </>}n° {pad(entry.number)}
          </span>
          {known && <Rarity value={entry.rarity} className="specimen-rarity text-[11px]" />}
        </span>
        {known ? <span className="specimen-name">{entry.title}</span> : <span className="specimen-blank" aria-hidden />}
      </div>

      {known && entry.summary && <p className="mt-2.5 line-clamp-2 px-0.5 text-sm leading-snug text-olive-700">{entry.summary}</p>}
      {known && entry.tags && entry.tags.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-x-2 gap-y-0.5 px-0.5 pt-2">
          {entry.tags.slice(0, 4).map((t) => (
            <span key={t} className="text-[11px] text-olive-600">
              #{t}
            </span>
          ))}
        </div>
      )}
      {!known && <p className="mt-2.5 px-0.5 text-sm text-olive-600">Personne ne l&apos;a encore croisé.</p>}
    </Link>
  );
}
