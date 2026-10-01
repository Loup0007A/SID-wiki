import { createClient } from '@/lib/supabase/server';
import type { EntrySummary } from '@/lib/wiki';
import EntryCard from '@/components/EntryCard';
import AccessDenied from '@/components/AccessDenied';

export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const { data, error } = await createClient().rpc('wiki_favorites_list');
  if (error) return <AccessDenied />;
  const entries = (data ?? []) as EntrySummary[];

  return (
    <div>
      <h1 className="mb-4 font-typewriter text-3xl font-bold text-olive-800">⭐ Mes favoris</h1>
      {entries.length === 0 ? (
        <p className="italic text-olive-700">Pas encore de favori. Clique sur « ☆ Ajouter aux favoris » sur une fiche !</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {entries.map((e) => (
            <EntryCard key={`${e.category}${e.number}`} entry={e} showCategory />
          ))}
        </div>
      )}
    </div>
  );
}
