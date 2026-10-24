'use client';

import { useEffect, useRef, useState } from 'react';

/** Emoji de secours quand l'image `public/icons/<nom>.png` n'existe pas. */
export const ICON_FALLBACK = {
  logo: '⚔️',
  lieux: '🗺',
  armes: '⚔',
  mobs: '☠',
  objets: '🎒',
  skills: '✨',
  profils: '🧍',
  accueil: '🏠',
  chercher: '🔍',
  favoris: '⭐',
  hasard: '🎲',
  tags: '🏷',
  aide: '❓',
  admin: '🛠',
  menu: '☰',
} as const;

export type IconName = keyof typeof ICON_FALLBACK;

// Fichiers présents dans public/icons au moment du build (voir next.config.js).
const AVAILABLE = new Set((process.env.NEXT_PUBLIC_WIKI_ICONS ?? '').split(',').filter(Boolean));

/**
 * Icône personnalisable : dépose `public/icons/<nom>.png` (voir public/icons/LISEZ-MOI.txt).
 * Sans fichier, l'emoji par défaut s'affiche.
 */
export default function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);

  // L'erreur de chargement peut survenir avant l'hydratation : on revérifie au montage.
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed || (AVAILABLE.size > 0 && !AVAILABLE.has(name))) return <span aria-hidden className={className}>{ICON_FALLBACK[name]}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={img}
      src={`/icons/${name}.png`}
      alt=""
      aria-hidden
      draggable={false}
      onError={() => setFailed(true)}
      width={96}
      height={96}
      decoding="async"
      className={`inline-block h-[1.25em] w-[1.25em] flex-none object-contain align-[-0.25em] ${className}`}
    />
  );
}
