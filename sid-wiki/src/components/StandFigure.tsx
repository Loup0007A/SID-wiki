import { GEAR_COLOR_RE, GEAR_SLOT_LABELS, GEAR_TRANSFORM_LIMITS, isGearShape, type GearItem, type GearShape, type GearSlot } from '@/lib/wiki';

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
  if (item.color && GEAR_COLOR_RE.test(item.color)) return item.color;
  return item.rarity ? RARITY_COLORS[Math.min(8, Math.max(1, item.rarity)) - 1] : STEEL;
}

type Held = GearShape;

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Devine la forme à dessiner d'après le nom de la fiche ; sinon forme par défaut de l'emplacement. */
function heldKind(item: GearItem): Held {
  if (item.discovered && isGearShape(item.shape)) return item.shape; // choix d'un admin
  const t = norm(item.title ?? '');
  if (/arbalete/.test(t)) return 'crossbow';
  if (/fusil a pompe|shotgun/.test(t)) return 'shotgun';
  if (/\bak\b|ak-?47|kalach|fusil d.assaut/.test(t)) return 'ak47';
  if (/mitraillette|\bsmg\b|\buzi\b/.test(t)) return 'smg';
  if (/pistolet|revolver|flingue/.test(t)) return 'pistol';
  if (/grenade/.test(t)) return 'grenade';
  if (/shuriken/.test(t)) return 'shuriken';
  if (/kunai/.test(t)) return 'kunai';
  if (/dagues? doubles?|doubles? dagues?/.test(t)) return 'dual_daggers';
  if (/lames? (secrete|cachee)s?/.test(t)) return 'hidden_blades';
  if (/ordinateur|laptop|\bpc\b/.test(t)) return 'computer';
  if (/fiole|potion|flacon|elixir/.test(t)) return 'vial';
  if (/\barcs?\b|fronde/.test(t)) return 'bow';
  if (/bouclier|pavois|egide|targe/.test(t)) return 'shield';
  if (/hache|marteau|masse|faux/.test(t)) return 'axe';
  if (/lance|trident|hallebarde|javelot|pique/.test(t)) return 'spear';
  if (/baton|sceptre|canne|baguette/.test(t)) return 'staff';
  if (/dague|couteau|poignard/.test(t)) return 'dagger';
  if (/epee|lame|sabre|katana|glaive|rapiere/.test(t)) return 'sword';
  return item.slot === 'dos' ? 'bow' : item.slot === 'main_gauche' ? 'shield' : 'sword';
}

const SHADE = 'rgba(0,0,0,0.22)';
const LIGHT = 'rgba(255,255,255,0.28)';

const METAL_DARK = '#27313f';
const GLASS = 'rgba(207,232,255,0.55)';

/** Une dague (lame vers le haut), réutilisée pour les dagues doubles. */
function Dagger({ color }: { color: string }) {
  return (
    <>
      <rect x="10" y="22" width="4" height="4" fill={color} />
      <rect x="9" y="26" width="6" height="18" fill={color} />
      <rect x="9" y="26" width="2" height="18" fill={LIGHT} />
      <rect x="4" y="44" width="16" height="4" fill="#ffcb45" />
      <rect x="10" y="48" width="4" height="10" fill={WOOD_DARK} />
      <rect x="9" y="58" width="6" height="4" fill="#ffcb45" />
    </>
  );
}

/** Armes à feu : dessinées à l'horizontale (canon à droite, boîte 64 × 24) puis redressées canon vers le haut. */
function Gun({ children }: { children: React.ReactNode }) {
  return <g transform="translate(0 64) rotate(-90)">{children}</g>;
}

/** Objet tenu, dessiné dans une boîte de 24 × 64. */
function HeldGlyph({ kind, color }: { kind: Held; color: string }) {
  switch (kind) {
    case 'crossbow':
      return (
        <>
          <rect x="10" y="10" width="4" height="50" fill={WOOD} />
          <rect x="12" y="10" width="2" height="50" fill={SHADE} />
          <path d="M-2 22 Q12 2 26 22" fill="none" stroke={color} strokeWidth="4" strokeLinecap="square" />
          <path d="M-2 22 L26 22" stroke="#e8f3ff" strokeWidth="1.2" />
          <rect x="11" y="0" width="2" height="22" fill="#e8f3ff" />
          <rect x="8" y="44" width="8" height="4" fill={METAL_DARK} />
        </>
      );
    case 'pistol':
      return (
        <Gun>
          <rect x="18" y="5" width="28" height="8" fill={color} />
          <rect x="18" y="5" width="28" height="2" fill={LIGHT} />
          <rect x="18" y="11" width="28" height="2" fill={SHADE} />
          <rect x="18" y="13" width="9" height="11" fill={METAL_DARK} />
          <rect x="27" y="13" width="7" height="2" fill={METAL_DARK} />
          <rect x="32" y="13" width="2" height="5" fill={METAL_DARK} />
        </Gun>
      );
    case 'smg':
      return (
        <Gun>
          <rect x="2" y="7" width="12" height="3" fill={METAL_DARK} />
          <rect x="2" y="7" width="3" height="9" fill={METAL_DARK} />
          <rect x="14" y="5" width="30" height="8" fill={color} />
          <rect x="14" y="5" width="30" height="2" fill={LIGHT} />
          <rect x="44" y="7" width="12" height="4" fill={color} />
          <rect x="44" y="9" width="12" height="2" fill={SHADE} />
          <rect x="17" y="13" width="6" height="8" fill={METAL_DARK} />
          <rect x="30" y="13" width="5" height="11" fill={METAL_DARK} />
        </Gun>
      );
    case 'ak47':
      return (
        <Gun>
          <path d="M0 6 h14 v7 h-10 l-4 3 z" fill={WOOD} />
          <rect x="14" y="5" width="20" height="8" fill={color} />
          <rect x="14" y="5" width="20" height="2" fill={LIGHT} />
          <rect x="34" y="6" width="13" height="6" fill={WOOD} />
          <rect x="34" y="10" width="13" height="2" fill={SHADE} />
          <rect x="47" y="8" width="17" height="2" fill={color} />
          <rect x="59" y="4" width="2" height="4" fill={color} />
          <rect x="16" y="13" width="5" height="8" fill={WOOD_DARK} />
          <path d="M25 13 h7 l4 11 h-7 z" fill={METAL_DARK} />
        </Gun>
      );
    case 'shotgun':
      return (
        <Gun>
          <path d="M0 7 h14 v7 h-9 l-5 3 z" fill={WOOD} />
          <rect x="14" y="6" width="14" height="8" fill={color} />
          <rect x="28" y="6" width="36" height="4" fill={color} />
          <rect x="14" y="6" width="50" height="2" fill={LIGHT} />
          <rect x="28" y="11" width="28" height="3" fill={METAL_DARK} />
          <rect x="36" y="10" width="13" height="6" fill={WOOD_DARK} />
          <rect x="18" y="14" width="6" height="4" fill={METAL_DARK} />
        </Gun>
      );
    case 'grenade':
      return (
        <>
          <rect x="9" y="22" width="6" height="6" fill="#cfd8e2" />
          <rect x="15" y="22" width="6" height="3" fill="#cfd8e2" />
          <rect x="19" y="22" width="2" height="12" fill="#cfd8e2" />
          <circle cx="5" cy="24" r="3" fill="none" stroke="#ffcb45" strokeWidth="1.5" />
          <rect x="6" y="28" width="12" height="24" fill={color} />
          <rect x="4" y="31" width="16" height="18" fill={color} />
          <rect x="4" y="31" width="4" height="18" fill={LIGHT} />
          <rect x="4" y="36" width="16" height="2" fill={SHADE} />
          <rect x="4" y="43" width="16" height="2" fill={SHADE} />
          <rect x="11" y="28" width="2" height="24" fill={SHADE} />
        </>
      );
    case 'shuriken':
      return (
        <>
          <path d="M12 18 L16 30 L28 34 L16 38 L12 50 L8 38 L-4 34 L8 30 Z" fill={color} />
          <path d="M12 18 L8 30 L-4 34 L8 34 L12 34 Z" fill={LIGHT} />
          <rect x="10" y="32" width="4" height="4" fill={METAL_DARK} />
        </>
      );
    case 'kunai':
      return (
        <>
          <path d="M12 8 L18 28 L12 40 L6 28 Z" fill={color} />
          <path d="M12 8 L6 28 L12 40 Z" fill={LIGHT} />
          <rect x="10" y="40" width="4" height="12" fill={METAL_DARK} />
          <rect x="10" y="43" width="4" height="2" fill="#ff6b5b" />
          <rect x="10" y="47" width="4" height="2" fill="#ff6b5b" />
          <circle cx="12" cy="57" r="4" fill="none" stroke={color} strokeWidth="2.5" />
        </>
      );
    case 'dual_daggers':
      return (
        <>
          <g transform="rotate(-22 12 46)">
            <Dagger color={color} />
          </g>
          <g transform="rotate(22 12 46)">
            <Dagger color={color} />
          </g>
        </>
      );
    case 'hidden_blades':
      return (
        <>
          <rect x="10" y="12" width="4" height="4" fill={color} />
          <rect x="9" y="16" width="6" height="26" fill={color} />
          <rect x="9" y="16" width="2" height="26" fill={LIGHT} />
          <rect x="5" y="40" width="14" height="20" fill={WOOD_DARK} />
          <rect x="5" y="40" width="14" height="3" fill="#ffcb45" />
          <rect x="5" y="49" width="14" height="2" fill={SHADE} />
          <rect x="5" y="57" width="14" height="3" fill="#ffcb45" />
          <rect x="10" y="44" width="4" height="4" fill="#cfd8e2" />
        </>
      );
    case 'computer':
      return (
        <>
          <rect x="0" y="22" width="24" height="18" fill={color} />
          <rect x="2" y="24" width="20" height="14" fill="#0b1a33" />
          <rect x="4" y="27" width="10" height="2" fill="#7fe0a0" />
          <rect x="4" y="31" width="14" height="2" fill="#5fd0e6" />
          <rect x="4" y="35" width="7" height="2" fill="#7fe0a0" />
          <rect x="-2" y="40" width="28" height="5" fill={color} />
          <rect x="-2" y="40" width="28" height="2" fill={LIGHT} />
          <rect x="8" y="42" width="8" height="2" fill={SHADE} />
        </>
      );
    case 'vial':
      return (
        <>
          <rect x="9" y="20" width="6" height="4" fill={WOOD} />
          <rect x="10" y="24" width="4" height="8" fill={GLASS} />
          <rect x="5" y="32" width="14" height="18" fill={GLASS} />
          <rect x="7" y="50" width="10" height="2" fill={GLASS} />
          <rect x="5" y="38" width="14" height="12" fill={color} />
          <rect x="7" y="50" width="10" height="2" fill={color} />
          <rect x="6" y="33" width="2" height="15" fill="rgba(255,255,255,0.45)" />
          <rect x="13" y="41" width="2" height="2" fill={LIGHT} />
          <rect x="10" y="45" width="2" height="2" fill={LIGHT} />
        </>
      );
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
    case 'dagger':
      return <Dagger color={color} />;
    case 'axe':
      return (
        <>
          <rect x="10" y="2" width="4" height="62" fill={WOOD} />
          <rect x="12" y="2" width="2" height="62" fill={SHADE} />
          <path d="M14 4 h6 v4 h4 v14 h-4 v4 h-6 z" fill={color} />
          <path d="M10 8 h-6 v4 h-4 v6 h4 v4 h6 z" fill={color} />
          <rect x="20" y="8" width="4" height="14" fill={LIGHT} />
        </>
      );
    case 'spear':
      return (
        <>
          <rect x="10" y="14" width="4" height="50" fill={WOOD} />
          <rect x="12" y="14" width="2" height="50" fill={SHADE} />
          <path d="M12 -6 L18 8 L14 16 H10 L6 8 Z" fill={color} />
          <path d="M12 -6 L6 8 L10 16 H12 Z" fill={LIGHT} />
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

const clamp = (v: unknown, min: number, max: number, fallback: number) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/**
 * Une arme posée à son emplacement, avec le placement choisi par un admin :
 * le décalage se fait dans le repère de l'image (droite / bas), la taille et la rotation autour du centre de l'arme.
 */
function Held({ item, base }: { item: GearItem; base: string }) {
  const L = GEAR_TRANSFORM_LIMITS;
  const dx = clamp(item.dx, -L.offset, L.offset, 0);
  const dy = clamp(item.dy, -L.offset, L.offset, 0);
  const scale = clamp(item.scale, L.scaleMin, L.scaleMax, 1);
  const rot = clamp(item.rot, -L.rot, L.rot, 0);
  return (
    <g transform={`translate(${dx} ${dy})`}>
      <g transform={base}>
        <g transform={`translate(12 32) rotate(${rot}) scale(${scale}) translate(-12 -32)`}>
          <HeldGlyph kind={heldKind(item)} color={colorOf(item)} />
        </g>
      </g>
    </g>
  );
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
  standImage = null,
}: {
  gear: GearItem[];
  className?: string;
  /** Image (fond transparent, format 2:3) qui remplace le mannequin en bois */
  standImage?: string | null;
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
      {back && <Held item={back} base="translate(50 60) rotate(32) scale(1.25) translate(-12 -40)" />}

      {/* Le mannequin : image transparente choisie par les admins, sinon le porte-armure en bois */}
      {standImage ? (
        <image href={standImage} x="0" y="0" width="96" height="144" preserveAspectRatio="xMidYMid meet" style={{ imageRendering: 'auto' }} />
      ) : (
        <>
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
        </>
      )}

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
      {right && <Held item={right} base="translate(2 22)" />}
      {left && <Held item={left} base="translate(70 22)" />}

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
