'use client';

import { useEffect, useRef, useState } from 'react';
import { SidIcon, type IconName as SidIconName } from '@/components/icons/SidIcon';

/** Ancien émoji de chaque icône (gardé pour les textes) ; l'affichage utilise les icônes dessinées. */
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

/** Icône dessinée du S.I.D. (Lot 49) affichée quand il n'y a pas d'image perso. */
const SID_ICON: Record<IconName, SidIconName> = {
  logo: 'swords',
  lieux: 'map',
  armes: 'dagger',
  mobs: 'skull',
  objets: 'backpack',
  skills: 'sparkle',
  profils: 'profile',
  accueil: 'home',
  chercher: 'magnifier',
  favoris: 'starGold',
  hasard: 'dice',
  tags: 'tag',
  aide: 'question',
  admin: 'tools',
  menu: 'menu',
};

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

  if (failed || (AVAILABLE.size > 0 && !AVAILABLE.has(name))) return <SidIcon name={SID_ICON[name]} size="1.25em" className={className} />;
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
