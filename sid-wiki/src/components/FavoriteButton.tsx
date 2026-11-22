'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SidIcon } from '@/components/icons/SidIcon';
import { rechargerEpingles } from '@/components/Epingles';

export default function FavoriteButton({ category, number, initial }: { category: string; number: number; initial: boolean }) {
  const [fav, setFav] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const { data, error } = await createClient().rpc('wiki_favorite_toggle', { p_category: category, p_number: number });
    setBusy(false);
    if (!error) {
      setFav(data === true);
      // Les favoris sont aussi les épingles des fiches (Lot 98).
      void rechargerEpingles();
    }
  }

  return (
    <button type="button" onClick={toggle} disabled={busy} className="btn-ghost" aria-pressed={fav} title="Favoris : aussi dans tes épingles, sur les trois sites (Ctrl+K)">
      {fav ? <><SidIcon name="starGold" /> Favori</> : <><SidIcon name="starGold" className="opacity-40 grayscale" /> Favori</>}
    </button>
  );
}
