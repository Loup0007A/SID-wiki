'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn-ghost !min-h-[2.5rem] !px-3"
      title="Déconnexion"
      aria-label="Déconnexion"
      onClick={async () => {
        await createClient().auth.signOut();
        router.replace('/login');
        router.refresh();
      }}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3v9" />
        <path d="M6.4 6.6a8 8 0 1 0 11.2 0" />
      </svg>
    </button>
  );
}
