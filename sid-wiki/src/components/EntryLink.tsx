'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { pad } from '@/lib/wiki';

type Preview =
  | { exists: false }
  | { exists: true; discovered: false }
  | { exists: true; discovered: true; title: string; summary: string; image_url: string | null };

// Cache partagé pour éviter de redemander un aperçu déjà chargé.
const cache = new Map<string, Preview>();

export default function EntryLink({
  category,
  number,
  children,
}: {
  category: string;
  number: number;
  children: React.ReactNode;
}) {
  const key = `${category}/${number}`;
  const [preview, setPreview] = useState<Preview | null>(cache.get(key) ?? null);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load() {
    if (cache.has(key)) {
      setPreview(cache.get(key)!);
      return;
    }
    const { data, error } = await createClient().rpc('wiki_preview', {
      p_category: category,
      p_number: number,
    });
    if (error || !data) return;
    cache.set(key, data as Preview);
    setPreview(data as Preview);
  }

  function show() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setOpen(true);
      load();
    }, 200);
  }

  function hide() {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  }

  return (
    <span className="relative inline-block" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      <Link href={`/${category}/${pad(number)}`} className="font-semibold text-olive-700 underline decoration-brass-500 decoration-dotted underline-offset-2 hover:text-stamp">
        {children}
      </Link>

      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-50 mt-1 block w-72 rounded border border-white/80 bg-white/70 backdrop-blur-xl p-3 text-left text-sm font-normal text-ink shadow-lg"
        >
          {!preview && <span className="italic text-olive-700">Chargement…</span>}
          {preview && !preview.exists && <span className="italic">Fiche inexistante.</span>}
          {preview && preview.exists && !preview.discovered && (
            <span className="block">
              <span className="block font-typewriter text-xs text-olive-700">
                {category} · {pad(number)}
              </span>
              <span className="block text-2xl font-bold text-stamp">?</span>
              <span className="italic">À découvrir !</span>
            </span>
          )}
          {preview && preview.exists && preview.discovered && (
            <span className="flex gap-3">
              {preview.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.image_url} alt="" className="h-16 w-16 flex-none rounded border border-olive-800/40 object-cover" />
              )}
              <span className="block min-w-0">
                <span className="block font-typewriter text-xs text-olive-700">
                  {category} · {pad(number)}
                </span>
                <span className="block font-bold">{preview.title}</span>
                {preview.summary && <span className="line-clamp-3 block text-xs">{preview.summary}</span>}
              </span>
            </span>
          )}
        </span>
      )}
    </span>
  );
}
