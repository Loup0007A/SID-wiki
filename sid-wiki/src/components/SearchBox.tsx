'use client';

import { useState } from 'react';

/** Barre de recherche de l'en-tête (ordinateur) : loupe, champ large, pastille « / ». */
export default function SearchBox() {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState('');

  return (
    <form action="/recherche" role="search" className="group relative w-full">
      <svg
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-olive-700 transition group-focus-within:text-brass-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        id="global-search"
        name="q"
        type="search"
        autoComplete="off"
        placeholder="Chercher une fiche, un numéro, un tag…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="h-11 w-full rounded-lg border border-[color:var(--rule-2)] bg-[#0f1d1a] pl-11 pr-14 font-body text-base text-ink outline-none transition placeholder:text-olive-600 focus:border-brass-400 focus:ring-2 focus:ring-brass-400/25 [&::-webkit-search-cancel-button]:hidden"
      />
      {!focused && !value && (
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-[color:var(--rule-2)] px-1.5 py-0.5 font-body text-xs font-semibold text-olive-600">
          /
        </kbd>
      )}
    </form>
  );
}
