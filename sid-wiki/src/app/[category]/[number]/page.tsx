import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CATEGORY_LABELS, isCategory, pad, parseNumber, type EntryFull } from '@/lib/wiki';
import Markdown from '@/components/Markdown';
import EntryLink from '@/components/EntryLink';
import AccessDenied from '@/components/AccessDenied';

export const dynamic = 'force-dynamic';

export default async function EntryPage({ params }: { params: { category: string; number: string } }) {
  const n = parseNumber(params.number);
  if (!isCategory(params.category) || n === null) notFound();

  const supabase = createClient();
  const { data, error } = await supabase.rpc('wiki_get', { p_category: params.category, p_number: n });
  if (error) return <AccessDenied />;
  if (!data) notFound();

  const entry = data as EntryFull;
  const isAdmin = entry.id !== null;
  const label = CATEGORY_LABELS[entry.category];
  const hiddenForUser = !entry.discovered;
  const showMasked = hiddenForUser && entry.title === null;

  return (
    <article className="mx-auto max-w-3xl">
      <nav className="mb-3 font-typewriter text-xs uppercase tracking-widest text-olive-700">
        <Link href="/" className="hover:underline">Archives</Link> /{' '}
        <Link href={`/${entry.category}`} className="hover:underline">{label.label}</Link> / N° {pad(entry.number)}
      </nav>

      {showMasked ? (
        <div className="card p-10 text-center">
          <div className="text-8xl font-bold text-olive-800/50">?</div>
          <p className="mt-3 font-typewriter uppercase tracking-widest">
            {label.singular} N° {pad(entry.number)}
          </p>
          <span className="stamp mt-3">Classifié — non découvert</span>
        </div>
      ) : (
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h1 className="text-3xl font-bold">{entry.title}</h1>
            <div className="flex items-center gap-2">
              {hiddenForUser && <span className="stamp">Masqué au public</span>}
              {isAdmin && (
                <Link href={`/admin/edit/${entry.category}/${pad(entry.number)}`} className="btn-ghost">
                  Modifier
                </Link>
              )}
            </div>
          </div>

          {entry.tags && entry.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {entry.tags.map((t) => (
                <Link
                  key={t}
                  href={`/${entry.category}?tag=${encodeURIComponent(t)}`}
                  className="rounded bg-brass-300/50 px-1.5 py-0.5 font-typewriter text-xs uppercase hover:bg-brass-300"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}

          {entry.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.image_url} alt={entry.title ?? ''} className="mt-4 max-h-96 w-full rounded border border-olive-800/30 object-cover" />
          )}

          {entry.summary && <p className="mt-4 text-lg italic text-olive-800">{entry.summary}</p>}

          {entry.content && (
            <div className="mt-4">
              <Markdown>{entry.content}</Markdown>
            </div>
          )}

          {entry.related.length > 0 && (
            <section className="mt-8 border-t-2 border-olive-800/30 pt-4">
              <h2 className="mb-2 font-typewriter text-sm uppercase tracking-widest text-olive-800">Voir aussi</h2>
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                {entry.related.map((r) => (
                  <li key={`${r.category}/${r.number}`}>
                    <EntryLink category={r.category} number={r.number}>
                      {r.title ?? `? (${r.category} ${pad(r.number)})`}
                    </EntryLink>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </article>
  );
}
