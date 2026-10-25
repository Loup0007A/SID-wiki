/**
 * Fond du Codex (Lot 50) : vert sapin, lumière de lampe en haut à gauche et
 * grain de feutre très léger. Rien ne bouge. Garde la classe `waves-root` :
 * les fêtes (Halloween, Noël, Grande Chasse…) y posent leur propre ciel.
 */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.92  0 0 0 0 0.88  0 0 0 0 0.78  0 0 0 0.06 0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)'/%3E%3C/svg%3E\")";

export default function Backdrop() {
  return (
    <div
      aria-hidden
      className="waves-root pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        backgroundColor: '#0e1b18',
        backgroundImage: `${GRAIN}, radial-gradient(ellipse 65% 42% at 18% -8%, rgba(214, 170, 76, 0.11), transparent 70%), radial-gradient(ellipse 60% 50% at 100% 110%, rgba(8, 18, 16, 0.65), transparent 70%)`,
      }}
    />
  );
}
