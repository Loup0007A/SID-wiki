'use client';

import { useMemo, useState } from 'react';
import { diffLines, diffWords, type DiffPart } from '@/lib/diff';
import type { InfoRow } from '@/lib/wiki';

export type ProposalFields = { title: string | null; summary: string | null; content: string | null; tags: string[]; infobox: InfoRow[] };

function Words({ parts }: { parts: DiffPart[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.type === 'same' ? (
          <span key={i}>{p.text}</span>
        ) : p.type === 'add' ? (
          <ins key={i} className="diff-ins">
            {p.text}
          </ins>
        ) : (
          <del key={i} className="diff-del">
            {p.text}
          </del>
        ),
      )}
    </>
  );
}

function Field({ label, before, after }: { label: string; before: string; after: string }) {
  if (before === after) return null;
  return (
    <div className="diff-field">
      <p className="label !mb-1">{label}</p>
      <p className="leading-relaxed">
        <Words parts={diffWords(before, after)} />
      </p>
    </div>
  );
}

/** Ce qui change entre la fiche actuelle et la proposition. */
export default function ProposalDiff({ current, proposed }: { current: ProposalFields; proposed: ProposalFields }) {
  const [all, setAll] = useState(false);
  const lines = useMemo(() => diffLines(current.content ?? '', proposed.content ?? ''), [current.content, proposed.content]);
  const infoText = (rows: InfoRow[]) => rows.map((r) => `${r.label} : ${r.value}`).join('\n');
  const infoLines = useMemo(() => diffLines(infoText(current.infobox), infoText(proposed.infobox)), [current.infobox, proposed.infobox]);
  const tagsBefore = [...current.tags].sort().join(', ');
  const tagsAfter = [...proposed.tags].sort().join(', ');
  const contentChanged = lines.some((l) => l.type !== 'same');
  const infoChanged = infoLines.some((l) => l.type !== 'same');

  // Contexte : 2 lignes autour de chaque changement, sauf si on demande tout.
  const keep = new Set<number>();
  lines.forEach((l, i) => {
    if (l.type !== 'same') for (let k = i - 2; k <= i + 2; k++) keep.add(k);
  });

  return (
    <div className="space-y-4">
      <Field label="Nom" before={current.title ?? ''} after={proposed.title ?? ''} />
      <Field label="Résumé" before={current.summary ?? ''} after={proposed.summary ?? ''} />
      <Field label="Tags" before={tagsBefore} after={tagsAfter} />
      {infoChanged && (
        <div className="diff-field">
          <p className="label !mb-1">Fiche technique</p>
          <DiffBlock parts={infoLines} keep={null} />
        </div>
      )}
      {contentChanged && (
        <div className="diff-field">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="label !mb-0">Texte</p>
            <button type="button" className="btn-ghost !min-h-0 !px-2.5 !py-0.5 text-xs" onClick={() => setAll((v) => !v)}>
              {all ? 'Seulement les changements' : 'Tout le texte'}
            </button>
          </div>
          <DiffBlock parts={lines} keep={all ? null : keep} />
        </div>
      )}
      {!contentChanged && !infoChanged && tagsBefore === tagsAfter && current.title === proposed.title && (current.summary ?? '') === (proposed.summary ?? '') && (
        <p className="text-sm text-olive-700">Aucune différence avec la fiche actuelle.</p>
      )}
    </div>
  );
}

function DiffBlock({ parts, keep }: { parts: DiffPart[]; keep: Set<number> | null }) {
  const rows: React.ReactNode[] = [];
  let skipped = 0;
  parts.forEach((p, i) => {
    if (keep && !keep.has(i)) {
      skipped++;
      return;
    }
    if (skipped) {
      rows.push(
        <div key={`s${i}`} className="diff-skip">
          … {skipped} ligne{skipped > 1 ? 's' : ''} identique{skipped > 1 ? 's' : ''}
        </div>,
      );
      skipped = 0;
    }
    // Ligne supprimée suivie d'une ligne ajoutée : on montre les mots changés.
    const next = parts[i + 1];
    if (p.type === 'del' && next?.type === 'add') {
      rows.push(
        <div key={i} className="diff-line diff-line-mod">
          <span className="diff-mark" aria-hidden>
            ~
          </span>
          <span>
            <Words parts={diffWords(p.text, next.text)} />
          </span>
        </div>,
      );
      return;
    }
    if (p.type === 'add' && parts[i - 1]?.type === 'del') return;
    rows.push(
      <div key={i} className={`diff-line diff-line-${p.type}`}>
        <span className="diff-mark" aria-hidden>
          {p.type === 'add' ? '+' : p.type === 'del' ? '−' : ' '}
        </span>
        <span>{p.text || ' '}</span>
      </div>,
    );
  });
  if (skipped)
    rows.push(
      <div key="end" className="diff-skip">
        … {skipped} ligne{skipped > 1 ? 's' : ''} identique{skipped > 1 ? 's' : ''}
      </div>,
    );
  return <div className="diff-block">{rows}</div>;
}
