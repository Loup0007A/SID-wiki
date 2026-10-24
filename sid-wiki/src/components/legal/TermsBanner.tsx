'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TERMS_VERSION } from './LegalContent';
import { SidIcon } from "@/components/icons/SidIcon";

/**
 * Demande d'accepter les CGU et la politique de confidentialité, communes
 * aux trois sites du S.I.D. (l'acceptation vaut partout).
 */
// Membre dont on sait déjà que les conditions sont acceptées (pour cette visite).
let termsOkFor: string | null = null;

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
      // Session lue sur place ; et une fois les conditions vues à jour, on ne
      // redemande plus à chaque changement de page.
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id;
      if (!uid || termsOkFor === uid) return;
      const { data, error } = await supabase.from('profiles').select('terms_version').eq('id', uid).maybeSingle();
      if (!error && data && data.terms_version !== TERMS_VERSION) setShow(true);
      else if (!error && data) termsOkFor = uid;
    })();
  }, [pathname]);

  if (!show) return null;

  async function accept() {
    setBusy(true);
    const { error } = await createClient().rpc('accept_terms', { p_version: TERMS_VERSION });
    setBusy(false);
    if (!error) {
      setShow(false);
      termsOkFor = (await createClient().auth.getSession()).data.session?.user.id ?? null;
    }
  }

  return (
    <div className="card mb-5 flex flex-wrap items-center gap-3 p-4">
      <p className="min-w-[14rem] flex-1 text-sm text-olive-800">
        <SidIcon name="scroll" /> Le S.I.D. a des conditions d&apos;utilisation et une politique de confidentialité, communes au Dossier Central, à la
        Cartographie et au Wiki. Lis <Link href="/cgu" className="underline">les conditions</Link> et{' '}
        <Link href="/confidentialite" className="underline">ce que nous faisons de tes données</Link>.
      </p>
      <button className="btn" onClick={accept} disabled={busy}>
        {busy ? '…' : "J'ai lu et j'accepte"}
      </button>
    </div>
  );
}
