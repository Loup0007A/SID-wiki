import Link from 'next/link';

/** Liens légaux, en bas de chaque page du wiki. */
export default function LegalFooter() {
  return (
    <footer className="mt-12 flex flex-wrap justify-center gap-x-5 gap-y-1 border-t border-white/10 pt-4 text-xs font-bold text-olive-700">
      <Link href="/cgu" className="hover:underline">Conditions d&apos;utilisation</Link>
      <Link href="/confidentialite" className="hover:underline">Confidentialité</Link>
      <a href="https://sid-quest.vercel.app/dashboard/privacy" className="hover:underline">Mes données</a>
    </footer>
  );
}
