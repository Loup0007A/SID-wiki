import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES, CATEGORY_LABELS, pad, type EntrySummary, type RecentEntry } from '@/lib/wiki';
import Collection from '@/components/Collection';
import AccessDenied from '@/components/AccessDenied';
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

      {/* Sur téléphone, la recherche tout de suite sous la main. */}
      <form action="/recherche" role="search" className="mb-5 md:hidden">
        <input name="q" type="search" placeholder="Chercher une fiche, un numéro, un tag…" className="input !h-12 !text-[1.02rem]" aria-label="Chercher dans le wiki" />
      </form>

      <section aria-labelledby="collection">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
          <h1 id="collection" className="font-typewriter text-[2rem] leading-tight text-olive-900 sm:text-[2.6rem]">La collection</h1>
          <p className="text-[0.95rem] text-olive-700">
            <span className="font-typewriter text-[1.35rem] text-brass-300 [font-variant-numeric:oldstyle-nums]">{found}</span> fiches découvertes sur {total}
          </p>
        </div>
        <Collection lists={byCat} />
      </section>

      <RecentlyViewed />

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_20rem] lg:items-start">
        <section aria-labelledby="registre" className="panel p-4 sm:p-5">
          <h2 id="registre" className="section-title">Dernières découvertes</h2>
          {recent.length === 0 ? (
            <p className="mt-3 italic text-olive-700">Rien de découvert pour l’instant. À vos armes !</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {recent.map((r) => (
                <li key={`${r.category}${r.number}`} className={`cat-${r.category}`}>
                  <Link
                    href={`/${r.category}/${pad(r.number)}`}
                    className="group flex items-center gap-3 rounded-lg border border-[color:var(--rule)] bg-[color:var(--bg)] p-2 pr-3 transition hover:border-[color:var(--cat)]"
                  >
                    {r.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image_url} alt="" className="h-12 w-12 flex-none rounded-md object-cover" />
                    ) : (
                      <span className="bg-cat-soft grid h-12 w-12 flex-none place-items-center rounded-md">
                        <Icon name={r.category} size="1.5em" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink group-hover:text-[color:var(--cat)]">{r.title}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-olive-700">
                        <span className="inline-flex items-center gap-1 font-medium text-[color:var(--cat)]">
                          <Icon name={r.category} size="1em" /> {CATEGORY_LABELS[r.category].singular} {pad(r.number)}
                        </span>
                        {r.discovered_at && <span>{new Date(r.discovered_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>}
                        {r.discoverer && <span>par @{r.discoverer}</span>}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="podium" className="panel p-4 sm:p-5">
          <h2 id="podium" className="section-title">Meilleurs découvreurs</h2>
          {top.length === 0 ? (
            <p className="mt-3 italic text-olive-700">Personne n’a encore été crédité.</p>
          ) : (
            <ol className="mt-3 divide-y divide-[color:var(--rule)]">
              {top.map((t, i) => (
                <li key={t.nickname} className="flex items-center gap-3 py-2.5">
                  <span className="grid w-7 place-items-center">
                    {i < 3 ? <SidIcon name={(['podium1', 'podium2', 'podium3'] as const)[i]} size="1.6em" /> : <span className="font-typewriter text-lg text-olive-600">{i + 1}</span>}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">@{t.nickname}</span>
                  <span className="font-typewriter text-xl text-brass-300 [font-variant-numeric:oldstyle-nums]">{t.total}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
