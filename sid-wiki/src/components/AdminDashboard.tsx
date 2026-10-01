'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CATEGORIES, CATEGORY_LABELS, pad, type Category } from '@/lib/wiki';

type Row = {
  id: string;
  category: Category;
  number: number;
  title: string;
  tags: string[];
  discovered: boolean;
  model_url: string | null;
  rarity: number | null;
};

type ImportRow = {
  category: Category;
  number: number;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  infobox: { label: string; value: string }[];
  rarity: number | null;
  discovered: boolean;
  image_url: string | null;
  model_url: string | null;
  model_animation: string | null;
};

const EXPORT_COLUMNS =
  'category, number, title, summary, content, tags, infobox, rarity, discovered, image_url, model_url, model_animation';

function parseImport(raw: unknown, defaultCategory: Category): { rows: ImportRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: ImportRow[] = [];
  if (!Array.isArray(raw)) return { rows, errors: ['Le fichier doit contenir une liste JSON ( [ … ] ).'] };

  raw.forEach((r, i) => {
    const where = `Ligne ${i + 1}`;
    if (typeof r !== 'object' || r === null) return errors.push(`${where} : objet attendu.`);
    const o = r as Record<string, unknown>;
    const category = (o.category ?? defaultCategory) as string;
    if (!(CATEGORIES as readonly string[]).includes(category)) return errors.push(`${where} : catégorie « ${category} » inconnue.`);
    const number = Number(o.number);
    if (!Number.isInteger(number) || number < 0 || number > 999) return errors.push(`${where} : numéro invalide (0–999).`);
    if (typeof o.title !== 'string' || !o.title.trim()) return errors.push(`${where} : titre manquant.`);
    const rarity = o.rarity == null ? null : Number(o.rarity);
    if (rarity !== null && (!Number.isInteger(rarity) || rarity < 1 || rarity > 8)) return errors.push(`${where} : rareté entre 1 et 8.`);

    rows.push({
      category: category as Category,
      number,
      title: o.title.trim(),
      summary: typeof o.summary === 'string' ? o.summary : '',
      content: typeof o.content === 'string' ? o.content : '',
      tags: Array.isArray(o.tags) ? o.tags.filter((t): t is string => typeof t === 'string').map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
      infobox: Array.isArray(o.infobox)
        ? o.infobox
            .filter((x): x is { label: string; value: string } => typeof x?.label === 'string' && typeof x?.value === 'string')
            .map((x) => ({ label: x.label, value: x.value }))
        : [],
      rarity,
      discovered: o.discovered === true,
      image_url: typeof o.image_url === 'string' ? o.image_url : null,
      model_url: typeof o.model_url === 'string' ? o.model_url : null,
      model_animation: typeof o.model_animation === 'string' ? o.model_animation : null,
    });
  });
  return { rows, errors };
}

export default function AdminDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const [category, setCategory] = useState<Category>('lieux');
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    const { data, error } = await supabase
      .from('wiki_entries')
      .select('id, category, number, title, tags, discovered, model_url, rarity')
      .eq('category', category)
      .order('number');
    if (error) setError(error.message);
    else {
      setError(null);
      setRows((data ?? []) as Row[]);
    }
    setLoading(false);
  }, [supabase, category]);

  useEffect(() => {
    load();
  }, [load]);

  const f = filter.trim().toLowerCase();
  const shown = f
    ? rows.filter((r) => r.title.toLowerCase().includes(f) || pad(r.number).includes(f) || r.tags.some((t) => t.toLowerCase().includes(f)))
    : rows;
  const found = rows.filter((r) => r.discovered).length;
  const allShownSelected = shown.length > 0 && shown.every((r) => selected.has(r.id));

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAll() {
    setSelected(allShownSelected ? new Set() : new Set(shown.map((r) => r.id)));
  }

  async function setDiscovered(ids: string[], value: boolean) {
    setInfo(null);
    const { error } = await supabase.from('wiki_entries').update({ discovered: value }).in('id', ids);
    if (error) return setError(error.message);
    setError(null);
    setRows((rs) => rs.map((r) => (ids.includes(r.id) ? { ...r, discovered: value } : r)));
    setInfo(`${ids.length} fiche${ids.length > 1 ? 's' : ''} ${value ? 'découverte' : 'masquée'}${ids.length > 1 ? 's' : ''}.`);
  }

  async function removeMany(ids: string[]) {
    const label = ids.length === 1 ? rows.find((r) => r.id === ids[0])?.title ?? 'cette fiche' : `${ids.length} fiches`;
    if (!confirm(`Supprimer définitivement ${label} ? (commentaires, favoris et historique compris)`)) return;
    const { error } = await supabase.from('wiki_entries').delete().in('id', ids);
    if (error) return setError(error.message);
    setError(null);
    setRows((rs) => rs.filter((r) => !ids.includes(r.id)));
    setSelected(new Set());
  }

  async function exportJson() {
    const { data, error } = await supabase.from('wiki_entries').select(EXPORT_COLUMNS).eq('category', category).order('number');
    if (error) return setError(error.message);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `wiki-${category}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importJson(file: File) {
    setInfo(null);
    let raw: unknown;
    try {
      raw = JSON.parse(await file.text());
    } catch {
      return setError('Fichier JSON invalide.');
    }
    const { rows: parsed, errors } = parseImport(raw, category);
    if (errors.length) return setError(errors.slice(0, 5).join(' ') + (errors.length > 5 ? ` … (+${errors.length - 5})` : ''));
    if (parsed.length === 0) return setError('Rien à importer.');
    if (!confirm(`Importer ${parsed.length} fiche(s) ? Les fiches existantes avec le même numéro seront mises à jour.`)) return;

    const { error } = await supabase.from('wiki_entries').upsert(parsed, { onConflict: 'category,number' });
    if (error) return setError(error.message);
    setError(null);
    setInfo(`${parsed.length} fiche(s) importée(s).`);
    load();
  }

  const selIds = Array.from(selected);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-typewriter text-2xl font-bold text-olive-800 sm:text-3xl">🛠 Dashboard</h1>
        <Link href={`/admin/edit/${category}/new`} className="btn">
          + Nouvelle fiche
        </Link>
      </div>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&>*]:shrink-0 [&>*]:whitespace-nowrap">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCategory(c)} className={c === category ? 'btn' : 'btn-ghost'}>
            {CATEGORY_LABELS[c].icon} {CATEGORY_LABELS[c].label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input className="input max-w-xs" placeholder="Filtrer (titre, n°, tag)…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <span className="text-sm text-olive-700">
          {found} / {rows.length} découverts (max 1000 par catégorie)
        </span>
        <span className="ml-auto flex flex-wrap gap-2">
          <button className="btn-ghost !px-3 !py-0.5" onClick={exportJson}>⬇ Exporter JSON</button>
          <label className="btn-ghost !px-3 !py-0.5 cursor-pointer">
            ⬆ Importer JSON
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) importJson(file);
              }}
            />
          </label>
        </span>
      </div>

      {selected.size > 0 && (
        <div className="card mb-3 flex flex-wrap items-center gap-2 p-3">
          <strong className="font-typewriter">{selected.size} sélectionnée{selected.size > 1 ? 's' : ''}</strong>
          <button className="btn !px-3 !py-0.5" onClick={() => setDiscovered(selIds, true)}>Découvrir</button>
          <button className="btn-ghost !px-3 !py-0.5" onClick={() => setDiscovered(selIds, false)}>Masquer</button>
          <button className="btn-danger !px-3 !py-0.5" onClick={() => removeMany(selIds)}>Supprimer</button>
          <button className="btn-ghost !px-3 !py-0.5" onClick={() => setSelected(new Set())}>Annuler</button>
        </div>
      )}

      {error && <p className="mb-3 text-stamp">{error}</p>}
      {info && <p className="mb-3 font-bold text-olive-700">{info}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[22rem] text-left text-sm">
          <thead className="border-b border-white/70 font-typewriter">
            <tr>
              <th className="p-2">
                <input type="checkbox" checked={allShownSelected} onChange={toggleAll} aria-label="Tout sélectionner" />
              </th>
              <th className="p-2">N°</th>
              <th className="p-2">Titre</th>
              <th className="hidden p-2 md:table-cell">Tags</th>
              <th className="p-2">Statut</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="p-4 italic">Chargement…</td>
              </tr>
            )}
            {!loading && shown.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 italic">Aucune fiche.</td>
              </tr>
            )}
            {shown.map((r) => (
              <tr key={r.id} className="border-b border-white/50">
                <td className="p-2">
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Sélectionner ${r.title}`} />
                </td>
                <td className="p-2 font-typewriter">{pad(r.number)}</td>
                <td className="p-2 font-semibold">
                  {r.title}
                  {r.rarity ? <span className="ml-2 text-brass-500">{'★'.repeat(r.rarity)}</span> : null}
                  {r.model_url ? <span className="ml-2" title="Modèle 3D">🎬</span> : null}
                </td>
                <td className="hidden p-2 md:table-cell">{r.tags.map((t) => `#${t}`).join(' ')}</td>
                <td className="p-2">
                  {r.discovered ? (
                    <span className="font-semibold text-olive-700">Découvert</span>
                  ) : (
                    <span className="font-bold text-stamp">? Masqué</span>
                  )}
                </td>
                <td className="p-2">
                  <div className="flex flex-wrap justify-end gap-1">
                    <button className="btn-ghost !px-3 !py-0.5" onClick={() => setDiscovered([r.id], !r.discovered)}>
                      {r.discovered ? 'Masquer' : 'Découvrir'}
                    </button>
                    <Link className="btn-ghost !px-3 !py-0.5" href={`/admin/edit/${r.category}/${pad(r.number)}`}>
                      Éditer
                    </Link>
                    <button className="btn-danger !px-3 !py-0.5" onClick={() => removeMany([r.id])}>
                      Suppr.
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-olive-700">
        Import JSON : liste d’objets <code>{'{ "number": 12, "title": "…", "summary", "content", "tags": [], "infobox": [{"label","value"}], "rarity": 1-8, "discovered": true }'}</code>.
        La catégorie est celle de l’onglet si elle n’est pas précisée.
      </p>
    </div>
  );
}
