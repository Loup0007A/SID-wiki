'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CATEGORY_LABELS, pad, type Category } from '@/lib/wiki';
import type { Enigme } from '@/lib/enigme';
import { SidIcon } from '@/components/icons/SidIcon';

/**
 * L'énigme du jour (Lot 59) : l'image floutée d'une fiche déjà découverte,
 * la même pour tout le monde toute la journée (heure de Paris). Quatre
 * propositions, un indice si besoin, une seule réponse par jour. Les jours
 * réussis d'affilée forment une série (gardée sur l'appareil).
 */

/** L'indice ne doit pas donner la réponse : le nom est masqué dans le résumé. */
function hideTitle(text: string, title: string | null) {
  if (!title) return text;
  const esc = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(esc, 'gi'), '…');
}

const KEY = 'wiki-enigme-v1';
type Saved = { day: string; choice: string; ok: boolean; streak: number; best: number; lastOk: string | null };

function load(): Saved | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null');
  } catch {
    return null;
  }
}

function yesterday(day: string) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export default function EnigmeDuJour({ enigme }: { enigme: Enigme }) {
  const { answer, options, day } = enigme;
  const answerKey = `${answer.category}-${answer.number}`;
  const [saved, setSaved] = useState<Saved | null>(null);
  const [hint, setHint] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSaved(load());
    setReady(true);
  }, []);

  const played = saved?.day === day ? saved : null;
  // Série en cours : elle tient si le dernier jour réussi est aujourd'hui ou hier.
  const streak = saved && saved.lastOk && (saved.lastOk === day || saved.lastOk === yesterday(day)) ? saved.streak : 0;

  function choose(key: string) {
    if (played) return;
    const ok = key === answerKey;
    const prev = load();
    const keep = prev?.lastOk === yesterday(day) ? prev.streak : 0;
    const next: Saved = {
      day,
      choice: key,
      ok,
      streak: ok ? keep + 1 : 0,
      best: Math.max(prev?.best ?? 0, ok ? keep + 1 : 0),
      lastOk: ok ? day : prev?.lastOk ?? null
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* stockage indisponible : la partie n'est pas gardée */
    }
    setSaved(next);
  }

  const cat = answer.category as Category;

  return (
    <section className={`enigme cat-${cat} panel mb-6 overflow-hidden`} aria-labelledby="enigme-titre">
      <div className="grid gap-4 p-4 sm:grid-cols-[11rem_1fr] sm:p-5">
        <div className={`enigme-frame ${played ? 'is-revealed' : hint ? 'is-hint' : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={answer.image_url!} alt={played ? answer.title ?? '' : 'Image floutée de la fiche mystère'} draggable={false} />
          {!played && <span className="enigme-q" aria-hidden>?</span>}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="enigme-titre" className="section-title !mb-0">
              <SidIcon name="question" /> L’énigme du jour
            </h2>
            {ready && (streak > 0 || (saved?.best ?? 0) > 0) && (
              <p className="text-sm text-olive-700">
                <SidIcon name="fire" /> Série : <strong className="text-brass-300">{streak}</strong> jour{streak > 1 ? 's' : ''}
                {(saved?.best ?? 0) > streak && <> · record {saved!.best}</>}
              </p>
            )}
          </div>
          <p className="mt-1 text-[0.95rem] text-olive-700">
            Une fiche de la catégorie <strong>{CATEGORY_LABELS[cat].label}</strong>
            {answer.rarity ? <>, rareté {answer.rarity}/8</> : null}. Laquelle ?
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2" role="group" aria-label="Propositions">
            {options.map((o) => {
              const isAnswer = o.key === answerKey;
              const picked = played?.choice === o.key;
              const state = played ? (isAnswer ? 'is-good' : picked ? 'is-bad' : 'is-dim') : '';
              return (
                <button key={o.key} type="button" disabled={!!played || !ready} onClick={() => choose(o.key)} className={`enigme-opt ${state}`}>
                  {played && isAnswer && <SidIcon name="check" />}
                  {played && picked && !isAnswer && <SidIcon name="cross" />}
                  <span className="truncate">{o.title}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 min-h-[1.5rem] text-[0.95rem]" aria-live="polite">
            {played ? (
              <p>
                {played.ok ? (
                  <strong className="text-[color:var(--cat)]">Bien vu !</strong>
                ) : (
                  <strong className="enigme-miss">Raté.</strong>
                )}{' '}
                C’était{' '}
                <Link href={`/${cat}/${pad(answer.number)}`} className="font-semibold underline">
                  {answer.title}
                </Link>
                . Nouvelle énigme demain.
              </p>
            ) : hint ? (
              <p className="text-olive-700">
                <SidIcon name="bulb" />{' '}
                L’image se précise. {answer.tags?.length ? <>Tags : {answer.tags.map((t) => `#${t}`).join(' ')}. </> : null}
                {answer.summary ? <>« {hideTitle(answer.summary, answer.title).split(/\s+/).slice(0, 6).join(' ')}… »</> : null}
                {!answer.tags?.length && !answer.summary && <>Pas d’indice pour celle-ci : fie-toi à la silhouette.</>}
              </p>
            ) : (
              <button type="button" onClick={() => setHint(true)} className="btn-ghost !min-h-[2rem] !px-3 !py-0.5 text-sm">
                <SidIcon name="bulb" /> Un indice
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
