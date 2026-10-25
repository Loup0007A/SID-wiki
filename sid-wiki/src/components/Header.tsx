import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import UserMenu from './UserMenu';
import Icon from './Icon';
import MobileNav from './MobileNav';
import SearchBox from './SearchBox';
import DesktopNav from './DesktopNav';

export function HeaderView({ signedIn, isAdmin }: { signedIn: boolean; isAdmin: boolean }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[color:var(--rule)] bg-[#10201c]/95 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-6xl px-4">
          {/* Ligne 1 : sceau et nom — recherche — favoris + menu */}
          <div className="flex items-center gap-5 py-3 md:py-3.5">
            <Link href="/" className="group flex flex-none items-center gap-2.5 text-ink" aria-label="Wiki du S.I.D. : accueil">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brass-400 text-night shadow-[inset_0_0_0_2px_rgba(27,20,10,0.25),0_0_0_1px_rgba(214,170,76,0.35)] transition group-hover:rotate-[-8deg]">
                <Icon name="logo" size="1.35em" />
              </span>
              <span className="font-typewriter text-[1.35rem] leading-none md:text-[1.55rem]">Wiki du S.I.D.</span>
            </Link>

            {signedIn && (
              <>
                <div className="hidden min-w-0 flex-1 md:flex">
                  <div className="w-full max-w-lg">
                    <SearchBox />
                  </div>
                </div>

                <div className="ml-auto hidden flex-none items-center gap-2 md:flex">
                  <Link href="/favoris" className="btn-ghost !min-h-[2.5rem] !px-3" title="Mes favoris" aria-label="Mes favoris">
                    <Icon name="favoris" className="text-brass-400" />
                  </Link>
                  <UserMenu isAdmin={isAdmin} />
                </div>
              </>
            )}
          </div>

          {/* Ligne 2 : les tiroirs du codex */}
          {signedIn && <DesktopNav />}
        </div>
      </header>

      {signedIn && <MobileNav isAdmin={isAdmin} />}
    </>
  );
}

export default async function Header() {
  const supabase = createClient();
  // Session lue dans le cookie (déjà rafraîchi par le middleware) : pas
  // d'aller-retour vers le serveur d'authentification. La base vérifie le
  // jeton à chaque requête (wiki_is_admin ci-dessous comprise).
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let isAdmin = false;
  if (session) {
    const { data } = await supabase.rpc('wiki_is_admin');
    isAdmin = data === true;
  }

  return <HeaderView signedIn={!!session} isAdmin={isAdmin} />;
}
