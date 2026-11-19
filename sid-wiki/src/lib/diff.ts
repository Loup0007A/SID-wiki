/**
 * Comparaison ligne à ligne (plus longue sous-suite commune), puis mot à
 * mot dans les lignes modifiées. Sert aux propositions de modification.
 */
export type DiffPart = { type: 'same' | 'add' | 'del'; text: string };

function lcs<T>(a: T[], b: T[]): DiffPart[] {
  const n = a.length;
  const m = b.length;
  // Table des longueurs ; fiches de quelques centaines de lignes au plus.
  const t: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) t[i][j] = a[i] === b[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
  const out: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: 'same', text: String(a[i]) });
      i++;
      j++;
    } else if (t[i + 1][j] >= t[i][j + 1]) out.push({ type: 'del', text: String(a[i++]) });
    else out.push({ type: 'add', text: String(b[j++]) });
  }
  while (i < n) out.push({ type: 'del', text: String(a[i++]) });
  while (j < m) out.push({ type: 'add', text: String(b[j++]) });
  return out;
}

export function diffLines(before: string, after: string): DiffPart[] {
  const a = before.replace(/\r\n/g, '\n').split('\n');
  const b = after.replace(/\r\n/g, '\n').split('\n');
  if (a.length * b.length > 4_000_000) {
    // Trop long pour une comparaison fine : tout l'ancien contre tout le nouveau.
    return [...a.map((text) => ({ type: 'del' as const, text })), ...b.map((text) => ({ type: 'add' as const, text }))];
  }
  return lcs(a, b);
}

export function diffWords(before: string, after: string): DiffPart[] {
  const split = (s: string) => s.match(/\s+|[^\s]+/g) ?? [];
  const parts = lcs(split(before), split(after));
  // Regroupe les morceaux voisins de même type.
  const out: DiffPart[] = [];
  for (const p of parts) {
    const last = out[out.length - 1];
    if (last && last.type === p.type) last.text += p.text;
    else out.push({ ...p });
  }
  return out;
}

export function changedCount(parts: DiffPart[]) {
  return parts.filter((p) => p.type !== 'same').length;
}
