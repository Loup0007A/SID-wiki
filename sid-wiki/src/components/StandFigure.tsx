import { GEAR_SLOT_LABELS, type GearItem, type GearSlot } from '@/lib/wiki';

/**
 * Le porte-armure (« armor-stand ») dessiné en pixels : socle de pierre, montants en bois,
 * et une pièce qui apparaît sur le mannequin pour chaque emplacement équipé.
 * Composant purement visuel : utilisable dans une page serveur (liste) comme dans l'éditeur.
 */

const WOOD = '#a37c4a';
const WOOD_DARK = '#6f5230';
const STONE = '#8791a0';
const STONE_DARK = '#5b6472';

/** Couleur d'une pièce selon la rareté ★ de la fiche (sans rareté : acier). */
const RARITY_COLORS = ['#b98a5c', '#cfd8e2', '#ffcb45', '#5fd0e6', '#7fe0a0', '#b48cff', '#ff6b5b', '#f6f2ff'];
const STEEL = '#9db3c9';
const MASKED = '#3b4759';

function colorOf(item: GearItem): string {
  if (!item.discovered) return MASKED;
  return item.rarity ? RARITY_COLORS[Math.min(8, Math.max(1, item.rarity)) - 1] : STEEL;
}

type Held = 'sword' | 'bow' | 'shield' | 'staff';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Devine la forme à dessiner d'après le nom de la fiche ; sinon forme par défaut de l'emplacement. */
function heldKind(item: GearItem): Held {
  const t = norm(item.title ?? '');
  if (/\barcs?\b|arbalete|fronde/.test(t)) return 'bow';
  if (/bouclier|pavois|egide|targe/.test(t)) return 'shield';
  if (/baton|sceptre|canne|baguette|lance|trident|hallebarde|faux/.test(t)) return 'staff';
  if (/epee|lame|sabre|dague|katana|hache|couteau|glaive|rapiere|poignard|marteau|masse/.test(t)) return 'sword';
  return item.slot === 'dos' ? 'bow' : item.slot === 'main_gauche' ? 'shield' : 'sword';
}

const SHADE = 'rgba(0,0,0,0.22)';
const LIGHT = 'rgba(255,255,255,0.28)';

/** Objet tenu, dessiné dans une boîte de 24 × 64. */
function HeldGlyph({ kind, color }: { kind: Held; color: string }) {
  switch (kind) {
    case 'bow':
      return (
        <>
          <path d="M17 2 Q-7 32 17 62" fill="none" stroke={color} strokeWidth="4" strokeLinecap="square" />
          <path d="M17 2 L17 62" stroke="#e8f3ff" strokeWidth="1.2" />
          <rect x="3" y="28" width="5" height="8" fill={SHADE} />
        </>
      );
    case 'shield':
      return (
        <>
          <path d="M1 12 h22 v22 q0 15 -11 21 q-11 -6 -11 -21 z" fill={color} />
          <path d="M1 12 h22 v5 h-22 z" fill={LIGHT} />
          <rect x="10" y="17" width="4" height="32" fill={SHADE} />
          <rect x="3" y="28" width="18" height="4" fill={SHADE} />
        </>
      );
    case 'staff':
      return (
        <>
          <rect x="10" y="8" width="4" height="56" fill={WOOD} />
          <rect x="12" y="8" width="2" height="56" fill={SHADE} />
          <rect x="6" y="0" width="12" height="12" fill={color} />
          <rect x="6" y="0" width="12" height="4" fill={LIGHT} />
        </>
      );
    default:
      return (
        <>
          <rect x="10" y="0" width="4" height="4" fill={color} />
          <rect x="8" y="4" width="8" height="38" fill={color} />
          <rect x="8" y="4" width="3" height="38" fill={LIGHT} />
          <rect x="2" y="42" width="20" height="4" fill="#ffcb45" />
          <rect x="10" y="46" width="4" height="12" fill={WOOD_DARK} />
          <rect x="8" y="58" width="8" height="4" fill="#ffcb45" />
        </>
      );
  }
}

/** Zones cliquables du mannequin (comme dans Minecraft : on clique la partie du corps). */
const HIT: Record<GearSlot, { x: number; y: number; w: number; h: number }> = {
  dos: { x: 66, y: 0, w: 30, h: 26 },
  tete: { x: 30, y: 2, w: 36, h: 32 },
  torse: { x: 30, y: 34, w: 36, h: 42 },
  jambes: { x: 30, y: 76, w: 36, h: 36 },
  pieds: { x: 28, y: 112, w: 40, h: 22 },
  main_droite: { x: 0, y: 26, w: 30, h: 70 },
  main_gauche: { x: 66, y: 26, w: 30, h: 70 },
};

export default function StandFigure({
  gear,
  className = '',
  active = null,
  onSlot,
}: {
  gear: GearItem[];
  className?: string;
  /** Emplacement mis en évidence (survol / sélection) */
  active?: GearSlot | null;
  /** Rend le mannequin cliquable (profil modifiable) */
  onSlot?: (slot: GearSlot) => void;
}) {
  const by = new Map(gear.map((g) => [g.slot, g]));
  const head = by.get('tete');
  const chest = by.get('torse');
  const legs = by.get('jambes');
  const feet = by.get('pieds');
  const right = by.get('main_droite');
  const left = by.get('main_gauche');
  const back = by.get('dos');

  const label = gear.length
    ? `Porte-armure équipé : ${gear.map((g) => `${GEAR_SLOT_LABELS[g.slot].label} — ${g.title ?? '?'}`).join(', ')}`
    : 'Porte-armure vide';

  return (
    <svg viewBox="0 0 96 144" className={className} role="img" aria-label={label} shapeRendering="crispEdges">
      {/* Dos : dessiné en premier, il dépasse derrière l'épaule */}
      {back && (
        <g transform="translate(50 60) rotate(32) scale(1.25) translate(-12 -40)">
          <HeldGlyph kind={heldKind(back)} color={colorOf(back)} />
        </g>
      )}

      {/* Socle */}
      <rect x="14" y="132" width="68" height="10" fill={STONE} />
      <rect x="14" y="132" width="68" height="3" fill="rgba(255,255,255,0.25)" />
      <rect x="14" y="139" width="68" height="3" fill={STONE_DARK} />

      {/* Montants en bois */}
      <rect x="36" y="84" width="4" height="48" fill={WOOD} />
      <rect x="56" y="84" width="4" height="48" fill={WOOD} />
      <rect x="32" y="80" width="32" height="4" fill={WOOD_DARK} />
      <rect x="46" y="20" width="4" height="60" fill={WOOD} />
      <rect x="20" y="36" width="56" height="4" fill={WOOD_DARK} />
      <rect x="20" y="40" width="4" height="38" fill={WOOD} />
      <rect x="72" y="40" width="4" height="38" fill={WOOD} />
      <rect x="44" y="14" width="8" height="8" fill={WOOD_DARK} />

      {/* Jambes */}
      {legs && (
        <g fill={colorOf(legs)}>
          <rect x="32" y="76" width="32" height="8" />
          <rect x="32" y="84" width="12" height="30" />
          <rect x="52" y="84" width="12" height="30" />
          <rect x="32" y="76" width="32" height="3" fill={LIGHT} />
          <rect x="40" y="84" width="4" height="30" fill={SHADE} />
          <rect x="60" y="84" width="4" height="30" fill={SHADE} />
        </g>
      )}

      {/* Pieds */}
      {feet && (
        <g fill={colorOf(feet)}>
          <rect x="29" y="112" width="18" height="20" />
          <rect x="49" y="112" width="18" height="20" />
          <rect x="29" y="112" width="18" height="4" fill={LIGHT} />
          <rect x="49" y="112" width="18" height="4" fill={LIGHT} />
          <rect x="29" y="128" width="18" height="4" fill={SHADE} />
          <rect x="49" y="128" width="18" height="4" fill={SHADE} />
        </g>
      )}

      {/* Torse */}
      {chest && (
        <g fill={colorOf(chest)}>
          <rect x="32" y="36" width="32" height="40" />
          <rect x="16" y="34" width="16" height="14" />
          <rect x="64" y="34" width="16" height="14" />
          <rect x="16" y="34" width="64" height="4" fill={LIGHT} />
          <rect x="46" y="44" width="4" height="26" fill={SHADE} />
          <rect x="32" y="70" width="32" height="6" fill={SHADE} />
        </g>
      )}

      {/* Tête */}
      {head && (
        <g fill={colorOf(head)}>
          <rect x="34" y="6" width="28" height="14" />
          <rect x="34" y="20" width="6" height="12" />
          <rect x="56" y="20" width="6" height="12" />
          <rect x="46" y="20" width="4" height="8" />
          <rect x="34" y="6" width="28" height="4" fill={LIGHT} />
          <rect x="58" y="10" width="4" height="22" fill={SHADE} />
        </g>
      )}

      {/* Mains (la main droite du mannequin est à gauche de l'image, comme face à toi) */}
      {right && (
        <g transform="translate(2 22)">
          <HeldGlyph kind={heldKind(right)} color={colorOf(right)} />
        </g>
      )}
      {left && (
        <g transform="translate(70 22)">
          <HeldGlyph kind={heldKind(left)} color={colorOf(left)} />
        </g>
      )}

      {/* Surbrillance + zones cliquables */}
      {active && (
        <rect
          x={HIT[active].x + 1}
          y={HIT[active].y + 1}
          width={HIT[active].w - 2}
          height={HIT[active].h - 2}
          fill="rgba(255,203,69,0.12)"
          stroke="#ffcb45"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          pointerEvents="none"
        />
      )}
      {onSlot &&
        (Object.keys(HIT) as GearSlot[]).map((s) => (
          <rect key={s} {...{ x: HIT[s].x, y: HIT[s].y, width: HIT[s].w, height: HIT[s].h }} fill="transparent" className="cursor-pointer" aria-hidden onClick={() => onSlot(s)}>
            <title>{GEAR_SLOT_LABELS[s].label}</title>
          </rect>
        ))}
    </svg>
  );
}
