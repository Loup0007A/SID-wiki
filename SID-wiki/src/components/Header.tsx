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
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/40 shadow-[0_4px_24px_rgba(37,99,184,0.12)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link href="/" className="font-typewriter text-2xl font-extrabold text-olive-700">
          ⚔️ Wiki du <span className="rounded-lg bg-brass-400 px-2 text-ink">S.I.D.</span>
        </Link>

        {user && (
          <>
            <nav className="flex flex-wrap gap-1 font-typewriter text-base font-bold">
              {CATEGORIES.map((c) => (
                <Link key={c} href={`/${c}`} className="rounded-full px-3 py-1 text-olive-800 transition hover:bg-white/70">
                  {CATEGORY_LABELS[c].icon} {CATEGORY_LABELS[c].label}
                </Link>
              ))}
              {isAdmin && (
                <Link href="/admin" className="rounded-full bg-brass-400 px-3 py-1 text-ink transition hover:bg-brass-300">
                  🛠 Dashboard
                </Link>
              )}
            </nav>

            <form action="/recherche" className="ml-auto flex items-center gap-2">
              <input name="q" type="search" placeholder="🔍 Rechercher…" className="input !w-44 !rounded-full !py-1 text-sm sm:!w-60" />
            </form>
            <SignOutButton />
          </>
        )}
      </div>
    </header>
  );
}
