'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BRAND, brandFromConfig, setBrand } from '@/lib/brand';

// Pages toujours ouvertes : connexion (l'équipe doit pouvoir entrer) et pages légales.
const OPEN_PATHS = ['/login', '/cgu', '/confidentialite'];

/**
 * Wiki fermé depuis le Dossier Central (Modération → Sites et rubriques,
 * Lot 78) : les membres voient « Site fermé ». L'équipe (admins du wiki,
 * Gérer les comptes) entre encore, avec un bandeau.
 */
export default function SiteGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(BRAND.sites.wiki);
  const [staff, setStaff] = useState<boolean | null>(null);

  // Le serveur garde la configuration quelques minutes : on la relit.
  useEffect(() => {
    createClient()
      .rpc('public_config')
      .then(({ data, error }) => {
        if (error || !data) return;
        setBrand(brandFromConfig(data as Record<string, unknown>));
        setOpen(BRAND.sites.wiki);
      });
  }, []);

  useEffect(() => {
    if (open || staff !== null) return;
    let alive = true;
    (async () => {
      const sb = createClient();
      const { data } = await sb.auth.getSession();
      const uid = data.session?.user.id;
      let ok = false;
      if (uid) {
        const [admin, mod] = await Promise.all([sb.rpc('wiki_is_admin'), sb.rpc('has_permission', { uid, perm: 'manage_users' })]);
        ok = admin.data === true || mod.data === true;
      }
      if (alive) setStaff(ok);
    })();
    return () => {
      alive = false;
    };
  }, [open, staff]);

  if (open) return <>{children}</>;
  if (OPEN_PATHS.some((p) => pathname.startsWith(p))) {
    return (
      <>
        {pathname.startsWith('/login') && <p className="closed-note">Site fermé aux membres pour le moment</p>}
        {children}
      </>
    );
  }
  if (staff) {
    return (
      <>
        <p className="closed-note">Site fermé aux membres (Dossier Central → Modération). Tu y entres grâce à tes droits.</p>
        {children}
      </>
    );
  }
  return (
    <main id="contenu" className="mx-auto max-w-6xl px-4 py-5">
      <div className="card mx-auto mt-16 max-w-md p-6 text-center">
        <span className="stamp">Site fermé</span>
        <p className="mt-4">{staff === null ? 'Vérification…' : 'Ce site n’est pas ouvert pour le moment.'}</p>
        <a href={`${BRAND.urls.site}/dashboard`} className="mt-4 inline-block font-bold underline">
          Retour au Dossier Central
        </a>
      </div>
    </main>
  );
}
