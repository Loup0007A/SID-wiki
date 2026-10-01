'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CATEGORIES, CATEGORY_LABELS, pad, type Category, type InfoRow } from '@/lib/wiki';
import Markdown from './Markdown';
import ModelViewer from './ModelViewer';

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
  rarity: number | null;
  infobox: InfoRow[];
  model_url: string | null;
  model_animation: string | null;
  links: LinkedEntry[];
};

type Revision = {
  id: string;
  created_at: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  infobox: InfoRow[];
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
  const [rarity, setRarity] = useState<string>(initial.rarity ? String(initial.rarity) : '');
  const [infobox, setInfobox] = useState<InfoRow[]>(initial.infobox);
  const [modelUrl, setModelUrl] = useState<string | null>(initial.model_url);
  const [modelAnimation, setModelAnimation] = useState<string>(initial.model_animation ?? '');
  const [animNames, setAnimNames] = useState<string[]>([]);
  const [uploadingModel, setUploadingModel] = useState(false);
  const [links, setLinks] = useState<LinkedEntry[]>(initial.links);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sélecteur de fiches à lier
  const [q, setQ] = useState('');
  const [candidates, setCandidates] = useState<LinkedEntry[]>([]);

  useEffect(() => {
    supabase.rpc('wiki_members').then(({ data }) => setMembers((data ?? []) as { id: string; nickname: string }[]));
  }, [supabase]);

  useEffect(() => {
    if (!initial.id) return;
    supabase
      .from('wiki_revisions')
      .select('id, created_at, title, summary, content, tags, infobox')
      .eq('entry_id', initial.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setRevisions((data ?? []) as Revision[]));
  }, [supabase, initial.id]);

  async function searchCandidates(value: string) {
    setQ(value);
    const v = value.trim();
    if (v.length < 1) return setCandidates([]);
    const safe = v.replace(/[%_,()\\]/g, ' ');
    const { data } = await supabase.from('wiki_entries').select('id, category, number, title').ilike('title', `%${safe}%`).limit(8);
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

  async function uploadModel(file: File) {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.glb')) return setError('Utilise un fichier .glb (modèle 3D avec textures et animations intégrées).');
    if (file.size > 50 * 1024 * 1024) return setError('Modèle trop lourd (50 Mo maximum).');
    setUploadingModel(true);
    const path = `${category}/${crypto.randomUUID()}.glb`;
    const { error } = await supabase.storage.from('wiki-models').upload(path, file, { contentType: 'model/gltf-binary', upsert: false });
    setUploadingModel(false);
    if (error) return setError(error.message);
    setModelUrl(supabase.storage.from('wiki-models').getPublicUrl(path).data.publicUrl);
    setModelAnimation('');
    setAnimNames([]);
  }

  function restore(r: Revision) {
    if (!confirm('Remplacer le titre, résumé, contenu, tags et fiche technique du formulaire par cette version ? (rien n’est enregistré tant que tu ne cliques pas sur Enregistrer)')) return;
    setTitle(r.title);
    setSummary(r.summary);
    setContent(r.content);
    setTags(r.tags.join(', '));
    setInfobox(r.infobox ?? []);
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
      rarity: rarity ? parseInt(rarity, 10) : null,
      infobox: infobox.map((r) => ({ label: r.label.trim(), value: r.value.trim() })).filter((r) => r.label),
      model_url: modelUrl,
      model_animation: modelUrl && modelAnimation ? modelAnimation : null,
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

    // Liens : on repart de zéro pour cette fiche, puis on réinsère.
    await supabase.from('wiki_entry_links').delete().eq('from_id', id!);
    await supabase.from('wiki_entry_links').delete().eq('to_id', id!);
    if (links.length) {
      const { error } = await supabase.from('wiki_entry_links').insert(links.map((l) => ({ from_id: id!, to_id: l.id })));
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
              <option key={c} value={c}>{CATEGORY_LABELS[c].icon} {CATEGORY_LABELS[c].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Numéro (0–999)</label>
          <input className="input" type="number" min={0} max={999} value={number} onChange={(e) => setNumber(parseInt(e.target.value, 10))} />
        </div>
        <label className="flex items-end gap-2 pb-2">
          <input type="checkbox" checked={discovered} onChange={(e) => setDiscovered(e.target.checked)} className="h-5 w-5" />
          <span className="font-typewriter text-sm font-bold">Découvert</span>
        </label>

        <div className="sm:col-span-2">
          <label className="label">Découvert par (facultatif — affiché « Découvert par @pseudo »)</label>
          <select className="input" value={discoveredBy} onChange={(e) => setDiscoveredBy(e.target.value)}>
            <option value="">Personne / anonyme</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>@{m.nickname}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Rareté</label>
          <select className="input" value={rarity} onChange={(e) => setRarity(e.target.value)}>
            <option value="">— Aucune —</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>
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
        <label className="label">Fiche technique (encadré à droite : PV, dégâts, élément, faiblesse…)</label>
        <div className="space-y-2">
          {infobox.map((row, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="input !w-2/5"
                placeholder="Libellé"
                value={row.label}
                onChange={(e) => setInfobox((rs) => rs.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))}
              />
              <input
                className="input"
                placeholder="Valeur"
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

      <div className="card p-5">
        <div className="mb-2 flex items-center justify-between">
          <label className="label !mb-0">Contenu (markdown)</label>
          <button type="button" className="btn-ghost !px-3 !py-0.5" onClick={() => setPreview((p) => !p)}>
            {preview ? 'Éditer' : 'Aperçu'}
          </button>
        </div>
        {preview ? (
          <div className="min-h-[16rem] rounded-xl border border-white/80 bg-white/40 p-3">
            <Markdown toc>{content || '*Rien à afficher.*'}</Markdown>
          </div>
        ) : (
          <textarea className="input min-h-[16rem] font-mono text-sm" value={content} onChange={(e) => setContent(e.target.value)} />
        )}
        <p className="mt-2 text-xs text-olive-700">
          Markdown complet (tableaux, **gras**…). Les titres <code>##</code> / <code>###</code> deviennent des sections numérotées avec sommaire. Mentionne un chasseur avec <code>@pseudo</code>. Lie une fiche avec{' '}
          <code>[[armes/012]]</code> ou <code>[[skills/003|texte affiché]]</code> : un aperçu apparaît au survol.
        </p>
      </div>

      <div className="card p-5">
        <label className="label">Modèle 3D animé (.glb) — idéal pour les skills ✨</label>
        <div className="flex flex-wrap items-center gap-3">
          <input type="file" accept=".glb,model/gltf-binary" onChange={(e) => e.target.files?.[0] && uploadModel(e.target.files[0])} disabled={uploadingModel} />
          {uploadingModel && <span className="text-sm italic">Envoi en cours…</span>}
          {modelUrl && (
            <button
              type="button"
              className="btn-danger !px-3 !py-0.5"
              onClick={() => {
                setModelUrl(null);
                setModelAnimation('');
                setAnimNames([]);
              }}
            >
              Retirer le modèle
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-olive-700">
          Format GLB uniquement (textures et animations intégrées), 50 Mo max. Exporte-le depuis Blender (« glTF 2.0 → .glb ») ou récupère-le sur Mixamo / Sketchfab.
        </p>

        {modelUrl && (
          <div className="mt-4 space-y-3">
            <ModelViewer src={modelUrl} animation={modelAnimation || null} onAnimations={setAnimNames} showAnimationPicker={false} />
            <div>
              <label className="label">Animation lancée à l’ouverture de la fiche</label>
              <select className="input" value={modelAnimation} onChange={(e) => setModelAnimation(e.target.value)}>
                <option value="">Par défaut (première animation)</option>
                {animNames.map((a) => (
                  <option key={a} value={a}>🎬 {a}</option>
                ))}
              </select>
              {animNames.length === 0 && <p className="mt-1 text-xs text-olive-700">Aucune animation détectée dans ce modèle (le visiteur pourra juste le faire tourner).</p>}
            </div>
          </div>
        )}
      </div>

      <div className="card p-5">
        <label className="label">Image</label>
        <div className="flex flex-wrap items-center gap-3">
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-20 w-20 rounded-lg border border-white/70 object-cover" />
          )}
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
          {imageUrl && (
            <button type="button" className="btn-ghost !px-3 !py-0.5" onClick={() => setImageUrl(null)}>
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
            <span key={l.id} className="inline-flex items-center gap-1 rounded-full bg-brass-300/60 px-3 py-1 text-sm">
              {l.category} {pad(l.number)} · {l.title}
              <button type="button" aria-label="Retirer" className="font-bold text-stamp" onClick={() => setLinks((ls) => ls.filter((x) => x.id !== l.id))}>
                ×
              </button>
            </span>
          ))}
        </div>
        <input className="input" placeholder="Chercher une fiche par titre…" value={q} onChange={(e) => searchCandidates(e.target.value)} />
        {candidates.length > 0 && (
          <ul className="mt-2 divide-y divide-white/70 overflow-hidden rounded-xl border border-white/80 bg-white/50">
            {candidates.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="w-full p-2 text-left text-sm hover:bg-white/70"
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

      {!isNew && (
        <details className="card p-5">
          <summary className="cursor-pointer font-typewriter font-bold text-olive-800">🕘 Historique des versions ({revisions.length})</summary>
          {revisions.length === 0 ? (
            <p className="mt-3 text-sm italic text-olive-700">Aucune ancienne version : elles sont conservées automatiquement à chaque modification du titre, résumé, contenu, tags ou fiche technique.</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/70">
              {revisions.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>
                    <span className="font-bold">{new Date(r.created_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    <span className="ml-2 text-olive-700">« {r.title} » — {r.content.length} caractères</span>
                  </span>
                  <button type="button" className="btn-ghost !px-3 !py-0.5" onClick={() => restore(r)}>
                    Restaurer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </details>
      )}

      {error && <p className="text-stamp">{error}</p>}

      <div className="flex gap-3">
        <button className="btn" disabled={saving || uploadingModel}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        <button type="button" className="btn-ghost" onClick={() => router.back()}>Annuler</button>
      </div>
    </form>
  );
}
