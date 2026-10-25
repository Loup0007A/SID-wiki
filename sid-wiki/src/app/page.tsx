import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES, CATEGORY_LABELS, pad, type EntrySummary, type RecentEntry } from '@/lib/wiki';
import Collection from '@/components/Collection';
import AccessDenied from '@/components/AccessDenied';
import Mention from '@/components/Mention';
import Icon from '@/components/Icon';
import WelcomeTip from '@/components/WelcomeTip';
import NewSince from '@/components/NewSince';
import RecentlyViewed from '@/components/RecentlyViewed';
import ProieDuJour, { preyOfTheDay, type Prey } from '@/components/ProieDuJour';
import { SidIcon } from '@/components/icons/SidIcon';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createClient();
  const [{ data, error }, { data: recentData }, { data: topData }, { data: announcement }, { data: decor }, ...lists] = await Promise.all([
    supabase.rpc('wiki_stats'),
    supabase.rpc('wiki_recent', { p_limit: 8 }),
    supabase.rpc('wiki_top_discoverers', { p_limit: 5 }),
    supabase.rpc('wiki_announcement_get'),
    supabase.rpc('site_decor'),
    ...CATEGORIES.map((c) => supabase.rpc('wiki_list', { p_category: c })),
  ]);
  if (error) return <AccessDenied />;

  const byCat = CATEGORIES.map((c, i) => ({ category: c, entries: ((lists[i]?.data ?? []) as EntrySummary[]).sort((a, b) => a.number - b.number) }));

  // Grande Chasse (réglée sur le Dossier Central) : une proie du jour parmi les mobs découverts.
  const hunt = !!(decor as { grande_chasse?: boolean } | null)?.grande_chasse;
  const prey: Prey | null = hunt ? preyOfTheDay((byCat.find((l) => l.category === 'mobs')?.entries ?? []).filter((m) => m.discovered && m.title) as unknown as Prey[]) : null;

  let total = 0;
  let found = 0;
  for (const r of (data ?? []) as { category: string; total: number; discovered_count: number }[]) {
    total += r.total;
    found += r.discovered_count;
  }
  const recent = (recentData ?? []) as RecentEntry[];
  const top = (topData ?? []) as { nickname: string; total: number }[];

  return (
    <div>
      {typeof announcement === 'string' && announcement.trim() && (
        <div className="mb-5 flex gap-3 rounded-lg border border-brass-400/50 bg-brass-400/10 px-4 py-3 text-brass-300">
          <SidIcon name="megaphone" size="1.4em" />
          <p className="whitespace-pre-line font-semibold">{announcement}</p>
        </div>
      )}
      {hunt && <ProieDuJour prey={prey} />}
      <WelcomeTip />
      <NewSince dates={recent.map((r) => r.discovered_at)} />

      <header className="mb-2 mt-2 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div>
          <h1 className="font-typewriter text-[2.4rem] leading-[1.05] text-olive-900 sm:text-[3rem]">La collection</h1>
          <p className="mt-2 max-w-[56ch] text-[1.02rem] leading-relaxed text-olive-700">
            Tout ce que le S.I.D. a croisé en chasse. Une case par fiche : les cases vides attendent leur découvreur.
          </p>
        </div>
        <p className="leading-none">
          <span className="font-typewriter text-[2.6rem] text-brass-300 [font-variant-numeric:oldstyle-nums]">{found}</span>
          <span className="font-typewriter text-2xl text-olive-600"> / {total}</span>
          <span className="block pt-1.5 text-sm text-olive-700">fiches découvertes</span>
        </p>
      </header>

      <Collection lists={byCat} />

      <RecentlyViewed />

      <div className="mt-10 grid gap-x-10 gap-y-10 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="registre">
          <h2 id="registre" className="section-title">Registre des découvertes</h2>
          <p className="mt-1 text-sm text-olive-700">Les dernières fiches ouvertes, et qui les a trouvées.</p>
          {recent.length === 0 ? (
            <p className="mt-4 italic text-olive-700">Rien de découvert pour l’instant. À vos armes !</p>
          ) : (
            <ol className="mt-4 border-t border-[color:var(--rule)]">
              {recent.map((r) => (
                <li key={`${r.category}${r.number}`} className={`cat-${r.category} border-b border-[color:var(--rule)]`}>
                  <Link href={`/${r.category}/${pad(r.number)}`} className="group grid grid-cols-[3.4rem_2.75rem_1fr] items-center gap-3 py-3 sm:grid-cols-[3.6rem_2.75rem_1fr_auto]">
                    <span className="catno text-[1.35rem] leading-none">{pad(r.number)}</span>
                    {r.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image_url} alt="" className="h-11 w-11 rounded-md object-cover ring-1 ring-[color:var(--cat)]/60" />
                    ) : (
                      <span className="grid h-11 w-11 place-items-center rounded-md bg-[color:var(--felt-2)]">
                        <Icon name={r.category} size="1.4em" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink group-hover:text-[color:var(--cat)]">{r.title}</span>
                      <span className="block text-xs text-olive-700">
                        {CATEGORY_LABELS[r.category].singular}
                        {r.discovered_at && <> · {new Date(r.discovered_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</>}
                      </span>
                    </span>
                    {r.discoverer && (
                      <span className="hidden sm:block">
                        <Mention nickname={r.discoverer} />
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside className="space-y-8">
          <section aria-labelledby="podium">
            <h2 id="podium" className="section-title">Meilleurs découvreurs</h2>
            {top.length === 0 ? (
              <p className="mt-3 italic text-olive-700">Personne n’a encore été crédité.</p>
            ) : (
              <ol className="mt-3 space-y-1">
                {top.map((t, i) => (
                  <li key={t.nickname} className="flex items-center gap-3 rounded-md px-1 py-1.5">
                    <span className="w-7 text-center">
                      {i < 3 ? <SidIcon name={(['podium1', 'podium2', 'podium3'] as const)[i]} size="1.5em" /> : <span className="font-typewriter text-olive-600">{i + 1}</span>}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      <Mention nickname={t.nickname} />
                    </span>
                    <span className="font-typewriter text-lg text-brass-300 [font-variant-numeric:oldstyle-nums]">{t.total}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <Link href="/profils" className="card group block p-5 transition hover:border-brass-400/70">
            <span className="flex items-center gap-2.5">
              <Icon name="profils" size="1.6em" className="text-brass-400" />
              <span className="font-typewriter text-xl text-olive-900">Le vestiaire</span>
            </span>
            <span className="mt-2 block text-sm leading-relaxed text-olive-700">
              Chaque chasseur a son porte-armure : équipe-le avec les armes et objets que tu as découverts.
            </span>
            <span className="mt-3 inline-block text-sm font-semibold text-brass-300 group-hover:underline">Voir les profils</span>
          </Link>
        </aside>
      </div>
    </div>
  );
}
