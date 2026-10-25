import type { Metadata } from 'next';
import { Privacy } from '@/components/legal/LegalContent';

export const metadata: Metadata = { title: 'Confidentialité · Wiki du S.I.D.' };

export default function PrivacyPage() {
  return (
    <article className="card mx-auto max-w-3xl p-5 sm:p-8">
      <h1 className="mb-3 font-typewriter text-2xl font-bold text-olive-800">Confidentialité</h1>
      <Privacy site="wiki" />
    </article>
  );
}
