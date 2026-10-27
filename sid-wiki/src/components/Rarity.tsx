/** Rareté (1 à 8) : losanges laiton, comme les poinçons d'une planche. */
export default function Rarity({ value, className = '' }: { value: number | null | undefined; className?: string }) {
  if (!value) return null;
  return (
    <span className={`inline-flex items-center gap-[2px] text-brass-400 ${className}`} role="img" title={`Rareté ${value}/8`} aria-label={`Rareté ${value} sur 8`}>
      {Array.from({ length: value }, (_, i) => (
        <svg key={i} viewBox="0 0 10 10" width="0.8em" height="0.8em" aria-hidden className="flex-none">
          <path d="M5 0.6 9.4 5 5 9.4 0.6 5Z" fill="currentColor" />
          <path d="M5 2.2 7.8 5 5 7.8" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.9" />
        </svg>
      ))}
    </span>
  );
}
