/**
 * Emblèmes gravés du Codex (Lot 50) : un trait, une teinte (currentColor),
 * un léger aplat. Ils remplacent les anciennes icônes bleues : chaque
 * catégorie prend sa couleur (voir --cat dans globals.css).
 */

export type EmblemName =
  | 'logo'
  | 'lieux'
  | 'armes'
  | 'mobs'
  | 'objets'
  | 'skills'
  | 'profils'
  | 'accueil'
  | 'chercher'
  | 'favoris'
  | 'hasard'
  | 'tags'
  | 'aide'
  | 'admin'
  | 'menu';

const T = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const F = { fill: 'currentColor', fillOpacity: 0.18, stroke: 'none' };

function art(name: EmblemName) {
  switch (name) {
    case 'lieux':
      return (
        <>
          <path {...F} d="M3 6.5 8.5 4.5 15.5 7 21 5v13l-5.5 2-7-2.5L3 19.5z" />
          <path {...T} d="M3 6.5 8.5 4.5 15.5 7 21 5v13l-5.5 2-7-2.5L3 19.5zM8.5 4.5v13M15.5 7v13" />
          <path {...T} d="M12 14.5s-2.6-2.6-2.6-4.4a2.6 2.6 0 0 1 5.2 0c0 1.8-2.6 4.4-2.6 4.4z" fill="currentColor" fillOpacity={0.35} />
        </>
      );
    case 'armes':
      return (
        <>
          <path {...T} d="M4 4h3.5l9 9M20 4h-3.5l-9 9M14.5 14.5l4 4M9.5 14.5l-4 4M17 13l-4 4M7 13l4 4" />
          <path {...T} d="M18.2 18.2l2 2M5.8 18.2l-2 2" strokeWidth={2.4} />
        </>
      );
    case 'mobs':
      return (
        <>
          <path {...F} d="M6 10a6 6 0 0 1 12 0v3.5c0 1.6-1 2.5-2 3v2.5H8v-2.5c-1-.5-2-1.4-2-3z" />
          <path {...T} d="M6 10a6 6 0 0 1 12 0v3.5c0 1.6-1 2.5-2 3v2.5H8v-2.5c-1-.5-2-1.4-2-3zM6.5 7.5C4.5 6.5 3.5 4.5 3.8 2.8c1.8.6 3.2 1.8 4 3.2M17.5 7.5c2-1 3-3 2.7-4.7-1.8.6-3.2 1.8-4 3.2M10.5 19v-2M13.5 19v-2" />
          <path d="M8.6 11.6l2.2.8-.6 1.6zM15.4 11.6l-2.2.8.6 1.6z" fill="currentColor" />
        </>
      );
    case 'objets':
      return (
        <>
          <path {...F} d="M8.5 8.5c-3 2-4.5 5-4.5 8 0 2.5 2 3.5 8 3.5s8-1 8-3.5c0-3-1.5-6-4.5-8z" />
          <path {...T} d="M8.5 8.5c-3 2-4.5 5-4.5 8 0 2.5 2 3.5 8 3.5s8-1 8-3.5c0-3-1.5-6-4.5-8zM8.5 8.5 7 4.5h10l-1.5 4M8 8.5h8M12 12v4M10 14h4" />
        </>
      );
    case 'skills':
      return (
        <>
          <path {...F} d="M12 3c.8 5 2.2 6.4 7 7.2-4.8.8-6.2 2.2-7 7.8-.8-5.6-2.2-7-7-7.8 4.8-.8 6.2-2.2 7-7.2z" />
          <path {...T} d="M12 3c.8 5 2.2 6.4 7 7.2-4.8.8-6.2 2.2-7 7.8-.8-5.6-2.2-7-7-7.8 4.8-.8 6.2-2.2 7-7.2zM19 16.5v4M17 18.5h4M5 3.5v3M3.5 5h3" />
        </>
      );
    case 'profils':
      return (
        <>
          <path {...F} d="M8 9.5V5.5l4-2 4 2v4c0 3-1.8 4.5-4 5.5-2.2-1-4-2.5-4-5.5z" />
          <path {...T} d="M8 9.5V5.5l4-2 4 2v4c0 3-1.8 4.5-4 5.5-2.2-1-4-2.5-4-5.5zM5 21c.6-3.2 3.2-5 7-5s6.4 1.8 7 5M12 15v6" />
        </>
      );
    case 'accueil':
      return (
        <>
          <path {...F} d="M4.5 10.5 12 4l7.5 6.5V20h-15z" />
          <path {...T} d="M3 11.5 12 4l9 7.5M5 10v10h14V10M10 20v-5h4v5" />
        </>
      );
    case 'chercher':
      return (
        <>
          <circle cx="10.5" cy="10.5" r="6.5" {...F} />
          <circle cx="10.5" cy="10.5" r="6.5" {...T} />
          <path {...T} d="m15.5 15.5 5 5M7.5 9a3.4 3.4 0 0 1 2.4-2.4" />
        </>
      );
    case 'favoris':
      return (
        <>
          <path {...F} d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
          <path {...T} d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
        </>
      );
    case 'hasard':
      return (
        <>
          <path {...F} d="M4 7.5 12 3.5l8 4v9l-8 4-8-4z" />
          <path {...T} d="M4 7.5 12 3.5l8 4v9l-8 4-8-4zM4 7.5l8 4 8-4M12 11.5v9" />
          <circle cx="12" cy="7.4" r="1" fill="currentColor" />
          <circle cx="7.6" cy="12.4" r="1" fill="currentColor" />
          <circle cx="8.6" cy="16" r="1" fill="currentColor" />
          <circle cx="16.4" cy="14.2" r="1" fill="currentColor" />
        </>
      );
    case 'tags':
      return (
        <>
          <path {...F} d="M3.5 12.5V4h8.5l8.5 8.5-8 8z" />
          <path {...T} d="M3.5 12.5V4h8.5l8.5 8.5-8 8z" />
          <circle cx="8" cy="8.5" r="1.5" {...T} />
        </>
      );
    case 'aide':
      return (
        <>
          <circle cx="12" cy="12" r="8.5" {...F} />
          <circle cx="12" cy="12" r="8.5" {...T} />
          <path {...T} d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6" />
          <circle cx="12" cy="16.8" r="1" fill="currentColor" />
        </>
      );
    case 'admin':
      return (
        <>
          <path {...F} d="M12 3l7 3v5c0 4.6-3 8-7 10-4-2-7-5.4-7-10V6z" />
          <path {...T} d="M12 3l7 3v5c0 4.6-3 8-7 10-4-2-7-5.4-7-10V6zM9 12l2 2 4-4.5" />
        </>
      );
    case 'menu':
      return <path {...T} d="M4 7h16M4 12h16M4 17h10" />;
    case 'logo':
      return (
        <>
          <circle cx="12" cy="12" r="9.5" {...F} />
          <circle cx="12" cy="12" r="9.5" {...T} />
          <circle cx="12" cy="12" r="7.2" {...T} strokeWidth={0.8} strokeDasharray="1.2 1.4" />
          <path {...T} d="M7.5 7.5l9 9M16.5 7.5l-9 9" strokeWidth={1.8} />
        </>
      );
  }
}

export default function Emblem({ name, className = '', size = '1.2em', title }: { name: EmblemName; className?: string; size?: string | number; title?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`inline-block flex-none align-[-0.2em] ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {art(name)}
    </svg>
  );
}
