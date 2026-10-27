'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import Emblem from '@/components/Emblem';

/**
 * Animation de connexion du Codex (≈ 1,6 s) : le livre se pose, sa
 * couverture de feutre aux filets de laiton s'ouvre, les pages défilent,
 * puis l'accueil du Wiki.
 */
export default function LoginIntro({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = setTimeout(onDone, reduce ? 350 : 1650);
    const sb = createClient();
    sb.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id;
      if (uid)
        sb.from('profiles')
          .select('nickname')
          .eq('id', uid)
          .maybeSingle()
          .then(({ data: p }) => p?.nickname && setName(p.nickname));
    });
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Directement sous <body> : rien ne passe par-dessus, rien ne la rogne.
  return createPortal(
    <div className="codex-intro fixed inset-0 z-[9000] flex items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-6">
        <div className="codex-book" aria-hidden>
          <div className="codex-pages">
            <span />
            <span />
            <span />
          </div>
          <div className="codex-flip" style={{ animationDelay: '0.95s' }} />
          <div className="codex-flip" style={{ animationDelay: '1.1s' }} />
          <div className="codex-cover">
            <Emblem name="logo" size={46} />
            <span className="codex-cover-title">Codex</span>
          </div>
        </div>
        <div className="text-center">
          <p className="codex-intro-title font-typewriter text-2xl" style={{ color: 'var(--bone)' }}>
            Le Codex s&apos;ouvre
          </p>
          <p className="codex-intro-line mt-1 text-sm" style={{ color: 'var(--lichen)' }}>
            {name ? `Bonne chasse, ${name}.` : 'Bonne chasse.'}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
