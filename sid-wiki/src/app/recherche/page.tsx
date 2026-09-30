import { createClient } from '@/lib/supabase/server';
import type { EntrySummary } from '@/lib/wiki';
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/wiki';
import EntryCard from '@/components/EntryCard';
import AccessDenied from '@/components/AccessDenied';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? '').trim();
  let results: EntrySummary[] = [];

  if (q) {
    const { data, error } = await createClient().rpc('wiki_search', { p_query: q, p_limit: 60 });
    if (error) return <AccessDenied />;
    results = (data ?? []) as EntrySummary[];
  }

  return (
    <div>
      <h1 className="mb-4 font-typewriter text-3xl font-bold uppercase tracking-widest text-olive-800">Recherche</h1>
      <form className="mb-6 flex gap-2">
        <input name="q" defaultValue={q} type="search" autoFocus placeholder="Titre, texte, tag, numéro…" className="input" />
        <button className="btn">Chercher</button>
      </form>

      {q && results.length === 0 && <p className="italic text-olive-700">Aucun résultat pour « {q} ».</p>}

      {CATEGORIES.map((c) => {
        const list = results.filter((r) => r.category === c);
        if (list.length === 0) return null;
        return (
          <section key={c} className="mb-8">
            <h2 className="mb-2 font-typewriter text-lg uppercase tracking-widest">
              {CATEGORY_LABELS[c].icon} {CATEGORY_LABELS[c].label} ({list.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
