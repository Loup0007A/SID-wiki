import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES, CATEGORY_LABELS, pad, type Category, type RecentEntry } from '@/lib/wiki';
import AccessDenied from '@/components/AccessDenied';
import Mention from '@/components/Mention';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createClient();
  const [{ data, error }, { data: recentData }, { data: topData }] = await Promise.all([
    supabase.rpc('wiki_stats'),
    supabase.rpc('wiki_recent', { p_limit: 6 }),
    supabase.rpc('wiki_top_discoverers', { p_limit: 5 }),
  ]);
  if (error) return <AccessDenied />;

  const stats = new Map<string, { total: number; found: number }>();
  for (const r of (data ?? []) as { category: string; total: number; discovered_count: number }[]) {
    stats.set(r.category, { total: r.total, found: r.discovered_count });
  }
  const recent = (recentData ?? []) as RecentEntry[];
  const top = (topData ?? []) as { nickname: string; total: number }[];

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-typewriter text-3xl font-bold text-olive-800">Bienvenue, chasseur !</h1>
        <Link href="/hasard" className="btn">🎲 Fiche au hasard</Link>
      </div>
      <p className="mb-6 text-olive-700">Retrouve ici tout ce que la S.I.D. a déjà croisé en chasse. Le reste ? Il reste à découvrir !</p>

      <form action="/recherche" className="mb-8 flex gap-2">
        <input name="q" type="search" placeholder="Un monstre, une arme, un skill, un lieu, un tag… (appuie sur / pour chercher partout)" className="input" />
        <button className="btn">Fouiner !</button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c: Category) => {
          const s = stats.get(c) ?? { total: 0, found: 0 };
          const pct = s.total ? Math.round((s.found / s.total) * 100) : 0;
          return (
            <Link key={c} href={`/${c}`} className="card p-5 transition hover:-translate-y-0.5 hover:border-brass-500">
              <div className="text-3xl">{CATEGORY_LABELS[c].icon}</div>
              <h2 className="mt-2 font-typewriter text-xl font-bold">{CATEGORY_LABELS[c].label}</h2>
              <p className="text-sm text-olive-700">
                {s.found} / {s.total} découvert{s.found > 1 ? 's' : ''}
              </p>
              <div className="mt-2 h-2 rounded-full bg-white/60">
                <div className="h-2 rounded-full bg-gradient-to-r from-brass-400 to-brass-500" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-3 font-typewriter text-xl font-bold text-olive-800">🆕 Dernières découvertes</h2>
          {recent.length === 0 ? (
            <p className="italic text-olive-700">Rien de découvert pour l’instant. À vos armes !</p>
          ) : (
            <ul className="divide-y divide-white/70">
              {recent.map((r) => (
                <li key={`${r.category}${r.number}`} className="flex items-center gap-3 py-2">
                  {r.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image_url} alt="" className="h-10 w-10 flex-none rounded-lg border border-white/70 object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-white/60 text-xl">
                      {CATEGORY_LABELS[r.category].icon}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/${r.category}/${pad(r.number)}`} className="font-bold text-olive-700 hover:underline">
                      {r.title}
                    </Link>
                    <div className="text-xs text-olive-700/80">
                      {CATEGORY_LABELS[r.category].label} · N° {pad(r.number)}
                      {r.discovered_at && ` · ${new Date(r.discovered_at).toLocaleDateString('fr-FR')}`}
                    </div>
                  </div>
                  {r.discoverer && <Mention nickname={r.discoverer} />}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-3 font-typewriter text-xl font-bold text-olive-800">🏆 Top découvreurs</h2>
          {top.length === 0 ? (
            <p className="italic text-olive-700">Personne n’a encore été crédité.</p>
          ) : (
            <ol className="space-y-2">
              {top.map((t, i) => (
                <li key={t.nickname} className="flex items-center justify-between gap-2">
                  <span>
                    <span className="mr-2 font-typewriter font-bold text-olive-600/70">{['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`}</span>
                    <Mention nickname={t.nickname} />
                  </span>
                  <span className="font-typewriter font-bold">{t.total}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
