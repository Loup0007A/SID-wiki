import { createClient } from '@/lib/supabase/server';
import type { EntrySummary } from '@/lib/wiki';
import { CATEGORIES, CATEGORY_LABELS, firstParam } from '@/lib/wiki';
import EntryCard from '@/components/EntryCard';
import AccessDenied from '@/components/AccessDenied';
import Icon from '@/components/Icon';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: { q?: string | string[] } }) {
  const q = (firstParam(searchParams.q) ?? '').trim();
  let results: EntrySummary[] = [];

  if (q) {
    const { data, error } = await createClient().rpc('wiki_search', { p_query: q, p_limit: 60 });
    if (error) return <AccessDenied />;
    results = (data ?? []) as EntrySummary[];
  }

  return (
    <div>
      <h1 className="mb-4 font-typewriter text-[2.1rem] leading-tight text-olive-900 sm:text-[2.6rem]">Recherche</h1>
      <form className="mb-6 flex gap-2">
        <input name="q" defaultValue={q} type="search" autoFocus placeholder="Monstre, arme, lieu, tag, numéro…" className="input" />
        <button className="btn flex-none whitespace-nowrap">Chercher</button>
      </form>

      {q && results.length === 0 && <p className="italic text-olive-700">Rien trouvé pour « {q} »… peut-être pas encore découvert !</p>}

      {CATEGORIES.map((c) => {
        const list = results.filter((r) => r.category === c);
        if (list.length === 0) return null;
        return (
          <section key={c} className="mb-8">
            <h2 className="mb-2 font-typewriter text-lg">
              <Icon name={c} /> {CATEGORY_LABELS[c].label} ({list.length})
            </h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {list.map((e) => (
                <EntryCard key={`${e.category}${e.number}`} entry={e} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
