import type { EntrySummary } from '@/lib/wiki';

/**
 * L'énigme du jour (Lot 59) : choisie côté serveur, la même pour tout le
 * monde toute la journée (heure de Paris). Hors du composant (qui est un
 * composant client) pour pouvoir être appelée par la page d'accueil.
 */

export type Enigme = {
  day: string;
  answer: Pick<EntrySummary, 'category' | 'number' | 'title' | 'image_url' | 'rarity' | 'tags' | 'summary'>;
  options: { key: string; title: string }[];
};

/** Choix du jour, stable pour la journée (heure de Paris). Null s'il n'y a pas assez de fiches illustrées. */
export function enigmeOfTheDay(all: EntrySummary[], now = new Date()): Enigme | null {
  const day = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(now);
  const pool = all.filter((e) => e.discovered && e.title && e.image_url);
  if (pool.length < 4) return null;
  let h = 0;
  for (const c of `enigme-${day}`) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rnd = () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return h / 2 ** 32;
  };
  const answer = pool[Math.floor(rnd() * pool.length)];
  // Leurres : d'abord la même catégorie (plus difficile), puis le reste.
  const same = pool.filter((e) => e !== answer && e.category === answer.category);
  const other = pool.filter((e) => e !== answer && e.category !== answer.category);
  const pick = (list: EntrySummary[], n: number) => {
    const copy = [...list];
    const out: EntrySummary[] = [];
    while (copy.length && out.length < n) out.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
    return out;
  };
  const decoys = pick(same, 3);
  decoys.push(...pick(other, 3 - decoys.length));
  const options = [answer, ...decoys]
    .map((e) => ({ key: `${e.category}-${e.number}`, title: e.title!, r: rnd() }))
    .sort((a, b) => a.r - b.r)
    .map(({ key, title }) => ({ key, title }));
  return {
    day,
    answer: { category: answer.category, number: answer.number, title: answer.title, image_url: answer.image_url, rarity: answer.rarity, tags: answer.tags, summary: answer.summary },
    options
  };
}
