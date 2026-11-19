'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CATEGORY_LABELS, pad, type Category, type InfoRow } from '@/lib/wiki';
import ProposalDiff from './ProposalDiff';
import Markdown from './Markdown';
import Icon from './Icon';

type Status = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
type Row = {
  id: string;
  kind?: 'edit' | 'new';
  status: Status;
  created_at: string;
  reviewed_at: string | null;
  note: string | null;
  review_note: string | null;
  author: string | null;
  mine: boolean;
  category: Category;
  number: number | null;
  entry_title: string | null;
  title: string | null;
  outdated: boolean;
};
type Fields = { title: string | null; summary: string | null; content: string | null; tags: string[]; infobox: InfoRow[] };
type Detail = Row & { reviewer: string | null; rarity?: number | null; proposed: Fields; current: Fields };

const STATUS: Record<Status, { label: string; cls: string }> = {
  pending: { label: 'En attente', cls: 'st-pending' },
  accepted: { label: 'Acceptée', cls: 'st-accepted' },
  rejected: { label: 'Refusée', cls: 'st-rejected' },
  withdrawn: { label: 'Retirée', cls: 'st-withdrawn' },
};
const when = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

/** Propositions de modification : les siennes pour un membre, la file de relecture pour les admins. */
export default function ProposalsBoard() {
  const supabase = useMemo(() => createClient(), []);
  const [admin, setAdmin] = useState(false);
  const [scope, setScope] = useState<'queue' | 'mine'>('queue');
  const [status, setStatus] = useState<Status | 'all'>('pending');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [open, setOpen] = useState<Detail | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.rpc('wiki_is_admin').then(({ data }) => {
      setAdmin(data === true);
      if (data !== true) {
        setScope('mine');
        setStatus('all');
      }
    });
  }, [supabase]);

  const load = useCallback(async () => {
    const { data, error: e } = await supabase.rpc('wiki_proposals_list', { p_status: status, p_mine: scope === 'mine' });
    if (e) return setError(/wiki_proposals_list/.test(e.message) ? 'Les propositions arrivent avec la migration 0211.' : e.message);
    setError(null);
    setRows((data ?? []) as Row[]);
  }, [supabase, status, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openRow(id: string) {
    setNote('');
    const { data, error: e } = await supabase.rpc('wiki_proposal_get', { p_id: id });
    if (e) return setError(e.message);
    setOpen(data as Detail);
    requestAnimationFrame(() => document.getElementById('proposal-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  async function review(accept: boolean) {
    if (!open) return;
    setBusy(true);
    const { error: e } = await supabase.rpc('wiki_proposal_review', { p_id: open.id, p_accept: accept, p_note: note });
    setBusy(false);
    if (e) return setError(e.message);
    setOpen(null);
    await load();
  }

  async function withdraw(id: string) {
    if (!confirm('Retirer cette proposition ?')) return;
    const { error: e } = await supabase.rpc('wiki_proposal_withdraw', { p_id: id });
    if (e) return setError(e.message);
    setOpen(null);
    await load();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[color:var(--rule)] pb-4">
        <div>
          <h1 className="font-typewriter text-4xl text-olive-900">Propositions</h1>
          <p className="mt-1 max-w-[60ch] text-olive-800">
            {admin
              ? 'Les corrections et les nouvelles fiches proposées par les chasseurs. Compare, puis accepte ou refuse avec un mot.'
              : 'Tes propositions et leur réponse. Pour corriger une fiche, ouvre-la et choisis « Proposer une modification ».'}
          </p>
        </div>
        <Link href="/proposer/nouvelle" className="btn">
          <Icon name="propose" /> Proposer une fiche
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {admin && (
          <div role="tablist" aria-label="Quelles propositions" className="seg">
            <button type="button" role="tab" aria-selected={scope === 'queue'} className={scope === 'queue' ? 'is-on' : ''} onClick={() => setScope('queue')}>
              À relire
            </button>
            <button type="button" role="tab" aria-selected={scope === 'mine'} className={scope === 'mine' ? 'is-on' : ''} onClick={() => setScope('mine')}>
              Les miennes
            </button>
          </div>
        )}
        <div role="group" aria-label="Statut" className="flex flex-wrap gap-1.5">
          {(['pending', 'accepted', 'rejected', 'all'] as const).map((s) => (
            <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)} className={`chip ${status === s ? 'chip-on' : ''}`}>
              {s === 'all' ? 'Toutes' : STATUS[s].label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="font-semibold text-[color:var(--sanguine)]" role="alert">{error}</p>}
      {rows === null && !error && <p className="text-olive-700">Chargement…</p>}
      {rows && rows.length === 0 && (
        <div className="panel p-8 text-center">
          <p className="font-typewriter text-2xl text-olive-900">Rien ici</p>
          <p className="mt-1 text-olive-700">{status === 'pending' ? 'Aucune proposition en attente.' : 'Aucune proposition.'}</p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => openRow(r.id)} className={`prop-row cat-${r.category} ${open?.id === r.id ? 'is-open' : ''}`}>
                <span className="catno w-14 shrink-0 text-2xl leading-none">{r.number !== null ? pad(r.number) : '+'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-typewriter text-lg text-olive-900">{r.entry_title ?? r.title}</span>
                  <span className="block truncate text-xs text-olive-700">
                    {r.kind === 'new' ? `Nouvelle fiche (${CATEGORY_LABELS[r.category].singular.toLowerCase()})` : CATEGORY_LABELS[r.category].singular} · par {r.mine ? 'toi' : r.author ?? 'un chasseur'} · {when(r.created_at)}
                    {r.note ? ` · « ${r.note} »` : ''}
                  </span>
                </span>
                {r.outdated && r.status === 'pending' && <span className="hidden text-xs text-[color:var(--brass)] sm:inline">fiche modifiée depuis</span>}
                <span className={`prop-status ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <section id="proposal-detail" className={`panel cat-${open.category} scroll-mt-24 space-y-5 p-4 sm:p-6`} aria-label="Détail de la proposition">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-typewriter text-sm text-olive-600">
                {open.number !== null ? (
                  <Link href={`/${open.category}/${pad(open.number)}`} className="hover:text-ink">
                    {CATEGORY_LABELS[open.category].singular} n° {pad(open.number)} →
                  </Link>
                ) : (
                  <>Nouvelle fiche · {CATEGORY_LABELS[open.category].singular}</>
                )}
              </p>
              <h2 className="font-typewriter text-3xl text-olive-900">{open.kind === 'new' ? open.proposed.title : open.current.title}</h2>
              {open.kind === 'new' && open.rarity && <p className="text-sm text-olive-700">Rareté suggérée : {open.rarity} sur 8</p>}
              <p className="mt-1 text-sm text-olive-700">
                Proposée par {open.mine ? 'toi' : open.author ?? 'un chasseur'} le {when(open.created_at)}
              </p>
            </div>
            <span className={`prop-status ${STATUS[open.status].cls}`}>{STATUS[open.status].label}</span>
          </div>
          {open.note && (
            <blockquote className="prop-note">
              <span className="label !mb-1 block">Mot de l&apos;auteur</span>
              {open.note}
            </blockquote>
          )}
          {open.outdated && open.status === 'pending' && (
            <p className="rounded-lg border border-[color:var(--brass)]/40 bg-[color:var(--brass)]/10 p-3 text-sm text-olive-800">
              La fiche a changé depuis cette proposition : la comparaison se fait avec la version actuelle. Accepter remplacera ces changements récents.
            </p>
          )}
          {open.kind === 'new' ? (
            <div className="space-y-4">
              {open.proposed.summary && <p className="italic text-olive-800">{open.proposed.summary}</p>}
              {open.proposed.infobox.length > 0 && (
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  {open.proposed.infobox.map((r, i) => (
                    <div key={i} className="contents">
                      <dt className="text-olive-700">{r.label}</dt>
                      <dd className="text-olive-900">{r.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {open.proposed.tags.length > 0 && <p className="text-sm text-olive-700">{open.proposed.tags.map((t) => `#${t}`).join(' ')}</p>}
              <div className="card p-4">
                <Markdown>{open.proposed.content || ''}</Markdown>
              </div>
            </div>
          ) : (
            <>
              {open.status !== 'pending' && <p className="text-xs text-olive-700">Comparaison avec la fiche telle qu&apos;elle était au moment de la proposition.</p>}
              <ProposalDiff current={open.current} proposed={open.proposed} />
            </>
          )}
          {open.review_note && (
            <blockquote className="prop-note">
              <span className="label !mb-1 block">Réponse de l&apos;équipe{open.reviewer ? ` (${open.reviewer})` : ''}</span>
              {open.review_note}
            </blockquote>
          )}
          {open.status === 'pending' && admin && !open.mine && (
            <div className="space-y-3 border-t border-[color:var(--rule)] pt-4">
              <label className="label" htmlFor="review-note">Mot pour l&apos;auteur (facultatif)</label>
              <textarea id="review-note" className="input min-h-[4.5rem]" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn" disabled={busy} onClick={() => review(true)}>
                  {open.kind === 'new' ? 'Créer la fiche' : 'Accepter et publier'}
                </button>
                <button type="button" className="btn-danger" disabled={busy} onClick={() => review(false)}>
                  Refuser
                </button>
              </div>
            </div>
          )}
          {open.status === 'pending' && open.mine && (
            <button type="button" className="btn-ghost" onClick={() => withdraw(open.id)}>
              Retirer ma proposition
            </button>
          )}
        </section>
      )}
    </div>
  );
}
