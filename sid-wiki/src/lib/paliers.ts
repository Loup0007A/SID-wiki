/**
 * Paliers de la collection (Lot 60). La découverte est collective : chaque
 * catégorie gagne une médaille quand le S.I.D. en a découvert 25 %, 50 %,
 * 75 % puis 100 %, et le Codex entier prend un rang.
 */

export type Medal = { key: 'aucun' | 'bronze' | 'argent' | 'or' | 'complet'; label: string; min: number };

export const MEDALS: Medal[] = [
  { key: 'aucun', label: 'Sans médaille', min: 0 },
  { key: 'bronze', label: 'Bronze', min: 0.25 },
  { key: 'argent', label: 'Argent', min: 0.5 },
  { key: 'or', label: 'Or', min: 0.75 },
  { key: 'complet', label: 'Complète', min: 1 }
];

export function medalFor(found: number, total: number) {
  const ratio = total > 0 ? found / total : 0;
  let i = 0;
  while (i < MEDALS.length - 1 && ratio >= MEDALS[i + 1].min) i++;
  const medal = MEDALS[i];
  const next = MEDALS[i + 1] ?? null;
  // Fiches qui manquent pour le palier suivant.
  const missing = next ? Math.max(1, Math.ceil(next.min * total - found)) : 0;
  return { medal, next, missing, level: i };
}

const RANKS = [
  { min: 0, label: 'Carnet vierge' },
  { min: 0.1, label: 'Carnet entamé' },
  { min: 0.25, label: 'Codex de campagne' },
  { min: 0.5, label: 'Codex d’expédition' },
  { min: 0.75, label: 'Codex de maître' },
  { min: 1, label: 'Codex complet' }
];

/** Rang du Codex entier et le suivant. */
export function codexRank(found: number, total: number) {
  const ratio = total > 0 ? found / total : 0;
  let i = 0;
  while (i < RANKS.length - 1 && ratio >= RANKS[i + 1].min) i++;
  const next = RANKS[i + 1] ?? null;
  return { label: RANKS[i].label, next: next?.label ?? null, missing: next ? Math.max(1, Math.ceil(next.min * total - found)) : 0, level: i };
}
