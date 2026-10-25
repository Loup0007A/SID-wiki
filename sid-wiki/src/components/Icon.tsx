import Emblem, { type EmblemName } from './Emblem';

/** Noms des icônes du wiki (catégories, menu, outils). */
export type IconName = EmblemName;

const CATS = new Set<IconName>(['lieux', 'armes', 'mobs', 'objets', 'skills']);

/**
 * Icône du wiki : emblème gravé du Codex (Lot 50). Les catégories prennent
 * leur couleur ; les autres suivent la couleur du texte.
 * (Les anciennes images public/icons/*.png ne sont plus utilisées.)
 */
export default function Icon({ name, className = '', size }: { name: IconName; className?: string; size?: string | number }) {
  return <Emblem name={name} size={size} className={`${CATS.has(name) ? `cat-${name} text-[color:var(--cat)]` : ''} ${className}`} />;
}
