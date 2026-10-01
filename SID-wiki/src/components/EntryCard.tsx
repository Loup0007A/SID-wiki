import Link from 'next/link';
import { pad, type EntrySummary } from '@/lib/wiki';

export default function EntryCard({ entry }: { entry: EntrySummary }) {
  const known = entry.title !== null;
  const hidden = !entry.discovered;

  return (
    <Link
      href={`/${entry.category}/${pad(entry.number)}`}
      className={`card block p-3 transition hover:-translate-y-0.5 hover:border-brass-500 ${hidden ? 'bg-white/25' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-typewriter text-xs text-olive-700">N° {pad(entry.number)}</span>
      </div>

      {known ? (
        <>
          {entry.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.image_url} alt="" className="mt-2 h-28 w-full rounded border border-olive-800/30 object-cover" />
          )}
          <h3 className="mt-2 font-bold">{entry.title}</h3>
          {entry.summary && <p className="line-clamp-2 text-sm text-olive-800">{entry.summary}</p>}
          {entry.tags && entry.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {entry.tags.map((t) => (
                <span key={t} className="rounded bg-brass-300/50 px-1.5 py-0.5 font-typewriter text-[10px]">
                  {t}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex h-24 items-center justify-center text-6xl font-extrabold text-olive-700/40">?</div>
      )}
    </Link>
  );
}
