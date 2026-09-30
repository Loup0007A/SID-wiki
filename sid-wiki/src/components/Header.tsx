import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/wiki';
import SignOutButton from './SignOutButton';

export default async function Header() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data } = await supabase.rpc('wiki_is_admin');
    isAdmin = data === true;
  }

  return (
    <header className="border-b-4 border-olive-800 bg-olive-700 text-kraft-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="font-typewriter text-lg font-bold uppercase tracking-widest text-brass-300">
          S.I.D. · Archives
        </Link>

        {user && (
          <>
            <nav className="flex flex-wrap gap-4 font-typewriter text-sm uppercase tracking-wider">
              {CATEGORIES.map((c) => (
                <Link key={c} href={`/${c}`} className="hover:text-brass-300">
                  {CATEGORY_LABELS[c].label}
                </Link>
              ))}
              {isAdmin && (
                <Link href="/admin" className="text-brass-300 hover:text-brass-400">
                  Dashboard
                </Link>
              )}
            </nav>

            <form action="/recherche" className="ml-auto flex items-center gap-2">
              <input
                name="q"
                type="search"
                placeholder="Rechercher…"
                className="w-44 rounded border border-kraft-300 bg-kraft-50 px-2 py-1 text-sm text-ink outline-none focus:border-brass-400 sm:w-60"
              />
            </form>
            <SignOutButton />
          </>
        )}
      </div>
    </header>
  );
}
