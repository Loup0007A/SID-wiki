'use client';

import { useEffect, useRef, useState } from 'react';
import { SidIcon } from '@/components/icons/SidIcon';

/**
 * Écouter la fiche (Lot 60) : la voix française de l'appareil lit le nom,
 * le résumé, les informations et le texte de la fiche. Lecture, pause,
 * reprise, arrêt. Rien n'est envoyé : c'est la synthèse vocale du navigateur.
 * Le bouton n'apparaît pas si l'appareil ne sait pas lire à voix haute.
 */

/** Markdown → texte à lire (liens, images, titres, listes, emphase…). */
function plain(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/[*_~`|]+/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Morceaux courts (certains navigateurs coupent les phrases trop longues). */
function chunks(text: string, max = 220) {
  const out: string[] = [];
  for (const sentence of text.match(/[^.!?…]+[.!?…]*/g) ?? []) {
    let s = sentence.trim();
    while (s.length > max) {
      const cut = s.lastIndexOf(' ', max);
      out.push(s.slice(0, cut > 40 ? cut : max));
      s = s.slice(cut > 40 ? cut : max).trim();
    }
    if (s) out.push(s);
  }
  return out;
}

type Props = { title: string; summary: string | null; rows: { label: string; value: string }[]; content: string | null };

export default function ListenButton({ title, summary, rows, content }: Props) {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [part, setPart] = useState({ i: 0, n: 0 });
  const run = useRef(0);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
    // Charge la liste des voix (elle arrive après coup sur certains navigateurs).
    try {
      window.speechSynthesis?.getVoices();
    } catch {
      /* rien */
    }
    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* rien */
      }
    };
  }, []);

  if (!supported) return null;

  function stop() {
    run.current++;
    window.speechSynthesis.cancel();
    setState('idle');
  }

  function play() {
    const synth = window.speechSynthesis;
    synth.cancel();
    const id = ++run.current;
    const text = [
      `${title}.`,
      summary ?? '',
      rows.map((r) => `${r.label} : ${r.value}.`).join(' '),
      content ? plain(content) : ''
    ]
      .filter(Boolean)
      .join(' ');
    const list = chunks(text);
    const voices = synth.getVoices();
    const voice = voices.find((v) => v.lang === 'fr-FR' && /google|natural|premium|enhanced/i.test(v.name)) ?? voices.find((v) => v.lang?.startsWith('fr'));
    setPart({ i: 0, n: list.length });
    setState('playing');
    list.forEach((t, i) => {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'fr-FR';
      if (voice) u.voice = voice;
      u.rate = 1;
      u.onstart = () => run.current === id && setPart({ i: i + 1, n: list.length });
      if (i === list.length - 1) u.onend = () => run.current === id && setState('idle');
      u.onerror = () => run.current === id && setState('idle');
      synth.speak(u);
    });
  }

  function toggle() {
    const synth = window.speechSynthesis;
    if (state === 'idle') play();
    else if (state === 'playing') {
      synth.pause();
      setState('paused');
    } else {
      synth.resume();
      setState('playing');
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button type="button" onClick={toggle} className="btn-ghost" aria-label={state === 'playing' ? 'Mettre la lecture en pause' : state === 'paused' ? 'Reprendre la lecture' : 'Écouter la fiche'}>
        {state === 'playing' ? (
          <>
            <span className="listen-bars" aria-hidden>
              <i />
              <i />
              <i />
            </span>{' '}
            Pause
          </>
        ) : (
          <>
            <SidIcon name="horn" /> {state === 'paused' ? 'Reprendre' : 'Écouter'}
          </>
        )}
      </button>
      {state !== 'idle' && (
        <>
          <button type="button" onClick={stop} className="btn-ghost !px-2.5" aria-label="Arrêter la lecture">
            ■
          </button>
          <span className="text-xs text-olive-700" aria-live="polite">
            {part.i}/{part.n}
          </span>
        </>
      )}
    </span>
  );
}
