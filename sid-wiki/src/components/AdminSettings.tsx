'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { removeStoredFile } from '@/lib/storage';
import StandFigure from './StandFigure';
import { SidIcon } from "@/components/icons/SidIcon";

/** Réglages : annonce affichée en haut de l'accueil pour tous les membres. */
export default function AdminSettings() {
  const supabase = useMemo(() => createClient(), []);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stand, setStand] = useState<string | null>(null);
  const [standMsg, setStandMsg] = useState<string | null>(null);
  const [standError, setStandError] = useState<string | null>(null);
  const [standBusy, setStandBusy] = useState(false);

  useEffect(() => {
    supabase.rpc('wiki_stand_image_get').then(({ data }) => setStand(typeof data === 'string' && data ? data : null));
  }, [supabase]);

  /** Enregistre la nouvelle image (ou null pour revenir au mannequin en bois) puis supprime l'ancienne du stockage. */
  async function saveStand(url: string | null) {
    const { error } = await supabase.rpc('wiki_stand_image_set', { p_url: url ?? '' });
    if (error) {
      if (url) await removeStoredFile(supabase, 'wiki-images', url);
      const missing = error.code === 'PGRST202' || error.code === '42883';
      return setStandError(missing ? 'Exécute d’abord supabase/migrations/0209_wiki_gear_transform_stand_image.sql dans le SQL Editor.' : error.message);
    }
    if (stand && stand !== url) await removeStoredFile(supabase, 'wiki-images', stand);
    setStand(url);
    setStandMsg(url ? 'Image du porte-armure enregistrée.' : 'Retour au porte-armure en bois.');
  }

  async function uploadStand(file: File) {
    setStandMsg(null);
    setStandError(null);
    if (!['image/png', 'image/webp'].includes(file.type)) return setStandError('Utilise un PNG ou un WebP à fond transparent.');
    if (file.size > 3 * 1024 * 1024) return setStandError('Image trop lourde (3 Mo maximum).');
    setStandBusy(true);
    const path = `stand/${crypto.randomUUID()}.${file.type === 'image/webp' ? 'webp' : 'png'}`;
    const { error } = await supabase.storage.from('wiki-images').upload(path, file, { contentType: file.type, upsert: false });
    if (error) setStandError(error.message);
    else await saveStand(supabase.storage.from('wiki-images').getPublicUrl(path).data.publicUrl);
    setStandBusy(false);
  }

  useEffect(() => {
    supabase.rpc('wiki_announcement_get').then(({ data }) => {
      const v = typeof data === 'string' ? data : '';
      setText(v);
      setSaved(v);
    });
  }, [supabase]);

  async function save(value: string) {
    setMsg(null);
    const { error } = await supabase.rpc('wiki_announcement_set', { p_text: value });
    if (error) return setError(error.message);
    setError(null);
    setText(value.trim());
    setSaved(value.trim());
    setMsg(value.trim() ? 'Annonce publiée sur l’accueil.' : 'Annonce retirée.');
  }

  return (
    <div className="space-y-5">
    <div className="card max-w-2xl p-5">
      <h2 className="mb-1 font-typewriter text-xl font-bold text-olive-800"><SidIcon name="megaphone" /> Annonce d’accueil</h2>
      <p className="mb-3 text-sm text-olive-700">Un message visible par tous en haut de la page d’accueil (événement, nouveauté, règle…). Laisse vide pour ne rien afficher.</p>
      <textarea className="input min-h-[6rem]" maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex. : Grande chasse ce samedi à 21 h ! 🐉" />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button className="btn" disabled={text.trim() === saved} onClick={() => save(text)}>
          Publier
        </button>
        {saved && (
          <button className="btn-ghost" onClick={() => save('')}>
            Retirer l’annonce
          </button>
        )}
        <span className="text-xs text-olive-700">{text.length}/500</span>
      </div>
      {error && <p className="mt-2 text-stamp">{error}</p>}
      {msg && <p className="mt-2 font-bold text-olive-700">{msg}</p>}
    </div>

      <div className="card max-w-2xl p-5">
        <h2 className="mb-1 font-typewriter text-xl font-bold text-olive-800"><SidIcon name="walker" /> Image du porte-armure</h2>
        <p className="mb-3 text-sm text-olive-700">
          Remplace le mannequin en bois de l’onglet Profils par ton image : PNG ou WebP à <strong>fond transparent</strong>, format portrait <strong>2:3</strong> (par exemple 384 × 576 px), personnage centré de face. Les armures et les armes sont dessinées par-dessus.
        </p>
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex-none rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-sky-400/[0.06] px-3 py-2">
            <StandFigure className="h-48 w-auto" gear={[]} standImage={stand} />
          </div>
          <div className="min-w-[12rem] flex-1 space-y-3">
            <input
              type="file"
              accept="image/png,image/webp"
              disabled={standBusy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) uploadStand(file);
              }}
            />
            {standBusy && <p className="text-sm italic">Envoi…</p>}
            {stand && (
              <button
                className="btn-ghost"
                disabled={standBusy}
                onClick={() => {
                  setStandMsg(null);
                  setStandError(null);
                  saveStand(null);
                }}
              >
                Revenir au porte-armure en bois
              </button>
            )}
            {standError && <p className="text-stamp">{standError}</p>}
            {standMsg && <p className="font-bold text-olive-700">{standMsg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
