import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CATEGORY_LABELS, firstParam, isCategory, type EntrySummary } from '@/lib/wiki';
import CategoryView from '@/components/CategoryView';
import Icon from '@/components/Icon';
import AccessDenied from '@/components/AccessDenied';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: { tag?: string | string[]; show?: string | string[] };
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
  const tag = firstParam(searchParams.tag);
  const show = firstParam(searchParams.show);
  const onlyFound = show === 'found';
  let entries = (data ?? []) as EntrySummary[];
  if (tag) entries = entries.filter((e) => e.tags?.includes(tag));
  if (onlyFound) entries = entries.filter((e) => e.discovered);

  const base = `/${category}`;
  const q = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { tag, show, ...extra };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `${base}?${s}` : base;
  };

  const all = (data ?? []) as EntrySummary[];
  const found = all.filter((e) => e.discovered).length;

  return (
    <div className={`cat-${category}`}>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-2 border-b border-[color:var(--rule)] pb-5">
        <h1 className="flex items-center gap-3 font-typewriter text-[2.3rem] leading-none text-olive-900 sm:text-[2.8rem]">
          <Icon name={category} size="0.95em" />
          {CATEGORY_LABELS[category].label}
        </h1>
        <p className="leading-none">
          <span className="catno text-[2.2rem]">{found}</span>
          <span className="font-typewriter text-xl text-olive-600"> / {all.length}</span>
          <span className="block pt-1 text-sm text-olive-700">fiches découvertes</span>
        </p>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-1.5 text-sm">
        <Link
          href={q({ show: onlyFound ? undefined : 'found' })}
          className={`chip !py-1 ${onlyFound ? '!border-[color:var(--cat)] !text-ink' : ''}`}
          aria-current={onlyFound ? 'true' : undefined}
        >
          Découvertes seulement
        </Link>
        {tags.map((t) => (
          <Link
            key={t}
            href={q({ tag: tag === t ? undefined : t })}
            className={`chip !py-1 ${tag === t ? '!border-[color:var(--cat)] !text-ink' : ''}`}
            aria-current={tag === t ? 'true' : undefined}
          >
            #{t}
          </Link>
        ))}
      </div>

      <CategoryView entries={entries} />
    </div>
  );
}
