'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CATEGORIES, CATEGORY_LABELS, pad, type Category } from '@/lib/wiki';
import Markdown from './Markdown';

export type LinkedEntry = { id: string; category: Category; number: number; title: string };

export type FormEntry = {
  id: string | null;
  category: Category;
  number: number;
  title: string;
  summary: string;
  content: string;
  image_url: string | null;
  tags: string[];
  discovered: boolean;
  discovered_by: string | null;
  links: LinkedEntry[];
};

export default function EntryForm({ initial }: { initial: FormEntry }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const isNew = initial.id === null;

  const [category, setCategory] = useState<Category>(initial.category);
  const [number, setNumber] = useState<number>(initial.number);
  const [title, setTitle] = useState(initial.title);
  const [summary, setSummary] = useState(initial.summary);
  const [content, setContent] = useState(initial.content);
  const [imageUrl, setImageUrl] = useState<string | null>(initial.image_url);
  const [tags, setTags] = useState(initial.tags.join(', '));
  const [discovered, setDiscovered] = useState(initial.discovered);
  const [discoveredBy, setDiscoveredBy] = useState<string>(initial.discovered_by ?? '');
  const [members, setMembers] = useState<{ id: string; nickname: string }[]>([]);
  const [links, setLinks] = useState<LinkedEntry[]>(initial.links);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sélecteur de fiches à lier
  const [q, setQ] = useState('');
  const [candidates, setCandidates] = useState<LinkedEntry[]>([]);

  useEffect(() => {
    supabase.rpc('wiki_members').then(({ data }) => setMembers((data ?? []) as { id: string; nickname: string }[]));
  }, [supabase]);

  async function searchCandidates(value: string) {
    setQ(value);
    const v = value.trim();
    if (v.length < 1) return setCandidates([]);
    const safe = v.replace(/[%_,()\\]/g, ' ');
    const { data } = await supabase
      .from('wiki_entries')
      .select('id, category, number, title')
      .ilike('title', `%${safe}%`)
      .limit(8);
    setCandidates(((data ?? []) as LinkedEntry[]).filter((c) => c.id !== initial.id && !links.some((l) => l.id === c.id)));
  }

  async function uploadImage(file: File) {
    setError(null);
    const ext = (file.name.split('.').pop() ?? 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${category}/${crypto.randomUUID()}.${ext || 'png'}`;
    const { error } = await supabase.storage.from('wiki-images').upload(path, file, { upsert: false });
    if (error) return setError(error.message);
    setImageUrl(supabase.storage.from('wiki-images').getPublicUrl(path).data.publicUrl);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!Number.isInteger(number) || number < 0 || number > 999) return setError('Le numéro doit être entre 000 et 999.');
    if (!title.trim()) return setError('Le titre est obligatoire.');

    setSaving(true);
    const payload = {
      category,
      number,
      title: title.trim(),
      summary: summary.trim(),
      content,
      image_url: imageUrl,
      tags: Array.from(new Set(tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))),
      discovered,
      discovered_by: discoveredBy || null,
    };

    let id = initial.id;
    if (isNew) {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('wiki_entries')
        .insert({ ...payload, created_by: u.user?.id ?? null })
        .select('id')
        .single();
      if (error) {
        setSaving(false);
        return setError(error.code === '23505' ? `Le numéro ${pad(number)} est déjà pris dans cette catégorie.` : error.message);
      }
      id = data.id;
    } else {
      const { error } = await supabase.from('wiki_entries').update(payload).eq('id', id!);
      if (error) {
        setSaving(false);
        return setError(error.code === '23505' ? `Le numéro ${pad(number)} est déjà pris dans cette catégorie.` : error.message);
      }
    }

    // Liens : on repart de zéro pour cette fiche (sortants), puis on réinsère.
    // Les liens entrants sont retirés si l'admin a supprimé la relation ici.
    await supabase.from('wiki_entry_links').delete().eq('from_id', id!);
    await supabase.from('wiki_entry_links').delete().eq('to_id', id!);
    if (links.length) {
      const { error } = await supabase
        .from('wiki_entry_links')
        .insert(links.map((l) => ({ from_id: id!, to_id: l.id })));
      if (error) {
        setSaving(false);
        return setError(`Fiche enregistrée, mais liens en erreur : ${error.message}`);
      }
    }

    router.push(`/${category}/${pad(number)}`);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-4xl space-y-5">
      <h1 className="font-typewriter text-3xl font-bold text-olive-800">
        {isNew ? 'Nouvelle fiche' : `Modifier ${category} ${pad(initial.number)}`}
      </h1>

      <div className="card grid gap-4 p-5 sm:grid-cols-3">
        <div>
          <label className="label">Catégorie</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Numéro (0–999)</label>
          <input className="input" type="number" min={0} max={999} value={number} onChange={(e) => setNumber(parseInt(e.target.value, 10))} />
        </div>
        <label className="flex items-end gap-2 pb-2">
          <input type="checkbox" checked={discovered} onChange={(e) => setDiscovered(e.target.checked)} className="h-5 w-5" />
          <span className="font-typewriter text-sm">Découvert</span>
        </label>

        <div className="sm:col-span-3">
          <label className="label">Découvert par (facultatif — affiché « Découvert par @pseudo »)</label>
          <select className="input" value={discoveredBy} onChange={(e) => setDiscoveredBy(e.target.value)}>
            <option value="">Personne / anonyme</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>@{m.nickname}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <label className="label">Titre</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="sm:col-span-3">
          <label className="label">Résumé (aperçu au survol et listes)</label>
          <input className="input" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={300} />
        </div>
        <div className="sm:col-span-3">
          <label className="label">Tags (séparés par des virgules)</label>
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="rare, magique, danger" />
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-2 flex items-center justify-between">
          <label className="label !mb-0">Contenu (markdown)</label>
          <button type="button" className="btn-ghost !px-2 !py-1" onClick={() => setPreview((p) => !p)}>
            {preview ? 'Éditer' : 'Aperçu'}
          </button>
        </div>
        {preview ? (
          <div className="min-h-[16rem] rounded border-2 border-olive-800/30 p-3">
            <Markdown>{content || '*Rien à afficher.*'}</Markdown>
          </div>
        ) : (
          <textarea className="input min-h-[16rem] font-typewriter text-sm" value={content} onChange={(e) => setContent(e.target.value)} />
        )}
        <p className="mt-2 text-xs text-olive-700">
          Markdown complet (tableaux, **gras**…). Les titres <code>##</code> / <code>###</code> deviennent des sections numérotées avec sommaire. Mentionne un chasseur avec <code>@pseudo</code>. Lie une fiche avec <code>[[armes/012]]</code> ou{' '}
          <code>[[armes/012|texte affiché]]</code> : un aperçu apparaît au survol.
        </p>
      </div>

      <div className="card p-5">
        <label className="label">Image</label>
        <div className="flex flex-wrap items-center gap-3">
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-20 w-20 rounded border object-cover" />
          )}
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
          {imageUrl && (
            <button type="button" className="btn-ghost !px-2 !py-1" onClick={() => setImageUrl(null)}>
              Retirer
            </button>
          )}
        </div>
      </div>

      <div className="card p-5">
        <label className="label">Fiches liées (« Voir aussi »)</label>
        <div className="mb-3 flex flex-wrap gap-2">
          {links.length === 0 && <span className="text-sm italic text-olive-700">Aucune.</span>}
          {links.map((l) => (
            <span key={l.id} className="inline-flex items-center gap-1 rounded bg-brass-300/50 px-2 py-1 text-sm">
              {l.category} {pad(l.number)} · {l.title}
              <button type="button" aria-label="Retirer" className="font-bold text-stamp" onClick={() => setLinks((ls) => ls.filter((x) => x.id !== l.id))}>
                ×
              </button>
            </span>
          ))}
        </div>
        <input className="input" placeholder="Chercher une fiche par titre…" value={q} onChange={(e) => searchCandidates(e.target.value)} />
        {candidates.length > 0 && (
          <ul className="mt-2 divide-y divide-olive-800/20 rounded border-2 border-olive-800/30">
            {candidates.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="w-full p-2 text-left text-sm hover:bg-kraft-200"
                  onClick={() => {
                    setLinks((ls) => [...ls, c]);
                    setCandidates([]);
                    setQ('');
                  }}
                >
                  {c.category} {pad(c.number)} · {c.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-stamp">{error}</p>}

      <div className="flex gap-3">
        <button className="btn" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        <button type="button" className="btn-ghost" onClick={() => router.back()}>Annuler</button>
      </div>
    </form>
  );
}
