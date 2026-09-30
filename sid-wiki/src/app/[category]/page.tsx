import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CATEGORY_LABELS, isCategory, type EntrySummary } from '@/lib/wiki';
import EntryCard from '@/components/EntryCard';
import AccessDenied from '@/components/AccessDenied';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: { tag?: string; show?: string };
}) {
  if (!isCategory(params.category)) notFound();
  const category = params.category;
  const supabase = createClient();

  const [{ data, error }, { data: tagData }] = await Promise.all([
    supabase.rpc('wiki_list', { p_category: category }),
    supabase.rpc('wiki_tags', { p_category: category }),
  ]);
  if (error) return <AccessDenied />;

  const tags = (tagData ?? []) as string[];
  const onlyFound = searchParams.show === 'found';
  let entries = (data ?? []) as EntrySummary[];
  if (searchParams.tag) entries = entries.filter((e) => e.tags?.includes(searchParams.tag!));
  if (onlyFound) entries = entries.filter((e) => e.discovered);

  const base = `/${category}`;
  const q = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { tag: searchParams.tag, show: searchParams.show, ...extra };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `${base}?${s}` : base;
  };

  return (
    <div>
      <h1 className="mb-4 font-typewriter text-3xl font-bold uppercase tracking-widest text-olive-800">
        {CATEGORY_LABELS[category].icon} {CATEGORY_LABELS[category].label}
      </h1>

      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
        <Link href={q({ show: onlyFound ? undefined : 'found' })} className="btn-ghost">
          {onlyFound ? 'Afficher tout' : 'Découverts seulement'}
        </Link>
        {tags.map((t) => (
          <Link
            key={t}
            href={q({ tag: searchParams.tag === t ? undefined : t })}
            className={searchParams.tag === t ? 'btn' : 'btn-ghost'}
          >
            #{t}
          </Link>
        ))}
      </div>

      {entries.length === 0 ? (
        <p className="italic text-olive-700">Aucune fiche.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {entries.map((e) => (
            <EntryCard key={e.number} entry={e} />
          ))}
        </div>
      )}
    </div>
  );
}
