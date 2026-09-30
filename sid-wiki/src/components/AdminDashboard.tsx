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
};

export default function AdminDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const [category, setCategory] = useState<Category>('lieux');
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wiki_entries')
      .select('id, category, number, title, tags, discovered')
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

  async function setDiscovered(row: Row, value: boolean) {
    const { error } = await supabase.from('wiki_entries').update({ discovered: value }).eq('id', row.id);
    if (error) return setError(error.message);
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, discovered: value } : r)));
  }

  async function remove(row: Row) {
    if (!confirm(`Supprimer définitivement ${row.category} ${pad(row.number)} — « ${row.title} » ?`)) return;
    const { error } = await supabase.from('wiki_entries').delete().eq('id', row.id);
    if (error) return setError(error.message);
    setRows((rs) => rs.filter((r) => r.id !== row.id));
  }

  const f = filter.trim().toLowerCase();
  const shown = f
    ? rows.filter(
        (r) =>
          r.title.toLowerCase().includes(f) ||
          pad(r.number).includes(f) ||
          r.tags.some((t) => t.toLowerCase().includes(f))
      )
    : rows;
  const found = rows.filter((r) => r.discovered).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-typewriter text-3xl font-bold uppercase tracking-widest text-olive-800">Dashboard</h1>
        <Link href={`/admin/edit/${category}/new`} className="btn">
          + Nouvelle fiche
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
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
      </div>

      {error && <p className="mb-3 text-stamp">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b-2 border-olive-800/40 font-typewriter uppercase tracking-wider">
            <tr>
              <th className="p-2">N°</th>
              <th className="p-2">Titre</th>
              <th className="p-2">Tags</th>
              <th className="p-2">Statut</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="p-4 italic">Chargement…</td>
              </tr>
            )}
            {!loading && shown.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 italic">Aucune fiche.</td>
              </tr>
            )}
            {shown.map((r) => (
              <tr key={r.id} className="border-b border-olive-800/20">
                <td className="p-2 font-typewriter">{pad(r.number)}</td>
                <td className="p-2 font-semibold">{r.title}</td>
                <td className="p-2">{r.tags.map((t) => `#${t}`).join(' ')}</td>
                <td className="p-2">
                  {r.discovered ? (
                    <span className="font-semibold text-olive-700">Découvert</span>
                  ) : (
                    <span className="font-bold text-stamp">? Masqué</span>
                  )}
                </td>
                <td className="space-x-2 whitespace-nowrap p-2 text-right">
                  <button className="btn-ghost !px-2 !py-1" onClick={() => setDiscovered(r, !r.discovered)}>
                    {r.discovered ? 'Masquer' : 'Découvrir'}
                  </button>
                  <Link className="btn-ghost !px-2 !py-1" href={`/admin/edit/${r.category}/${pad(r.number)}`}>
                    Éditer
                  </Link>
                  <button className="btn-danger !px-2 !py-1" onClick={() => remove(r)}>
                    Suppr.
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
