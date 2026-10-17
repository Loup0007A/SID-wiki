'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TERMS_VERSION } from './LegalContent';

/**
 * Demande d'accepter les CGU et la politique de confidentialité, communes
 * aux trois sites du S.I.D. (l'acceptation vaut partout).
 */
export default function TermsBanner() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (pathname.startsWith('/login') || pathname.startsWith('/cgu') || pathname.startsWith('/confidentialite')) {
      setShow(false);
      return;
    }
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('profiles').select('terms_version').eq('id', user.id).maybeSingle();
      if (!error && data && data.terms_version !== TERMS_VERSION) setShow(true);
    })();
  }, [pathname]);

  if (!show) return null;

  async function accept() {
    setBusy(true);
    const { error } = await createClient().rpc('accept_terms', { p_version: TERMS_VERSION });
    setBusy(false);
    if (!error) setShow(false);
  }

  return (
    <div className="card mb-5 flex flex-wrap items-center gap-3 p-4">
      <p className="min-w-[14rem] flex-1 text-sm text-olive-800">
        📜 Le S.I.D. a des conditions d&apos;utilisation et une politique de confidentialité, communes au Dossier Central, à la
        Cartographie et au Wiki. Lis <Link href="/cgu" className="underline">les conditions</Link> et{' '}
        <Link href="/confidentialite" className="underline">ce que nous faisons de tes données</Link>.
      </p>
      <button className="btn" onClick={accept} disabled={busy}>
        {busy ? '…' : "J'ai lu et j'accepte"}
      </button>
    </div>
  );
}
