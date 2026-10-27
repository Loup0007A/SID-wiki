import Link from 'next/link';
import { CATEGORY_LABELS, type Category, type EntrySummary } from '@/lib/wiki';
import Icon from './Icon';
import MedalBadge from './MedalBadge';
import { medalFor } from '@/lib/paliers';

const MAX_SEGMENTS = 60;

/**
 * La collection (accueil du Codex) : une carte par catégorie, facile à
 * toucher. La réglette montre une encoche par fiche : pleine = découverte,
 * creuse = encore à découvrir.
 */
export default function Collection({ lists }: { lists: { category: Category; entries: EntrySummary[] }[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      {lists.map(({ category, entries }) => {
        const found = entries.filter((e) => e.discovered).length;
        const total = entries.length;
        const left = total - found;
        const label = CATEGORY_LABELS[category].label;
        const segmented = total > 0 && total <= MAX_SEGMENTS;
        const pal = medalFor(found, total);
        return (
          <li key={category} className={`cat-${category}`}>
            <Link
              href={`/${category}`}
              className="cat-card group flex h-full flex-col rounded-xl p-3.5 sm:p-5"
              aria-label={`${label} : ${found} fiches découvertes sur ${total}`}
            >
              <span className="flex items-start justify-between gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-cat-soft sm:h-12 sm:w-12">
                  <Icon name={category} size="1.6em" />
                </span>
                <span className="text-right leading-none">
                  <span className="catno text-[1.7rem] sm:text-[2.1rem]">{found}</span>
                  <span className="text-sm text-olive-700"> / {total}</span>
                </span>
              </span>

              <span className="mt-3 flex items-center gap-2">
                <span className="font-typewriter text-[1.3rem] leading-tight text-ink sm:text-[1.5rem]">{label}</span>
                <MedalBadge medal={pal.medal} size={20} />
              </span>

              {segmented ? (
                <span className="mt-3 flex gap-[3px]" aria-hidden>
                  {entries.map((e) => (
                    <span
                      key={e.number}
                      className={`h-2.5 flex-1 rounded-[2px] sm:h-3 ${e.discovered ? 'bg-[color:var(--cat)]' : 'bg-[color:var(--rule)]'}`}
                    />
                  ))}
                </span>
              ) : (
                <span className="mt-3 block h-2.5 rounded-full bg-[color:var(--rule)] sm:h-3" aria-hidden>
                  <span className="block h-full rounded-full bg-[color:var(--cat)]" style={{ width: `${total ? (found / total) * 100 : 0}%` }} />
                </span>
              )}

              <span className="mt-2.5 flex items-center justify-between gap-2 text-[13px] text-olive-700 sm:text-sm">
                <span>
                  {left > 0 ? `${left} à découvrir` : total > 0 ? 'Tout est découvert' : 'Aucune fiche'}
                  {pal.next && total > 0 && (
                    <span className="hidden sm:inline">
                      {' '}
                      · {pal.next.label} dans {pal.missing} fiche{pal.missing > 1 ? 's' : ''}
                    </span>
                  )}
                </span>
                <span aria-hidden className="text-[color:var(--cat)] transition group-hover:translate-x-0.5">→</span>
              </span>
            </Link>
          </li>
        );
      })}
      <li>
        <Link href="/profils" className="cat-card group flex h-full flex-col rounded-xl p-3.5 sm:p-5" style={{ ['--cat' as string]: 'var(--brass)' }}>
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-brass-400/15 text-brass-400 sm:h-12 sm:w-12">
            <Icon name="profils" size="1.6em" />
          </span>
          <span className="mt-3 font-typewriter text-[1.3rem] leading-tight text-ink sm:text-[1.5rem]">Profils</span>
          <span className="mt-1.5 text-[13px] leading-snug text-olive-700 sm:text-sm">Le porte-armure de chaque chasseur</span>
          <span className="mt-auto flex justify-end pt-2 text-brass-400" aria-hidden>
            →
          </span>
        </Link>
      </li>
    </ul>
  );
}
