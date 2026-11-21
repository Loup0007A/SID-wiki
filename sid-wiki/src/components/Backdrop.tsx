/**
 * Fond du Wiki (Lot 91) : couleur, halos et motif du thème (classe .fond,
 * fonds.css), puis les feuilles qui planent. Les évents changent le thème
 * (html[data-theme], voir EventDecor et getFondTheme).
 */
const N = 22;

function suite(i: number) {
  const x = Math.sin(i * 7.31 + 2.7) * 24634.6345;
  return x - Math.floor(x);
}

const ITEMS = Array.from({ length: N }, (_, i) => ({
  left: `${(suite(i) * 100).toFixed(1)}%`,
  s: `${(10 + suite(i + 40) * 13).toFixed(1)}px`,
  t: `${(16 + suite(i + 80) * 14).toFixed(1)}s`,
  dl: `${(-suite(i + 120) * 30).toFixed(1)}s`,
  dx: `${Math.round(20 + suite(i + 160) * 50)}px`,
  k: `var(--p${(i % 4) + 1})`,
}));

export default function Backdrop() {
  return (
    <>
      <div aria-hidden className="fond" />
      <div aria-hidden className="fond-particules">
        {ITEMS.map((it, i) => (
          <i key={i} style={{ left: it.left, '--s': it.s, '--t': it.t, '--dl': it.dl, '--dx': it.dx, '--k': it.k } as React.CSSProperties} />
        ))}
      </div>
    </>
  );
}
