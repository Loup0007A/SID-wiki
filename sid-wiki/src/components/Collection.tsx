import Link from 'next/link';
import { CATEGORY_LABELS, pad, type Category, type EntrySummary } from '@/lib/wiki';
import Icon from './Icon';

const MAX_SLOTS = 120;

/**
 * La collection (accueil du Codex) : un tiroir par catégorie, une case par
 * fiche. Case pleine = fiche découverte (avec son image s'il y en a une),
 * case en pointillés = encore à découvrir.
 */
export default function Collection({ lists }: { lists: { category: Category; entries: EntrySummary[] }[] }) {
  return (
    <div className="border-b border-[color:var(--rule)]">
      {lists.map(({ category, entries }) => {
        const found = entries.filter((e) => e.discovered).length;
        const shown = entries.slice(0, MAX_SLOTS);
        const label = CATEGORY_LABELS[category].label;
        return (
          <section
            key={category}
            aria-label={`${label} : ${found} fiches découvertes sur ${entries.length}`}
            className={`cat-${category} grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 border-t border-[color:var(--rule)] py-4 md:grid-cols-[11rem_1fr_6.5rem] md:gap-x-6 md:py-5`}
          >
            <Link href={`/${category}`} className="group flex items-center gap-2.5 text-ink">
              <Icon name={category} size="1.5em" />
              <span className="font-typewriter text-[1.45rem] leading-none group-hover:text-[color:var(--cat)]">{label}</span>
            </Link>

            <ol className="col-span-2 row-start-2 flex flex-wrap gap-[5px] md:col-span-1 md:row-start-auto" aria-hidden>
              {shown.map((e, i) => {
                const href = `/${category}/${pad(e.number)}`;
                const tip = e.discovered && e.title ? `N° ${pad(e.number)} · ${e.title}` : `N° ${pad(e.number)} · à découvrir`;
                return (
                  <li key={e.number} className="slot" style={{ animationDelay: `${Math.min(i, 40) * 12}ms` }}>
                    <Link
                      href={href}
                      title={tip}
                      tabIndex={-1}
                      className={
                        e.discovered
                          ? 'slot-on block h-[25px] w-[25px] overflow-hidden rounded-[4px] sm:h-[30px] sm:w-[30px] md:h-8 md:w-8 md:rounded-[5px]'
                          : 'slot-off grid h-[25px] w-[25px] place-items-center rounded-[4px] text-[10px] font-semibold sm:h-[30px] sm:w-[30px] md:h-8 md:w-8 md:rounded-[5px] md:text-[11px]'
                      }
                      style={e.discovered && e.image_url ? { backgroundImage: `url(${e.image_url})` } : undefined}
                    >
                      {!e.discovered && '?'}
                    </Link>
                  </li>
                );
              })}
              {entries.length > MAX_SLOTS && (
                <li>
                  <Link href={`/${category}`} className="grid h-8 place-items-center px-2 text-xs font-semibold text-olive-700 hover:text-ink">
                    +{entries.length - MAX_SLOTS}
                  </Link>
                </li>
              )}
            </ol>

            <p className="text-right leading-none">
              <span className="catno text-[2rem] md:text-[2.4rem]">{found}</span>
              <span className="block pt-1 text-xs text-olive-700">sur {entries.length}</span>
            </p>
          </section>
        );
      })}
    </div>
  );
}
