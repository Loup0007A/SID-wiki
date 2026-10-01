import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES, CATEGORY_LABELS, type Category } from '@/lib/wiki';
import AccessDenied from '@/components/AccessDenied';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('wiki_stats');
  if (error) return <AccessDenied />;

  const stats = new Map<string, { total: number; found: number }>();
  for (const r of (data ?? []) as { category: string; total: number; discovered_count: number }[]) {
    stats.set(r.category, { total: r.total, found: r.discovered_count });
  }

  return (
    <div>
      <h1 className="mb-1 font-typewriter text-3xl font-bold text-olive-800">Bienvenue, chasseur !</h1>
      <p className="mb-6 text-olive-700">Retrouve ici tout ce que la S.I.D. a déjà croisé en chasse. Le reste ? Il reste à découvrir !</p>

      <form action="/recherche" className="mb-8 flex gap-2">
        <input name="q" type="search" placeholder="Un monstre, une arme, un lieu, un tag, un numéro…" className="input" />
        <button className="btn">Fouiner !</button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="mt-2 h-2 rounded bg-kraft-200">
                <div className="h-2 rounded bg-brass-500" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
