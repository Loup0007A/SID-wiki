export const CATEGORIES = ['lieux', 'armes', 'mobs', 'objets'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, { label: string; singular: string; icon: string }> = {
  lieux: { label: 'Lieux', singular: 'Lieu', icon: '🗺' },
  armes: { label: 'Armes', singular: 'Arme', icon: '⚔' },
  mobs: { label: 'Mobs', singular: 'Mob', icon: '☠' },
  objets: { label: 'Objets', singular: 'Objet', icon: '🎒' },
};

export function isCategory(v: string): v is Category {
  return (CATEGORIES as readonly string[]).includes(v);
}

export function parseNumber(v: string): number | null {
  if (!/^\d{1,3}$/.test(v)) return null;
  return parseInt(v, 10);
}

export function pad(n: number): string {
  return String(n).padStart(3, '0');
}

export type EntrySummary = {
  category: Category;
  number: number;
  discovered: boolean;
  title: string | null;
  summary: string | null;
  image_url: string | null;
  tags: string[] | null;
};

export type RelatedEntry = {
  category: Category;
  number: number;
  discovered: boolean;
  title: string | null;
};

export type EntryFull = {
  id: string | null;
  category: Category;
  number: number;
  discovered: boolean;
  title: string | null;
  summary: string | null;
  content: string | null;
  image_url: string | null;
  tags: string[] | null;
  updated_at: string | null;
  related: RelatedEntry[];
};

/**
 * Syntaxe wiki : [[armes/012]] ou [[armes/012|texte affiché]]
 * Convertie en lien markdown interne, ensuite rendu avec aperçu au survol.
 */
export function preprocessWikiLinks(md: string): string {
  return md.replace(
    /\[\[(lieux|armes|mobs|objets)\/(\d{1,3})(?:\|([^\]]+))?\]\]/g,
    (_m, cat: string, num: string, label?: string) =>
      `[${label ?? `${cat}/${pad(parseInt(num, 10))}`}](/${cat}/${pad(parseInt(num, 10))})`
  );
}
