import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { sessionExpiry, sessionStillFresh } from '@/lib/supabase/sessionCookie';

export async function middleware(request: NextRequest) {
  const isLogin = request.nextUrl.pathname.startsWith('/login');
  // Pages légales : lisibles sans être connecté.
  const isPublic = ['/cgu', '/confidentialite'].some((p) => request.nextUrl.pathname.startsWith(p));
  const go = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = '';
    return NextResponse.redirect(url);
  };

  // Chemin rapide, sans appel réseau (la grande majorité des pages) :
  // pas de cookie de session du tout, ou jeton encore valable un moment.
  // Avant, chaque page attendait ici un aller-retour vers Supabase.
  const exp = sessionExpiry(request);
  if (exp === null) return isLogin || isPublic ? NextResponse.next() : go('/login');
  // (La page de connexion renvoie elle-même vers l'accueil si la session est bonne.)
  if (sessionStillFresh(exp)) return NextResponse.next();

  // Jeton expiré (ou presque) : Supabase le rafraîchit et pose les nouveaux cookies.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(list: { name: string; value: string; options: CookieOptions }[]) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Une redirection est une NOUVELLE réponse : sans recopier les cookies, un jeton rafraîchi
  // pendant getUser() serait perdu et le membre se retrouverait déconnecté au hasard.
  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = '';
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  if (!user && !isLogin && !isPublic) return redirectTo('/login');
  if (user && isLogin) return redirectTo('/');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/).*)'],
};
