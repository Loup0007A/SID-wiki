'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/image';
import { removeStoredFile } from '@/lib/storage';
import { CATEGORIES, CATEGORY_LABELS, GEAR_CATEGORIES, GEAR_COLOR_RE, GEAR_SHAPES, GEAR_SHAPE_LABELS, GEAR_SLOT_LABELS, GEAR_TRANSFORM_LIMITS, HELD_SLOTS, pad, type Category, type GearItem, type GearPlacement, type HeldSlot, type InfoRow } from '@/lib/wiki';
import Markdown from './Markdown';
import ModelViewer from './ModelViewer';
import StandFigure from './StandFigure';

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
  /** Apparence sur le porte-armure (null = automatique) — colonnes de la migration 0207 */
  gear_shape: string | null;
  gear_color: string | null;
  /** Placement sur le porte-armure — colonnes de la migration 0209 */
  gear_dx: number;
  gear_dy: number;
  gear_scale: number;
  gear_rot: number;
  /** Placement par emplacement (migration 0210) ; null = colonne absente ou jamais réglé */
  gear_placement: Partial<Record<HeldSlot, Partial<GearPlacement>>> | null;
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

export default function EntryForm({ initial, standImage = null }: { initial: FormEntry; standImage?: string | null }) {
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
  const [pendingModel, setPendingModel] = useState<{ bytes: Uint8Array; previewUrl: string; size: number } | null>(null);
  const [gearShape, setGearShape] = useState<string>(initial.gear_shape ?? '');
  const [gearColor, setGearColor] = useState<string>(initial.gear_color ?? '');
  // Un placement PAR emplacement (main droite, main gauche, dos) : régler l'un ne touche pas les autres.
  // Valeurs de départ : celles de l'emplacement, sinon l'ancien placement commun (migration 0209).
  const initialPlacement = useMemo(() => {
    const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
    const out = {} as Record<HeldSlot, GearPlacement>;
    for (const sl of HELD_SLOTS) {
      const p = initial.gear_placement?.[sl];
      out[sl] = {
        dx: num(p?.dx, initial.gear_dx),
        dy: num(p?.dy, initial.gear_dy),
        scale: num(p?.scale, initial.gear_scale),
        rot: num(p?.rot, initial.gear_rot),
      };
    }
    return out;
  }, [initial]);
  const [placement, setPlacement] = useState(initialPlacement);
  const [previewSlot, setPreviewSlot] = useState<HeldSlot>('main_droite');
  const { dx: gearDx, dy: gearDy, scale: gearScale, rot: gearRot } = placement[previewSlot];
  const setField = (key: keyof GearPlacement) => (v: number) =>
    setPlacement((all) => ({ ...all, [previewSlot]: { ...all[previewSlot], [key]: v } }));
  const setGearDx = setField('dx');
  const setGearDy = setField('dy');
  const setGearScale = setField('scale');
  const setGearRot = setField('rot');
  const [status, setStatus] = useState<string | null>(null);
  const tempImages = useRef<string[]>([]);
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
    const small = await compressImage(file); // WebP, 1600 px max
    const ext = (small.name.split('.').pop() ?? 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${category}/${crypto.randomUUID()}.${ext || 'png'}`;
    const { error } = await supabase.storage.from('wiki-images').upload(path, small, { upsert: false });
    if (error) return setError(error.message);
    const url = supabase.storage.from('wiki-images').getPublicUrl(path).data.publicUrl;
    tempImages.current.push(url);
    setImageUrl(url);
  }

  // Le modèle n'est PAS envoyé tout de suite : on le lit ici, on propose les animations,
  // et c'est à l'enregistrement qu'il est allégé (une seule animation) puis envoyé.
  async function pickModel(file: File) {
    setError(null);
    const lower = file.name.toLowerCase();
    const isFbx = lower.endsWith('.fbx');
    if (!isFbx && !lower.endsWith('.glb')) return setError('Utilise un fichier .glb ou .fbx (modèle 3D avec animations).');
    if (file.size > 50 * 1024 * 1024) return setError('Fichier trop lourd (50 Mo maximum avant allègement).');
    setUploadingModel(true);
    try {
      let bytes: Uint8Array = new Uint8Array(await file.arrayBuffer());
      // Un .fbx est converti en .glb ici même, dans le navigateur ; la suite (choix de l'animation, allègement, envoi) est identique.
      if (isFbx) bytes = await (await import('@/lib/fbx')).fbxToGlb(bytes);
      const { listAnimations } = await import('@/lib/glb');
      const names = await listAnimations(bytes);
      if (pendingModel) URL.revokeObjectURL(pendingModel.previewUrl);
      setPendingModel({ bytes, previewUrl: URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'model/gltf-binary' })), size: bytes.byteLength });
      setAnimNames(names);
      setModelAnimation(names[0] ?? '');
    } catch {
      setError(
        isFbx
          ? 'Impossible de convertir ce .fbx (fichier FBX ASCII très ancien ou invalide ?). Réexporte-le en FBX binaire depuis Blender, ou exporte directement en « glTF Binary ».'
          : 'Impossible de lire ce .glb (fichier compressé Draco ou invalide ?). Réexporte-le depuis Blender en « glTF Binary » sans compression.'
      );
    }
    setUploadingModel(false);
  }

  function removeModel() {
    if (pendingModel) URL.revokeObjectURL(pendingModel.previewUrl);
    setPendingModel(null);
    setModelUrl(null);
    setModelAnimation('');
    setAnimNames([]);
  }

  // Annuler : les images envoyées pendant cette session et jamais enregistrées ne doivent pas rester dans le stockage.
  async function cancel() {
    for (const u of tempImages.current) if (u !== initial.image_url) await removeStoredFile(supabase, 'wiki-images', u);
    if (pendingModel) URL.revokeObjectURL(pendingModel.previewUrl);
    router.back();
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

    // 1) Modèle 3D : on ne garde que l'animation choisie, on purge le reste, puis on envoie.
    let finalModelUrl = modelUrl;
    let uploadedModelUrl: string | null = null;
    // Modèle déjà en ligne : à retraiter s'il reste plusieurs animations, ou si on a choisi « Aucune »
    // alors qu'il en contient encore une (sinon elle continuait de se jouer côté lecteur).
    const needsOptimize = !!pendingModel || (!!modelUrl && (animNames.length > 1 || (animNames.length === 1 && !modelAnimation)));
    if (needsOptimize) {
      try {
        setStatus('Allègement du modèle 3D…');
        let bytes: Uint8Array;
        if (pendingModel) bytes = pendingModel.bytes;
        else {
          const resp = await fetch(modelUrl!);
          if (!resp.ok) throw new Error(`fichier actuel introuvable (${resp.status}). Retire le modèle ou renvoie-le.`);
          bytes = new Uint8Array(await resp.arrayBuffer());
        }
        const { optimizeGlb } = await import('@/lib/glb');
        const res = await optimizeGlb(bytes, modelAnimation || null);
        if (res.lost.length && !confirm(`Ce modèle utilise des réglages de matériau (${res.lost.join(', ')}) que l’allègement ne peut pas conserver. Il sera envoyé tel quel, avec toutes ses animations. Continuer ?`)) {
          throw new Error('envoi annulé.');
        }
        const out = res.bytes;
        const path = `${category}/${crypto.randomUUID()}.glb`;
        setStatus('Envoi du modèle allégé…');
        const { error: upErr } = await supabase.storage
          .from('wiki-models')
          .upload(path, new Blob([out as BlobPart], { type: 'model/gltf-binary' }), { contentType: 'model/gltf-binary', upsert: false });
        if (upErr) throw new Error(upErr.message);
        finalModelUrl = supabase.storage.from('wiki-models').getPublicUrl(path).data.publicUrl;
        uploadedModelUrl = finalModelUrl;
      } catch (err) {
        setStatus(null);
        setSaving(false);
        return setError(`Modèle 3D : ${(err as Error).message}`);
      }
    }
    setStatus('Enregistrement…');

    // Apparence : seulement pour les catégories équipables. Les colonnes n'existent qu'après la migration 0207 :
    // on ne les envoie que si elles ont une valeur ou en avaient une (sinon rien ne change pour un site pas encore migré).
    const equipable = (GEAR_CATEGORIES as readonly string[]).includes(category);
    const nextShape = equipable && gearShape ? gearShape : null;
    const nextColor = equipable && GEAR_COLOR_RE.test(gearColor) ? gearColor.toLowerCase() : null;
    const appearance =
      nextShape !== null || nextColor !== null || initial.gear_shape !== null || initial.gear_color !== null
        ? { gear_shape: nextShape, gear_color: nextColor }
        : {};

    // Placement par emplacement (migration 0210) : envoyé seulement s'il a été modifié.
    const placementPatch =
      equipable && JSON.stringify(placement) !== JSON.stringify(initialPlacement) ? { gear_placement: placement } : {};

    const payload = {
      ...appearance,
      ...placementPatch,
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
      model_url: finalModelUrl,
      model_animation: finalModelUrl && modelAnimation ? modelAnimation : null,
    };

    // Échec de l'enregistrement : le modèle qu'on vient d'envoyer ne sert à rien, on le retire du stockage.
    const fail = async (message: string) => {
      if (uploadedModelUrl) await removeStoredFile(supabase, 'wiki-models', uploadedModelUrl);
      setStatus(null);
      setSaving(false);
      setError(message);
    };
    const dbMessage = (e: { code?: string; message: string }) =>
      e.code === '23505'
        ? `Le numéro ${pad(number)} est déjà pris dans cette catégorie.`
        : (e.code === 'PGRST204' || e.code === '42703') && /gear_/.test(e.message)
          ? 'L’apparence des armes a besoin des migrations supabase/migrations/0207 à 0210 (à exécuter dans le SQL Editor, dans cet ordre).'
          : e.code === '23514' && /gear_shape/.test(e.message)
            ? 'Cette forme a besoin de la migration supabase/migrations/0208_wiki_gear_more_shapes.sql (à exécuter dans le SQL Editor).'
          : e.message;

    let id = initial.id;
    if (isNew) {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('wiki_entries')
        .insert({ ...payload, created_by: u.user?.id ?? null })
        .select('id')
        .single();
      if (error) return fail(dbMessage(error));
      id = data.id;
    } else {
      const { error } = await supabase.from('wiki_entries').update(payload).eq('id', id!);
      if (error) return fail(dbMessage(error));
    }

    // Liens : on repart de zéro pour cette fiche, puis on réinsère.
    await supabase.from('wiki_entry_links').delete().eq('from_id', id!);
    await supabase.from('wiki_entry_links').delete().eq('to_id', id!);
    if (links.length) {
      const { error } = await supabase.from('wiki_entry_links').insert(links.map((l) => ({ from_id: id!, to_id: l.id })));
      if (error) {
        setStatus(null);
        setSaving(false);
        return setError(`Fiche enregistrée, mais liens en erreur : ${error.message}`);
      }
    }

    // Ménage dans le Storage : on supprime ce qui n'est plus utilisé (ancien modèle, anciennes images, brouillons).
    if (initial.model_url && initial.model_url !== finalModelUrl) await removeStoredFile(supabase, 'wiki-models', initial.model_url);
    if (initial.image_url && initial.image_url !== imageUrl) await removeStoredFile(supabase, 'wiki-images', initial.image_url);
    for (const u of tempImages.current) if (u !== imageUrl) await removeStoredFile(supabase, 'wiki-images', u);
    if (pendingModel) URL.revokeObjectURL(pendingModel.previewUrl);

    router.push(`/${category}/${pad(number)}`);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-4xl space-y-5">
      <h1 className="title-grad font-typewriter text-2xl font-bold text-olive-800 sm:text-3xl">
        {isNew ? 'Nouvelle fiche' : `Modifier ${initial.category} ${pad(initial.number)}`}
      </h1>

      <div className="card grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
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
          <input className="input" type="number" min={0} max={999} value={Number.isNaN(number) ? '' : number} onChange={(e) => setNumber(parseInt(e.target.value, 10))} />
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
          <div className="min-h-[16rem] rounded-xl border border-white/15 bg-white/[0.07] p-3">
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
        <label className="label">Modèle 3D animé (.glb ou .fbx) — idéal pour les skills ✨</label>
        <div className="flex flex-wrap items-center gap-3">
          <input type="file" accept=".glb,.fbx,model/gltf-binary" onChange={(e) => e.target.files?.[0] && pickModel(e.target.files[0])} disabled={uploadingModel || saving} />
          {uploadingModel && <span className="text-sm italic">Lecture du fichier…</span>}
          {(modelUrl || pendingModel) && (
            <button type="button" className="btn-danger !px-3 !py-0.5" onClick={removeModel}>
              Retirer le modèle
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-olive-700">
          Formats GLB (export Blender « glTF 2.0 → glTF Binary », Sketchfab) ou FBX (Mixamo, Blender…, converti automatiquement en GLB), 50 Mo max. À l’enregistrement, le site{' '}
          <strong>ne garde que l’animation choisie</strong>, supprime les autres ainsi que les caméras et tout objet inutilisé, puis supprime l’ancien fichier du stockage.
        </p>

        {(modelUrl || pendingModel) && (
          <div className="mt-4 space-y-3">
            <ModelViewer
              src={pendingModel ? pendingModel.previewUrl : modelUrl!}
              animation={modelAnimation || null}
              onAnimations={(n) => setAnimNames((prev) => (prev.length ? prev : n))}
              showAnimationPicker={false}
            />
            {pendingModel && <p className="text-xs text-olive-700">Fichier d’origine : {(pendingModel.size / 1024 / 1024).toFixed(1)} Mo (sera allégé à l’enregistrement).</p>}
            <div>
              <label className="label">Animation conservée (les autres seront supprimées)</label>
              <select className="input" value={modelAnimation} onChange={(e) => setModelAnimation(e.target.value)}>
                <option value="">Aucune (modèle fixe — supprime toutes les animations)</option>
                {animNames.map((a) => (
                  <option key={a} value={a}>🎬 {a}</option>
                ))}
              </select>
              {animNames.length === 0 && <p className="mt-1 text-xs text-olive-700">Aucune animation dans ce modèle : le visiteur pourra juste le faire tourner.</p>}
              {!pendingModel && animNames.length > 1 && (
                <p className="mt-1 text-xs text-brass-300">Ce modèle contient {animNames.length} animations : à l’enregistrement, seule « {modelAnimation || 'aucune'} » sera conservée.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {(GEAR_CATEGORIES as readonly string[]).includes(category) && (
        <div className="card p-5">
          <label className="label">Apparence sur le porte-armure (onglet Profils)</label>
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex-none rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-sky-400/[0.06] px-3 py-2">
              <StandFigure
                className="h-64 w-auto"
                standImage={standImage}
                gear={[
                  {
                    slot: previewSlot,
                    category,
                    number,
                    discovered: true,
                    title: title || null,
                    summary: null,
                    image_url: null,
                    rarity: rarity ? parseInt(rarity, 10) : null,
                    shape: gearShape || null,
                    color: gearColor || null,
                    dx: gearDx,
                    dy: gearDy,
                    scale: gearScale,
                    rot: gearRot,
                  } satisfies GearItem,
                ]}
              />
            </div>
            <div className="min-w-[14rem] flex-1 space-y-4">
              <div>
                <label className="label" htmlFor="gear-shape">Forme (en main et dans le dos)</label>
                <select id="gear-shape" className="input" value={gearShape} onChange={(e) => setGearShape(e.target.value)}>
                  <option value="">Automatique (devinée d’après le titre)</option>
                  {GEAR_SHAPES.map((s) => (
                    <option key={s} value={s}>{GEAR_SHAPE_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="gear-color">Couleur</label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    id="gear-color"
                    type="color"
                    className="h-10 w-14 cursor-pointer rounded-lg border border-white/20 bg-transparent"
                    value={GEAR_COLOR_RE.test(gearColor) ? gearColor : '#9db3c9'}
                    onChange={(e) => setGearColor(e.target.value)}
                  />
                  <span className="font-typewriter text-sm text-olive-800">{gearColor || 'Automatique (rareté ★)'}</span>
                  {gearColor && (
                    <button type="button" className="btn-ghost !px-3 !py-0.5" onClick={() => setGearColor('')}>
                      Remettre en automatique
                    </button>
                  )}
                </div>
              </div>
              <div>
                <span className="label">Placement et taille — {GEAR_SLOT_LABELS[previewSlot].label}</span>
                <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                  {(
                    [
                      ['Horizontal', gearDx, setGearDx, -GEAR_TRANSFORM_LIMITS.offset, GEAR_TRANSFORM_LIMITS.offset, 1, (v: number) => `${v > 0 ? '+' : ''}${v}`],
                      ['Vertical', gearDy, setGearDy, -GEAR_TRANSFORM_LIMITS.offset, GEAR_TRANSFORM_LIMITS.offset, 1, (v: number) => `${v > 0 ? '+' : ''}${v}`],
                      ['Taille', gearScale, setGearScale, GEAR_TRANSFORM_LIMITS.scaleMin, GEAR_TRANSFORM_LIMITS.scaleMax, 0.05, (v: number) => `× ${v.toFixed(2)}`],
                      ['Rotation', gearRot, setGearRot, -GEAR_TRANSFORM_LIMITS.rot, GEAR_TRANSFORM_LIMITS.rot, 1, (v: number) => `${v}°`],
                    ] as const
                  ).map(([name, value, set, min, max, step, fmt]) => (
                    <label key={name} className="block text-sm">
                      <span className="flex justify-between font-bold text-olive-800">
                        {name} <span className="font-typewriter font-normal">{fmt(value)}</span>
                      </span>
                      <input type="range" className="w-full" min={min} max={max} step={step} value={value} onChange={(e) => set(parseFloat(e.target.value))} />
                    </label>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-olive-800">Emplacement réglé :</span>
                  {HELD_SLOTS.map((sl) => (
                    <button key={sl} type="button" onClick={() => setPreviewSlot(sl)} aria-pressed={previewSlot === sl} className={previewSlot === sl ? 'btn !min-h-[2rem] !px-3 !py-0.5 text-sm' : 'btn-ghost !min-h-[2rem] !px-3 !py-0.5 text-sm'}>
                      {GEAR_SLOT_LABELS[sl].label}
                    </button>
                  ))}
                  {(gearDx !== 0 || gearDy !== 0 || gearScale !== 1 || gearRot !== 0) && (
                    <button
                      type="button"
                      className="btn-ghost !min-h-[2rem] !px-3 !py-0.5 text-sm"
                      onClick={() => setPlacement((all) => ({ ...all, [previewSlot]: { dx: 0, dy: 0, scale: 1, rot: 0 } }))}
                    >
                      Réinitialiser cet emplacement
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-olive-700">
                Ces réglages valent pour tous les profils qui portent cette fiche. Chaque emplacement (main droite, main gauche, dos) a son propre placement : choisis-le ci-dessus puis règle les curseurs. La couleur s’applique aussi aux pièces d’armure ; forme, placement et taille ne comptent que pour les mains et le dos.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card p-5">
        <label className="label">Image</label>
        <div className="flex flex-wrap items-center gap-3">
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-20 w-20 rounded-lg border border-white/15 object-cover" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = ''; // permet de renvoyer le même fichier après « Retirer »
              if (file) uploadImage(file);
            }}
          />
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
            <span key={l.id} className="inline-flex items-center gap-1 rounded-full bg-brass-400/20 text-brass-300 px-3 py-1 text-sm">
              {l.category} {pad(l.number)} · {l.title}
              <button type="button" aria-label="Retirer" className="font-bold text-stamp" onClick={() => setLinks((ls) => ls.filter((x) => x.id !== l.id))}>
                ×
              </button>
            </span>
          ))}
        </div>
        <input className="input" placeholder="Chercher une fiche par titre…" value={q} onChange={(e) => searchCandidates(e.target.value)} />
        {candidates.length > 0 && (
          <ul className="mt-2 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/15 bg-white/[0.09]">
            {candidates.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="w-full p-2 text-left text-sm hover:bg-white/[0.12]"
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
            <ul className="mt-3 divide-y divide-white/10">
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

      <div className="card sticky bottom-[4.5rem] z-30 flex gap-3 p-3 md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
        <button className="btn flex-1 md:flex-none" disabled={saving || uploadingModel}>{saving ? (status ?? 'Enregistrement…') : 'Enregistrer'}</button>
        <button type="button" className="btn-ghost flex-1 md:flex-none" disabled={saving} onClick={cancel}>Annuler</button>
      </div>
    </form>
  );
}
