import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES, CATEGORY_LABELS, firstParam, pad, type Category, type EntryFull, type EntrySummary } from '@/lib/wiki';
import AccessDenied from '@/components/AccessDenied';
import Rarity from '@/components/Rarity';
import Icon from '@/components/Icon';
import { getBrand } from '@/lib/brand-server';

export const dynamic = 'force-dynamic';

/**
 * Comparateur (Lot 98) : deux fiches découvertes côte à côte. Les lignes de
 * la fiche signalétique sont alignées par intitulé ; quand les deux valeurs
 * sont des nombres de même unité (« 2,4 m », « 120 kg »), la plus grande est
 * marquée. Rien n'est enregistré : l'adresse (?a=mobs/001&b=mobs/004) suffit
 * à partager la comparaison.
 */

type Ref = { category: Category; number: number };

function lireRef(v: string | undefined): Ref | null {
  const m = v?.match(/^([a-z]+)\/(\d{1,3})$/);
  if (!m || !(CATEGORIES as readonly string[]).includes(m[1])) return null;
  return { category: m[1] as Category, number: Number(m[2]) };
}

const cle = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** « 2,4 m » → { n: 2.4, unite: "m" } ; null si ce n'est pas un nombre. */
function nombre(v: string): { n: number; unite: string } | null {
  const m = v.trim().match(/^(-?\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!m) return null;
  return { n: Number(m[1].replace(',', '.')), unite: cle(m[2]) };
}

type Ligne = { label: string; a: string | null; b: string | null };

function lignes(a: EntryFull, b: EntryFull): Ligne[] {
  const out = new Map<string, Ligne>();
  for (const r of a.infobox ?? []) if (r.label) out.set(cle(r.label), { label: r.label, a: r.value, b: null });
  for (const r of b.infobox ?? []) {
    if (!r.label) continue;
    const k = cle(r.label);
    const l = out.get(k);
    if (l) l.b = r.value;
    else out.set(k, { label: r.label, a: null, b: r.value });
  }
  return [...out.values()];
}

function plusGrand(l: Ligne): 'a' | 'b' | null {
  if (!l.a || !l.b) return null;
  const x = nombre(l.a);
  const y = nombre(l.b);
  if (!x || !y || x.unite !== y.unite || x.n === y.n) return null;
  return x.n > y.n ? 'a' : 'b';
}

export default async function ComparerPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  await getBrand();
  const supabase = createClient();
  const refA = lireRef(firstParam(searchParams.a));
  const refB = lireRef(firstParam(searchParams.b));

  const [listes, ea, eb] = await Promise.all([
    Promise.all(CATEGORIES.map((c) => supabase.rpc('wiki_list', { p_category: c }))),
    refA ? supabase.rpc('wiki_get', { p_category: refA.category, p_number: refA.number }) : Promise.resolve({ data: null, error: null }),
    refB ? supabase.rpc('wiki_get', { p_category: refB.category, p_number: refB.number }) : Promise.resolve({ data: null, error: null }),
  ]);
  if (listes.some((r) => r.error)) return <AccessDenied />;
  const toutes = listes.flatMap((r) => (r.data ?? []) as EntrySummary[]).filter((e) => e.discovered && e.title);
  const a = (ea.data as EntryFull | null)?.discovered ? (ea.data as EntryFull) : null;
  const b = (eb.data as EntryFull | null)?.discovered ? (eb.data as EntryFull) : null;
  const val = (r: Ref | null) => (r ? `${r.category}/${pad(r.number)}` : '');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-typewriter text-3xl font-bold text-olive-800">Comparer deux fiches</h1>
        <p className="mt-1 max-w-[65ch] text-olive-700">
          Deux fiches découvertes côte à côte : fiche signalétique alignée, rareté, mots-clés. Le plus grand des deux nombres de même unité est marqué ▲.
        </p>
      </header>

      <form method="get" action="/comparer" className="card flex flex-wrap items-end gap-3 p-4">
        {(['a', 'b'] as const).map((k, i) => (
          <label key={k} className="flex min-w-[14rem] flex-1 flex-col gap-1">
            <span className="text-sm font-semibold text-olive-800">{i === 0 ? 'Première fiche' : 'Seconde fiche'}</span>
            <select name={k} defaultValue={val(k === 'a' ? refA : refB)} className="input" required>
              <option value="">Choisir…</option>
              {CATEGORIES.map((c) => {
                const es = toutes.filter((e) => e.category === c);
                if (!es.length) return null;
                return (
                  <optgroup key={c} label={CATEGORY_LABELS[c].label}>
                    {es.map((e) => (
                      <option key={`${c}${e.number}`} value={`${c}/${pad(e.number)}`}>
                        {e.title} (n° {pad(e.number)})
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </label>
        ))}
        <button type="submit" className="btn">
          Comparer
        </button>
      </form>

      {(refA || refB) && (!a || !b) && (
        <p className="card p-4 text-olive-800">
          {!a && !b ? 'Choisis deux fiches.' : 'Choisis la seconde fiche.'} Seules les fiches déjà découvertes se comparent.
        </p>
      )}

      {a && b && <Tableau a={a} b={b} />}
    </div>
  );
}

function Tableau({ a, b }: { a: EntryFull; b: EntryFull }) {
  const ls = lignes(a, b);
  const tagsA = new Set(a.tags ?? []);
  const tagsB = new Set(b.tags ?? []);
  const communs = [...tagsA].filter((t) => tagsB.has(t));
  const memeCategorie = a.category === b.category;

  const Tete = ({ e }: { e: EntryFull }) => (
    <div className="space-y-2">
      {e.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={e.image_url} alt="" className="aspect-square w-full max-w-[10rem] rounded-lg object-cover" loading="lazy" />
      )}
      <Link href={`/${e.category}/${pad(e.number)}`} className="block font-typewriter text-xl font-bold text-ink hover:underline">
        {e.title}
      </Link>
      <p className="text-sm text-olive-700">
        <Icon name={e.category} /> {CATEGORY_LABELS[e.category].singular} n° {pad(e.number)}
      </p>
    </div>
  );

  const cellule = (v: string | null, plus: boolean) => (v ? <span className={plus ? 'cmp-plus' : undefined}>{v}</span> : <span className="text-olive-700">—</span>);

  return (
    <section aria-label="Comparaison" className="card overflow-hidden p-0">
      {!memeCategorie && (
        <p className="border-b border-[color:var(--rule)] px-4 py-2 text-sm text-olive-800">
          Deux catégories différentes : seuls les intitulés communs se font face.
        </p>
      )}
      <div className="cmp-grille" role="table" aria-label={`${a.title} et ${b.title}`}>
        <div role="row" className="contents">
          <span role="columnheader" className="cmp-label">
            <span className="sr-only">Intitulé</span>
          </span>
          <div role="columnheader">
            <Tete e={a} />
          </div>
          <div role="columnheader">
            <Tete e={b} />
          </div>
        </div>
        <div role="row" className="contents">
          <span role="rowheader" className="cmp-label">Rareté</span>
          <span role="cell">{a.rarity ? <Rarity value={a.rarity} /> : '—'}</span>
          <span role="cell">{b.rarity ? <Rarity value={b.rarity} /> : '—'}</span>
        </div>
        {ls.map((l) => {
          const p = plusGrand(l);
          const diff = (l.a ?? '') !== (l.b ?? '');
          return (
            <div key={l.label} role="row" className="contents">
              <span role="rowheader" className={`cmp-label${diff ? ' cmp-diff' : ''}`}>
                {l.label}
              </span>
              <span role="cell" className={diff ? 'cmp-diff' : undefined}>
                {cellule(l.a, p === 'a')}
                {p === 'a' && <span className="sr-only"> (plus grand)</span>}
              </span>
              <span role="cell" className={diff ? 'cmp-diff' : undefined}>
                {cellule(l.b, p === 'b')}
                {p === 'b' && <span className="sr-only"> (plus grand)</span>}
              </span>
            </div>
          );
        })}
        <div role="row" className="contents">
          <span role="rowheader" className="cmp-label">Mots-clés</span>
          {[a, b].map((e) => (
            <span role="cell" key={`${e.category}${e.number}`} className="flex flex-wrap gap-1">
              {(e.tags ?? []).length === 0
                ? '—'
                : (e.tags ?? []).map((t) => (
                    <span key={t} className={`rounded-full border border-[color:var(--rule)] px-2 py-0.5 text-xs ${communs.includes(t) ? 'font-bold' : ''}`}>
                      {t}
                    </span>
                  ))}
            </span>
          ))}
        </div>
        <div role="row" className="contents">
          <span role="rowheader" className="cmp-label">Résumé</span>
          <span role="cell" className="text-sm">{a.summary || '—'}</span>
          <span role="cell" className="text-sm">{b.summary || '—'}</span>
        </div>
      </div>
      {communs.length > 0 && <p className="px-4 py-3 text-sm text-olive-800">En commun : {communs.join(', ')} (en gras).</p>}
    </section>
  );
}
