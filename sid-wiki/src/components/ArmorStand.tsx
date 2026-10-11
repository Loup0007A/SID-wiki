'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import {
  CATEGORY_LABELS,
  GEAR_CATEGORIES,
  GEAR_SLOT_LABELS,
  pad,
  parseGear,
  type Category,
  type EntrySummary,
  type GearItem,
  type GearSlot,
} from '@/lib/wiki';
import EntryLink from './EntryLink';
import Icon from './Icon';
import Rarity from './Rarity';
import StandFigure from './StandFigure';

const LEFT: GearSlot[] = ['tete', 'torse', 'jambes', 'pieds'];
const RIGHT: GearSlot[] = ['main_droite', 'main_gauche', 'dos'];
const ARMOR = new Set<GearSlot>(LEFT);

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Case d'inventaire : image de la fiche équipée, ou silhouette de l'emplacement vide. */
function SlotFace({ slot, item, active }: { slot: GearSlot; item: GearItem | undefined; active: boolean }) {
  return (
    <>
      <span
        className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 bg-black/45 shadow-[inset_0_3px_8px_rgba(0,0,0,0.7)] transition group-hover:border-brass-400 ${
          active ? 'border-brass-400' : item ? 'border-white/35' : 'border-white/15'
        }`}
      >
        {!item ? (
          <span aria-hidden className="text-2xl opacity-25 grayscale">{GEAR_SLOT_LABELS[slot].icon}</span>
        ) : !item.discovered ? (
          <span className="text-3xl font-extrabold text-olive-700/50">?</span>
        ) : item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon name={item.category} className="text-3xl" />
        )}
      </span>
      <span className="max-w-[4.5rem] text-center text-[11px] font-bold leading-tight text-olive-800">{GEAR_SLOT_LABELS[slot].label}</span>
    </>
  );
}

/**
 * Le profil façon « armor-stand » : 4 cases d'armure à gauche, le mannequin au centre,
 * mains et dos à droite. Si `canEdit`, un clic sur une case (ou sur le mannequin) ouvre le choix de la fiche.
 */
export default function ArmorStand({ profileId, canEdit, initialGear }: { profileId: string; canEdit: boolean; initialGear: GearItem[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [gear, setGear] = useState<GearItem[]>(initialGear);
  const [open, setOpen] = useState<GearSlot | null>(null);
  const [hover, setHover] = useState<GearSlot | null>(null);
  const [pool, setPool] = useState<EntrySummary[] | null>(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'all' | Category>('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  const by = useMemo(() => new Map(gear.map((g) => [g.slot, g])), [gear]);

  // Fiches équipables (Armes + Objets découverts) : chargées une seule fois, à la première ouverture.
  useEffect(() => {
    if (!open || pool) return;
    let alive = true;
    Promise.all(GEAR_CATEGORIES.map((c) => supabase.rpc('wiki_list', { p_category: c }))).then((res) => {
      if (!alive) return;
      const failed = res.find((r) => r.error);
      if (failed?.error) return setError(failed.error.message);
      setPool(res.flatMap((r) => (r.data ?? []) as EntrySummary[]).filter((e) => e.discovered && e.title));
    });
    return () => {
      alive = false;
    };
  }, [open, pool, supabase]);

  // Fenêtre ouverte : page figée derrière, Échap pour fermer, focus dans la fenêtre.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', onKey);
    dialog.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function pick(slot: GearSlot) {
    setError(null);
    setQ('');
    setCat('all');
    setOpen(slot);
  }

  async function equip(slot: GearSlot, entry: { category: Category; number: number } | null) {
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.rpc('wiki_profile_gear_set', {
      p_user: profileId,
      p_slot: slot,
      p_category: entry ? entry.category : null,
      p_number: entry ? entry.number : null,
    });
    setBusy(false);
    if (error) return setError(error.message);
    setGear(parseGear(data));
    setOpen(null);
  }

  const shown = useMemo(() => {
    if (!open || !pool) return [];
    const f = norm(q.trim());
    // Armure : les objets d'abord ; mains et dos : les armes d'abord.
    const first: Category = ARMOR.has(open) ? 'objets' : 'armes';
    return pool
      .filter((e) => cat === 'all' || e.category === cat)
      .filter((e) => !f || norm(e.title ?? '').includes(f) || pad(e.number).includes(f) || (e.tags ?? []).some((t) => norm(t).includes(f)))
      .sort((a, b) => (a.category === b.category ? a.number - b.number : a.category === first ? -1 : 1));
  }, [open, pool, q, cat]);

  const column = (slots: GearSlot[]) => (
    <div className="flex flex-col items-center gap-2">
      {slots.map((s) => {
        const item = by.get(s);
        const cls = 'group flex flex-col items-center gap-1 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-kraft-400';
        const face = <SlotFace slot={s} item={item} active={hover === s || open === s} />;
        const hoverProps = { onMouseEnter: () => setHover(s), onMouseLeave: () => setHover(null) };
        if (canEdit) {
          return (
            <button key={s} type="button" className={cls} onClick={() => pick(s)} aria-label={`${GEAR_SLOT_LABELS[s].label} : ${item ? item.title ?? '?' : 'vide'} — modifier`} {...hoverProps}>
              {face}
            </button>
          );
        }
        return item ? (
          <Link key={s} href={`/${item.category}/${pad(item.number)}`} className={cls} aria-label={`${GEAR_SLOT_LABELS[s].label} : ${item.title ?? '?'}`} {...hoverProps}>
            {face}
          </Link>
        ) : (
          <div key={s} className={cls}>
            {face}
          </div>
        );
      })}
    </div>
  );

  const current = open ? by.get(open) : undefined;

  return (
    <section className="card p-4 sm:p-6">
      <div className="mx-auto grid max-w-md grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:gap-5">
        {column(LEFT)}
        <div className="flex justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-sky-400/[0.06] px-2 py-4">
          <StandFigure gear={gear} active={hover ?? open} onSlot={canEdit ? pick : undefined} className="h-72 w-auto max-w-full sm:h-80" />
        </div>
        {column(RIGHT)}
      </div>

      {canEdit && (
        <p className="mt-4 text-center text-sm text-olive-700">
          Clique une case — ou une partie du mannequin — pour y poser une arme ou un objet découvert.
        </p>
      )}

      <ul className="mx-auto mt-5 max-w-md divide-y divide-white/10 border-t border-white/15 text-sm">
        {[...LEFT, ...RIGHT].map((s) => {
          const item = by.get(s);
          return (
            <li key={s} className="flex items-center justify-between gap-3 py-2">
              <span className="flex-none font-typewriter font-bold text-olive-800">
                <span aria-hidden className="mr-1.5">{GEAR_SLOT_LABELS[s].icon}</span>
                {GEAR_SLOT_LABELS[s].label}
              </span>
              {item ? (
                <span className="flex min-w-0 items-center gap-2 text-right">
                  <Rarity value={item.rarity} className="hidden text-xs sm:inline-flex" />
                  <EntryLink category={item.category} number={item.number}>
                    {item.title ?? `? (N° ${pad(item.number)})`}
                  </EntryLink>
                </span>
              ) : (
                <span className="italic text-olive-700/60">vide</span>
              )}
            </li>
          );
        })}
      </ul>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
            <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Fermer" onClick={() => setOpen(null)} />
            <div
              ref={dialog}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={`Équiper : ${GEAR_SLOT_LABELS[open].label}`}
              className="relative flex max-h-[85vh] w-full flex-col rounded-t-3xl border border-white/20 bg-[#0a1428] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-ink shadow-2xl outline-none sm:max-w-lg sm:rounded-3xl sm:pb-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-typewriter text-xl font-bold text-white">
                    <span aria-hidden className="mr-2">{GEAR_SLOT_LABELS[open].icon}</span>
                    {GEAR_SLOT_LABELS[open].label}
                  </h2>
                  <p className="text-sm text-olive-700">{GEAR_SLOT_LABELS[open].hint}</p>
                </div>
                <button type="button" className="btn-ghost !min-h-[2.25rem] !px-3" onClick={() => setOpen(null)} aria-label="Fermer">
                  ✕
                </button>
              </div>

              {current && (
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-brass-400/40 bg-brass-400/10 p-2 text-sm">
                  <span className="min-w-0 flex-1">
                    Équipé : <strong>{current.title ?? `? (N° ${pad(current.number)})`}</strong>
                  </span>
                  <Link href={`/${current.category}/${pad(current.number)}`} className="btn-ghost !min-h-[2rem] !px-3 !py-0.5 text-sm">
                    Voir la fiche
                  </Link>
                  <button type="button" className="btn-danger !min-h-[2rem] !px-3 !py-0.5 text-sm" disabled={busy} onClick={() => equip(open, null)}>
                    Retirer
                  </button>
                </div>
              )}

              <div className="mb-2 flex flex-wrap items-center gap-2">
                <input type="search" className="input min-w-0 flex-1" placeholder="Chercher (nom, n°, tag)…" value={q} onChange={(e) => setQ(e.target.value)} />
                <span className="inline-flex overflow-hidden rounded-full border border-white/20" role="group" aria-label="Catégorie">
                  {(['all', ...GEAR_CATEGORIES] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCat(c)}
                      aria-pressed={cat === c}
                      className={`px-3 py-1.5 text-sm font-bold ${cat === c ? 'bg-brass-400 text-night' : 'hover:bg-white/10'}`}
                    >
                      {c === 'all' ? 'Tout' : CATEGORY_LABELS[c].label}
                    </button>
                  ))}
                </span>
              </div>

              {error && <p className="mb-2 text-sm text-stamp">{error}</p>}

              <div className="min-h-[8rem] flex-1 overflow-y-auto rounded-xl border border-white/15 bg-white/[0.05]">
                {!pool && !error && <p className="p-4 italic text-olive-700">Chargement…</p>}
                {pool && shown.length === 0 && (
                  <p className="p-4 italic text-olive-700">
                    {pool.length === 0 ? 'Aucune arme ni objet découvert pour l’instant : à vos chasses !' : 'Rien ne correspond à ce filtre.'}
                  </p>
                )}
                <ul className="divide-y divide-white/10">
                  {shown.map((e) => {
                    const on = current?.category === e.category && current.number === e.number;
                    return (
                      <li key={`${e.category}/${e.number}`}>
                        <button
                          type="button"
                          disabled={busy || on}
                          onClick={() => equip(open, e)}
                          className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${on ? 'bg-brass-400/15' : 'hover:bg-white/[0.1]'} disabled:cursor-default`}
                        >
                          <span className="flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-black/40 text-xl">
                            {e.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={e.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                            ) : (
                              <Icon name={e.category} />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-bold">{e.title}</span>
                            <span className="block font-typewriter text-xs text-olive-700">
                              {CATEGORY_LABELS[e.category].singular} · N° {pad(e.number)}
                            </span>
                          </span>
                          <Rarity value={e.rarity} className="flex-none text-xs" />
                          {on && <span className="flex-none text-xs font-bold text-brass-300">équipé</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}
