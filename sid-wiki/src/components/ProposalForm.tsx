'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CATEGORIES, CATEGORY_LABELS, pad, type Category, type InfoRow } from '@/lib/wiki';
import Markdown from './Markdown';
import ProposalDiff, { type ProposalFields } from './ProposalDiff';

/** number vide : proposition d'une nouvelle fiche (migration 0212). */
type Initial = { category: Category; number: number | null; title: string; summary: string; content: string; tags: string[]; infobox: InfoRow[] };

/** Formulaire « Proposer une modification » (on part de la fiche actuelle) ou « Proposer une fiche ». */
export default function ProposalForm({ initial }: { initial: Initial }) {
  const isNew = initial.number === null;
  const [category, setCategory] = useState<Category>(initial.category);
  const [rarity, setRarity] = useState('');
  const [title, setTitle] = useState(initial.title);
  const [summary, setSummary] = useState(initial.summary);
  const [content, setContent] = useState(initial.content);
  const [tags, setTags] = useState(initial.tags.join(', '));
  const [infobox, setInfobox] = useState<InfoRow[]>(initial.infobox);
  const [note, setNote] = useState('');
  const [view, setView] = useState<'edit' | 'preview' | 'diff'>('edit');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const proposed: ProposalFields = {
    title: title.trim(),
    summary: summary.trim() || null,
    content,
    tags: tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
    infobox: infobox.map((r) => ({ label: r.label.trim(), value: r.value.trim() })).filter((r) => r.label),
  };
  const current: ProposalFields = { title: initial.title, summary: initial.summary || null, content: initial.content, tags: initial.tags, infobox: initial.infobox };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const common = {
      p_title: proposed.title,
      p_summary: proposed.summary,
      p_content: proposed.content,
      p_tags: proposed.tags,
      p_infobox: proposed.infobox,
      p_note: note,
    };
    const { error: err } = isNew
      ? await createClient().rpc('wiki_proposal_submit_new', { ...common, p_category: category, p_rarity: rarity ? Number(rarity) : null })
      : await createClient().rpc('wiki_proposal_submit', { ...common, p_category: initial.category, p_number: initial.number });
    setBusy(false);
    if (err)
      return setError(
        /wiki_proposal_submit_new/.test(err.message)
          ? 'Les nouvelles fiches arrivent avec la migration 0212.'
          : /wiki_proposal_submit/.test(err.message)
            ? 'Les propositions arrivent avec la migration 0211.'
            : err.message,
      );
    setDone(true);
  }

  const back = isNew ? `/${category}` : `/${initial.category}/${pad(initial.number!)}`;
  if (done)
    return (
      <div className="panel mx-auto max-w-xl space-y-4 p-6 text-center">
        <span className="stamp">Envoyée</span>
        <h1 className="font-typewriter text-3xl text-olive-900">Merci pour ta proposition</h1>
        <p className="text-olive-800">
          L&apos;équipe du Wiki va la relire. Tu recevras une notification quand elle sera acceptée ou refusée
          {isNew ? ' ; acceptée, la fiche prendra le numéro suivant de sa catégorie et tu en seras le découvreur.' : '.'}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href={back} className="btn-ghost">
            {isNew ? 'Retour à la catégorie' : 'Retour à la fiche'}
          </Link>
          <Link href="/propositions" className="btn">
            Mes propositions
          </Link>
        </div>
      </div>
    );

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl space-y-5">
      <header className="space-y-2">
        <p className="font-typewriter text-sm text-olive-600">
          <Link href={back} className="hover:text-ink">
            ← {isNew ? CATEGORY_LABELS[category].label : `N° ${pad(initial.number!)} · ${initial.title}`}
          </Link>
        </p>
        <h1 className="font-typewriter text-3xl text-olive-900 sm:text-4xl">{isNew ? 'Proposer une fiche' : 'Proposer une modification'}</h1>
        <p className="max-w-[65ch] text-olive-800">
          {isNew
            ? "Tu as croisé un lieu, une arme, une créature ou un objet qui n'a pas encore sa fiche ? Décris-le. L'équipe relit chaque proposition ; acceptée, la fiche est créée, tu en es le découvreur et tu gagnes de la renommée. L'image s'ajoute ensuite."
            : "Corrige une erreur, complète une description, ajoute une ligne à la fiche technique. L'équipe relit chaque proposition avant de la publier ; une proposition acceptée te rapporte de la renommée et ton nom apparaît sur la fiche."}
        </p>
      </header>

      <div role="tablist" aria-label="Affichage" className="seg">
        {(
          [
            ['edit', isNew ? 'Écrire' : 'Modifier'],
            ['preview', 'Aperçu'],
            ['diff', 'Changements'],
          ] as const
        )
          .filter(([k]) => !(isNew && k === 'diff'))
          .map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={view === k} className={view === k ? 'is-on' : ''} onClick={() => setView(k)}>
            {l}
          </button>
        ))}
      </div>

      {view === 'edit' && (
        <>
          <div className="card grid gap-4 p-4 sm:p-5">
            {isNew && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="pf-category">Catégorie</label>
                  <select id="pf-category" className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c].singular}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="pf-rarity">Rareté (ton avis)</label>
                  <select id="pf-rarity" className="input" value={rarity} onChange={(e) => setRarity(e.target.value)}>
                    <option value="">Je ne sais pas</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((r) => (
                      <option key={r} value={r}>
                        {r} sur 8
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div>
              <label className="label" htmlFor="pf-title">Nom</label>
              <input id="pf-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
            </div>
            <div>
              <label className="label" htmlFor="pf-summary">Résumé</label>
              <input id="pf-summary" className="input" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={600} />
            </div>
            <div>
              <label className="label" htmlFor="pf-tags">Tags (séparés par des virgules)</label>
              <input id="pf-tags" className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <p className="label">Fiche technique</p>
            <div className="space-y-2">
              {infobox.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input !w-2/5"
                    placeholder="Libellé"
                    aria-label={`Libellé de la ligne ${i + 1}`}
                    value={row.label}
                    onChange={(e) => setInfobox((rs) => rs.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))}
                  />
                  <input
                    className="input"
                    placeholder="Valeur"
                    aria-label={`Valeur de la ligne ${i + 1}`}
                    value={row.value}
                    onChange={(e) => setInfobox((rs) => rs.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))}
                  />
                  <button type="button" className="btn-danger !px-3" aria-label="Retirer la ligne" onClick={() => setInfobox((rs) => rs.filter((_, j) => j !== i))}>
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="btn-ghost mt-3" onClick={() => setInfobox((rs) => [...rs, { label: '', value: '' }])}>
              + Ajouter une ligne
            </button>
          </div>

          <div className="card p-4 sm:p-5">
            <label className="label" htmlFor="pf-content">Texte (markdown)</label>
            <textarea id="pf-content" className="input min-h-[18rem] font-mono text-sm" value={content} onChange={(e) => setContent(e.target.value)} />
            <p className="mt-2 text-xs text-olive-700">
              Les titres <code>##</code> deviennent des sections. Lie une fiche avec <code>[[armes/012]]</code>.
            </p>
          </div>
        </>
      )}

      {view === 'preview' && (
        <div className="card space-y-4 p-5">
          <h2 className="font-typewriter text-3xl text-olive-900">{proposed.title}</h2>
          {proposed.summary && <p className="italic text-olive-800">{proposed.summary}</p>}
          <Markdown toc>{content || '*Rien à afficher.*'}</Markdown>
        </div>
      )}

      {view === 'diff' && (
        <div className="card p-5">
          <ProposalDiff current={current} proposed={proposed} />
        </div>
      )}

      <div className="card p-4 sm:p-5">
        <label className="label" htmlFor="pf-note">Un mot pour l&apos;équipe (facultatif)</label>
        <textarea id="pf-note" className="input min-h-[5rem]" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="D'où vient l'information, ce que tu as corrigé…" />
      </div>

      {error && <p className="font-semibold text-[color:var(--sanguine)]" role="alert">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn" disabled={busy || !proposed.title || (isNew && content.trim().length < 20)}>
          {busy ? 'Envoi…' : 'Envoyer la proposition'}
        </button>
        <Link href={back} className="btn-ghost">
          Annuler
        </Link>
      </div>
    </form>
  );
}
